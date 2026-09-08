// src/markdownWriter.js
/**
 * Main editor class that composes utilities and managers.
 * Exposes a thin public API: constructor(hostId, options), setValue, getValue, switchToMode, destroy
 * Includes import/export functionality for markdown and HTML formats.
 * Includes getters/setters for content manipulation in different formats.
 */
import DOMBuilder from './DOMBuilder.js';
import DOMUtils from './utils/DomUtils.js';
import UndoManager from './UndoManager.js';
import MarkdownConverter from './MarkdownConverter.js';
import DialogManager from './DialogManager.js';
import TableManager from './TableManager.js';

export default class MarkdownWriter {
    /**
     * @param {string} elementId
     * @param {Object} options
     */
    constructor(elementId, options = {}) {
        this.host = document.getElementById(elementId);
        if (!this.host) throw new Error(`Host element ${elementId} not found`);
        this.options = Object.assign({ initialValue: '', showToolbar: true, initialMode: 'wysiwyg' }, options);
        this.undoManager = new UndoManager(50);
        this.converter = new MarkdownConverter();
        this.currentMode = this.options.initialMode;
        this.isUpdatingFromUndoRedo = false;
        this.savedRange = null;

        // build DOM
        const built = DOMBuilder.build(this.host);
        this.wrapper = built.wrapper; this.toolbar = built.toolbar; this.editableArea = built.editableArea; this.markdownArea = built.markdownArea; this.markdownContainer = built.markdownContainer; this.previewPane = built.previewPane; this.wysiwygTab = built.wysiwygTab; this.markdownTab = built.markdownTab; this.previewTab = built.previewTab; this.headingMenu = built.headingMenu; this.lineNumbers = built.lineNumbers;

        // toolbar buttons (icons abbreviated)
        this.buttons = [
            { id: 'heading', label: 'H', title: 'Headings', action: '_toggleHeadingMenu' },
            { id: 'separator' },
            { id: 'bold', label: 'B', title: 'Bold', execCommand: 'bold', type: 'inline', mdPrefix: '**', mdSuffix: '**' },
            { id: 'italic', label: 'I', title: 'Italic', execCommand: 'italic', type: 'inline', mdPrefix: '*', mdSuffix: '*' },
            { id: 'separator' },
            { id: 'link', label: '🔗', title: 'Link', action: '_insertLink' },
            { id: 'inlinecode', label: '`', title: 'Inline Code', action: '_insertInlineCode', mdPrefix: '`', mdSuffix: '`' },
            { id: 'codeblock', label: '</>', title: 'Code Block', action: '_insertCodeBlock', mdPrefix: '``\n', mdSuffix: '\n```' },
            { id: 'separator' },
            { id: 'ul', label: '•', title: 'Unordered List', execCommand: 'insertUnorderedList', mdPrefix: '- ' },
            { id: 'ol', label: '1.', title: 'Ordered List', execCommand: 'insertOrderedList', mdPrefix: '1. ' },
            { id: 'indent', label: '→', title: 'Indent', action: '_handleIndent' },
            { id: 'outdent', label: '←', title: 'Outdent', action: '_handleOutdent' },
            { id: 'separator' },
            { id: 'blockquote', label: '❝', title: 'Blockquote', mdPrefix: '> ' },
            { id: 'hr', label: '—', title: 'Horizontal Rule', action: '_insertHorizontalRule' },
            { id: 'separator' },
            { id: 'image', label: '🖼', title: 'Insert Image', action: '_insertImage' },
            { id: 'table', label: '▦', title: 'Insert Table', action: '_insertTable' },
            { id: 'separator' },
            { id: 'export', label: '💾', title: 'Export', action: '_toggleExportMenu' },
            { id: 'import', label: '📂', title: 'Import', action: '_triggerImport' }
        ];

        DOMBuilder.populateToolbar(this.toolbar, this.buttons, (cfg, btn) => this._handleToolbarClick(cfg, btn));
        DOMBuilder.buildHeadingMenu(this.headingMenu, (level) => this.applyHeading(level));

        this._bindEvents();

        this.setValue(this.options.initialValue || '', true);
        const seed = (this.currentMode === 'wysiwyg') ? this.editableArea.innerHTML : this.markdownArea.value;
        this.undoManager.reset(seed);
    }

    _bindEvents() {
        document.addEventListener('selectionchange', () => this._updateToolbarState());
        this.editableArea.addEventListener('input', (e) => this._onEditableInput(e));
        this.editableArea.addEventListener('keydown', (e) => this._onEditableKeyDown(e));
        this.editableArea.addEventListener('click', (e) => this._onEditableClick(e));
        this.markdownArea.addEventListener('input', (e) => this._onMarkdownInput(e));
        this.markdownArea.addEventListener('keydown', (e) => this._onMarkdownKeyDown(e));
        this.markdownArea.addEventListener('scroll', () => this._syncLineNumbers());
        this.wysiwygTab.addEventListener('click', () => this.switchToMode('wysiwyg'));
        this.markdownTab.addEventListener('click', () => this.switchToMode('markdown'));
        this.previewTab.addEventListener('click', () => this.switchToMode('preview'));
    }

    _onEditableInput() {
        if (!this.isUpdatingFromUndoRedo) this.undoManager.push(this.editableArea.innerHTML);
        if (this.options.onUpdate) this.options.onUpdate(this.getValue());
        this._updatePreview();
    }

    _onMarkdownInput() {
        if (!this.isUpdatingFromUndoRedo) this.undoManager.push(this.markdownArea.value);
        this._updateLineNumbers();
        if (this.options.onUpdate) this.options.onUpdate(this.getValue());
        this._updatePreview();
    }

    _onEditableKeyDown(e) {
        if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); this.undo(); }
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); this.redo(); }
    }

    _onMarkdownKeyDown(e) {
        if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); this.undo(); }
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); this.redo(); }
    }

    _onEditableClick(e) {
        const cell = DOMUtils.findParent(e.target, ['TD', 'TH']);
        if (cell) { this.currentTableSelection = { cell, row: DOMUtils.findParent(cell, 'TR'), table: DOMUtils.findParent(cell, 'TABLE') }; this._showContextualTableToolbar(cell); }
        else { this._hideContextualTableToolbar(); }
    }

    _handleToolbarClick(cfg) {
        if (cfg.action && typeof this[cfg.action] === 'function') { this[cfg.action](); return; }
        if (this.currentMode === 'wysiwyg') {
            if (cfg.execCommand) { document.execCommand(cfg.execCommand, false, cfg.value || null); this._finalizeUpdate(this.editableArea.innerHTML); }
        } else if (this.currentMode === 'markdown') {
            // simple markdown wrapper behaviour
            this._applyMarkdownFormatting(cfg);
        }
    }

    _toggleHeadingMenu() { this.headingMenu.style.display = (this.headingMenu.style.display === 'block') ? 'none' : 'block'; }

    applyHeading(level) {
        const tag = level > 0 ? `H${level}` : 'P';
        if (this.currentMode === 'wysiwyg') {
            document.execCommand('formatBlock', false, tag);
            this._finalizeUpdate(this.editableArea.innerHTML);
        } else {
            const ta = this.markdownArea; const v = ta.value; const start = ta.selectionStart; const lineStart = v.lastIndexOf('\n', start - 1) + 1; const lineEnd = v.indexOf('\n', lineStart); const current = v.substring(lineStart, lineEnd === -1 ? v.length : lineEnd);
            const mdPrefix = level > 0 ? `${'#'.repeat(level)} ` : '';
            const existing = current.match(/^(#+\s)/);
            let newLine = existing ? (mdPrefix ? mdPrefix + current.substring(existing[1].length) : current.substring(existing[1].length)) : mdPrefix + current;
            ta.value = v.substring(0, lineStart) + newLine + v.substring(lineEnd === -1 ? v.length : lineEnd);
            this._finalizeUpdate(ta.value);
        }
    }

    async _insertImage() {
        if (this.currentMode === 'wysiwyg') {
            const sel = window.getSelection(); if (sel.rangeCount > 0) this.savedRange = sel.getRangeAt(0).cloneRange();
        } else { this.savedRange = { start: this.markdownArea.selectionStart, end: this.markdownArea.selectionEnd }; }
        const data = await DialogManager.showFormDialog('Insert Image', [{ label: 'Image URL', name: 'url', type: 'url', required: true }, { label: 'Alt text', name: 'alt', type: 'text' }], this.wrapper);
        if (!data) return;
        this._performInsertImage(data.url, data.alt || '');
    }

    _performInsertImage(url, alt) {
        if (this.currentMode === 'wysiwyg') {
            this.editableArea.focus(); let range; const sel = window.getSelection(); if (this.savedRange instanceof Range && this.editableArea.contains(this.savedRange.commonAncestorContainer)) range = this.savedRange; else range = document.createRange(); range.collapse(true);
            sel.removeAllRanges(); sel.addRange(range);
            const img = document.createElement('img'); img.src = url; img.alt = alt; range.deleteContents(); const frag = document.createDocumentFragment(); frag.appendChild(img); const pAfter = document.createElement('p'); frag.appendChild(pAfter); range.insertNode(frag);
            const newRange = document.createRange(); newRange.setStart(pAfter, 0); newRange.collapse(true); sel.removeAllRanges(); sel.addRange(newRange);
            this._finalizeUpdate(this.editableArea.innerHTML);
        } else {
            const ta = this.markdownArea; const start = this.savedRange && typeof this.savedRange.start === 'number' ? this.savedRange.start : ta.selectionStart; const end = this.savedRange && typeof this.savedRange.end === 'number' ? this.savedRange.end : ta.selectionEnd; const md = `![${alt}](${url})`;
            const v = ta.value; const prefix = (start > 0 && v[start - 1] !== '\n') ? '\n\n' : ''; const suffix = (end < v.length && v[end] !== '\n') ? '\n\n' : '\n'; const text = prefix + md + suffix;
            ta.value = v.substring(0, start) + text + v.substring(end);
            this._finalizeUpdate(ta.value);
        }
        this.savedRange = null; this._updatePreview();
    }

    _insertTable() {
        const rowsStr = prompt('Rows (1-10)', '2'); if (!rowsStr) return; const colsStr = prompt('Cols (1-10)', '3'); if (!colsStr) return; const rows = parseInt(rowsStr, 10); const cols = parseInt(colsStr, 10);
        if (this.currentMode === 'wysiwyg') {
            this.editableArea.focus(); const sel = window.getSelection(); let range = document.createRange(); if (sel && sel.rangeCount > 0 && this.editableArea.contains(sel.getRangeAt(0).commonAncestorContainer)) range = sel.getRangeAt(0);
            TableManager.insertTableWysiwyg(this.editableArea, range, rows, cols); this._finalizeUpdate(this.editableArea.innerHTML);
        } else { TableManager.insertTableMarkdown(this.markdownArea, rows, cols, this.savedRange); }
        this._updatePreview();
    }

    _insertCodeBlock() { if (this.currentMode === 'wysiwyg') { /* ...similar to previous implementation*/ this._finalizeUpdate(this.editableArea.innerHTML); } else { this._applyMarkdownFormatting({ id: 'codeblock' }); } }
    _insertInlineCode() { if (this.currentMode === 'wysiwyg') { /* ... */ this._finalizeUpdate(this.editableArea.innerHTML); } else this._applyMarkdownFormatting({ id: 'inlinecode' }); }
    _insertHorizontalRule() { if (this.currentMode === 'wysiwyg') { document.execCommand('insertHorizontalRule'); this._finalizeUpdate(this.editableArea.innerHTML); } else { const ta = this.markdownArea; ta.value += '\n\n---\n\n'; this._finalizeUpdate(ta.value); } }

    _insertLink() { if (this.currentMode === 'wysiwyg') { const url = prompt('Enter URL', 'https://'); if (!url) return; document.execCommand('createLink', false, url); this._finalizeUpdate(this.editableArea.innerHTML); } else { this._applyMarkdownFormatting({ id: 'link' }); } }

    _handleIndent() { if (this.currentMode === 'wysiwyg') { document.execCommand('indent'); this._finalizeUpdate(this.editableArea.innerHTML); } }
    _handleOutdent() { if (this.currentMode === 'wysiwyg') { document.execCommand('outdent'); this._finalizeUpdate(this.editableArea.innerHTML); } }

    _applyMarkdownFormatting(cfg) {
        const ta = this.markdownArea; const v = ta.value; const start = ta.selectionStart; const end = ta.selectionEnd; const sel = v.substring(start, end);
        if (!cfg) return;
        const id = cfg.id;
        switch (id) {
            case 'bold': { const wrap = `**${sel || 'bold text'}**`; ta.value = v.substring(0, start) + wrap + v.substring(end); ta.setSelectionRange(start + 2, start + 2 + (sel ? sel.length : 9)); break; }
            case 'italic': { const wrap = `*${sel || 'italic text'}*`; ta.value = v.substring(0, start) + wrap + v.substring(end); ta.setSelectionRange(start + 1, start + 1 + (sel ? sel.length : 11)); break; }
            case 'link': { const url = prompt('Enter link URL', 'https://'); if (!url) return; const text = sel || 'link text'; const md = `[${text}](${url})`; ta.value = v.substring(0, start) + md + v.substring(end); break; }
            case 'codeblock': { const code = sel || 'code'; const before = (start > 0 && v[start - 1] !== '\n') ? '\n' : ''; const wrapped = `${before}\`\`\`\n${code}\n\`\`\`\n`; ta.value = v.substring(0, start) + wrapped + v.substring(end); break; }
            default: { /* fallback: insert prefix */ if (cfg.mdPrefix) { const prefix = cfg.mdPrefix; const text = sel || (cfg.id === 'ul' || cfg.id === 'ol' ? 'List item' : ''); const insert = prefix + text; ta.value = v.substring(0, start) + insert + v.substring(end); } }
        }
        ta.focus(); this._finalizeUpdate(ta.value); this._updatePreview();
    }

    _finalizeUpdate(content) { if (!this.isUpdatingFromUndoRedo && content !== undefined) this.undoManager.push(content); if (this.options.onUpdate) this.options.onUpdate(this.getValue()); }

    undo() { const r = this.undoManager.undo(); if (r !== null) { this.isUpdatingFromUndoRedo = true; if (this.currentMode === 'wysiwyg') this.editableArea.innerHTML = r; else this.markdownArea.value = r; this.isUpdatingFromUndoRedo = false; this._updatePreview(); } }
    redo() { const r = this.undoManager.redo(); if (r !== null) { this.isUpdatingFromUndoRedo = true; if (this.currentMode === 'wysiwyg') this.editableArea.innerHTML = r; else this.markdownArea.value = r; this.isUpdatingFromUndoRedo = false; this._updatePreview(); } }

    switchToMode(mode) {
        if (this.currentMode === mode) return;
        const prev = (this.currentMode === 'wysiwyg') ? this.editableArea.innerHTML : this.markdownArea.value;
        this.currentMode = mode;
        if (mode === 'wysiwyg') { this.editableArea.innerHTML = this.converter.toHtml(this.markdownArea.value); this.editableArea.style.display = 'block'; this.markdownContainer.style.display = 'none'; this.previewPane.style.display = 'none'; this.wysiwygTab.classList.add('active'); this.markdownTab.classList.remove('active'); this.previewTab.classList.remove('active'); }
        else if (mode === 'markdown') { this.markdownArea.value = this.converter.toMarkdown(this.editableArea); this.editableArea.style.display = 'none'; this.markdownContainer.style.display = 'flex'; this.previewPane.style.display = 'none'; this.wysiwygTab.classList.remove('active'); this.markdownTab.classList.add('active'); this.previewTab.classList.remove('active'); }
        else if (mode === 'preview') { // preview shows HTML of markdown
            const html = this.converter.toHtml(this.markdownArea.value || this.converter.toMarkdown(this.editableArea));
            this.previewPane.innerHTML = html; this.previewPane.style.display = 'block'; this.editableArea.style.display = 'none'; this.markdownContainer.style.display = 'none'; this.previewTab.classList.add('active'); this.wysiwygTab.classList.remove('active'); this.markdownTab.classList.remove('active');
        }
        const current = (this.currentMode === 'wysiwyg') ? this.editableArea.innerHTML : this.markdownArea.value;
        if (prev !== current) this.undoManager.reset(current);
        this._updatePreview();
    }

    _updateLineNumbers() { if (!this.lineNumbers) return; const lines = this.markdownArea.value.split('\n').length || 1; let html = ''; for (let i = 1; i <= lines; i++) html += `<div>${i}</div>`; this.lineNumbers.innerHTML = html; }
    _syncLineNumbers() { if (!this.lineNumbers) return; this.lineNumbers.scrollTop = this.markdownArea.scrollTop; }

    _updateToolbarState() { /* simplified toolbar state update */ }

    _updatePreview() { try { const html = this.converter.toHtml(this.markdownArea.value || this.converter.toMarkdown(this.editableArea)); this.previewPane.innerHTML = html; } catch (err) { this.previewPane.innerHTML = '<p>Preview error</p>'; } }

    setValue(markdown, initial = false) { const html = this.converter.toHtml(markdown || ''); this.editableArea.innerHTML = html; this.markdownArea.value = markdown || ''; if (this.currentMode === 'markdown') this._updateLineNumbers(); this._updatePreview(); }

    getValue() { if (this.currentMode === 'markdown') return this.markdownArea.value; return this.converter.toMarkdown(this.editableArea); }

    _showContextualTableToolbar() { /* left minimal */ }
    _hideContextualTableToolbar() { /* left minimal */ }

    // ========== Content Manipulation Methods ==========

    /**
     * Get content in Markdown format
     * Independent of current editor mode
     * @returns {string} Markdown content
     */
    getMarkdownContent() {
        if (this.currentMode === 'markdown') {
            return this.markdownArea.value;
        }
        // Convert from WYSIWYG HTML to Markdown
        return this.converter.toMarkdown(this.editableArea);
    }

    /**
     * Set content from Markdown string
     * Updates both WYSIWYG and Markdown editors
     * @param {string} markdown - Markdown content to set
     * @param {boolean} updateUndoStack - Whether to reset undo/redo stack
     */
    setMarkdownContent(markdown, updateUndoStack = false) {
        const html = this.converter.toHtml(markdown || '');
        this.editableArea.innerHTML = html;
        this.markdownArea.value = markdown || '';
        if (this.currentMode === 'markdown') {
            this._updateLineNumbers();
        }
        this._updatePreview();
        if (updateUndoStack) {
            const seed = (this.currentMode === 'wysiwyg') ? this.editableArea.innerHTML : this.markdownArea.value;
            this.undoManager.reset(seed);
        }
    }

    /**
     * Get content in HTML format
     * Returns converted HTML from either editor mode
     * @returns {string} HTML content
     */
    getHtmlContent() {
        if (this.currentMode === 'wysiwyg') {
            return this.converter.toHtml(this.converter.toMarkdown(this.editableArea));
        }
        // Convert from Markdown to HTML
        return this.converter.toHtml(this.markdownArea.value);
    }

    /**
     * Set content from HTML string
     * Parses HTML and sets it in WYSIWYG editor
     * Converts to Markdown for markdown editor
     * @param {string} html - HTML content to set
     * @param {boolean} updateUndoStack - Whether to reset undo/redo stack
     */
    setHtmlContent(html, updateUndoStack = false) {
        // Parse HTML to ensure it's valid
        const parser = new DOMParser();
        const doc = parser.parseFromString(html || '', 'text/html');
        const sanitizedHtml = doc.body.innerHTML;

        // Set WYSIWYG content
        this.editableArea.innerHTML = sanitizedHtml;

        // Convert to Markdown for markdown editor
        const markdown = this.converter.toMarkdown(this.editableArea);
        this.markdownArea.value = markdown;

        this._updatePreview();

        if (updateUndoStack) {
            const seed = (this.currentMode === 'wysiwyg') ? this.editableArea.innerHTML : this.markdownArea.value;
            this.undoManager.reset(seed);
        }
    }

    /**
     * Get raw HTML from WYSIWYG editor without conversion
     * Useful when you need the exact HTML being edited
     * @returns {string} Raw HTML content from WYSIWYG editor
     */
    getRawHtml() {
        return this.editableArea.innerHTML;
    }

    /**
     * Set raw HTML directly to WYSIWYG editor without conversion
     * Bypasses converter logic for direct HTML manipulation
     * @param {string} html - Raw HTML to set
     * @param {boolean} updateUndoStack - Whether to reset undo/redo stack
     */
    setRawHtml(html, updateUndoStack = false) {
        // Parse HTML to ensure it's valid
        const parser = new DOMParser();
        const doc = parser.parseFromString(html || '', 'text/html');
        const sanitizedHtml = doc.body.innerHTML;

        this.editableArea.innerHTML = sanitizedHtml;

        // Also sync markdown representation
        const markdown = this.converter.toMarkdown(this.editableArea);
        this.markdownArea.value = markdown;

        this._updatePreview();

        if (updateUndoStack) {
            const seed = (this.currentMode === 'wysiwyg') ? this.editableArea.innerHTML : this.markdownArea.value;
            this.undoManager.reset(seed);
        }
    }

    // ========== Import/Export Methods ==========

    /**
     * Export content as Markdown
     * Downloads a .md file with the current markdown content
     */
    exportAsMarkdown() {
        const markdown = this.getMarkdownContent();
        const filename = prompt('Export filename (without .md)', 'document') || 'document';
        this._downloadFile(markdown, `${filename}.md`, 'text/markdown');
    }

    /**
     * Export content as HTML
     * Downloads a .html file with the current HTML content
     */
    exportAsHtml() {
        const html = this.getHtmlContent();
        const filename = prompt('Export filename (without .html)', 'document') || 'document';
        const wrappedHtml = this._wrapHtmlDocument(html);
        this._downloadFile(wrappedHtml, `${filename}.html`, 'text/html');
    }

    /**
     * Toggle export menu with options
     */
    _toggleExportMenu() {
        const choice = prompt('Export as:\n1. Markdown (.md)\n2. HTML (.html)\n\nEnter 1 or 2:', '1');
        if (choice === '1') {
            this.exportAsMarkdown();
        } else if (choice === '2') {
            this.exportAsHtml();
        }
    }

    /**
     * Trigger file import dialog
     */
    _triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.html,.txt';
        input.addEventListener('change', (e) => this._handleFileImport(e));
        input.click();
    }

    /**
     * Handle file import
     * @param {Event} event - File input change event
     */
    _handleFileImport(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', (e) => {
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') return;

                const filename = file.name.toLowerCase();
                
                if (filename.endsWith('.md') || filename.endsWith('.txt')) {
                    // Import as Markdown
                    this.setMarkdownContent(content, true);
                } else if (filename.endsWith('.html')) {
                    // Import HTML - extract body content
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    const htmlContent = doc.body.innerHTML || content;
                    
                    // Set HTML content (handles conversion to markdown automatically)
                    this.setHtmlContent(htmlContent, true);
                    
                    // Switch to WYSIWYG mode
                    if (this.currentMode !== 'wysiwyg') {
                        this.switchToMode('wysiwyg');
                    }
                } else {
                    alert('Unsupported file format. Please import .md, .txt, or .html files.');
                }
            } catch (error) {
                alert(`Error importing file: ${error.message}`);
            }
        });

        reader.readAsText(file);
    }

    /**
     * Download file helper
     * @param {string} content - File content
     * @param {string} filename - Output filename
     * @param {string} mimeType - MIME type
     */
    _downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Wrap HTML content in a complete HTML document
     * @param {string} bodyContent - HTML body content
     * @returns {string} Complete HTML document
     */
    _wrapHtmlDocument(bodyContent) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3, h4, h5, h6 { margin-top: 20px; margin-bottom: 10px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; border-radius: 4px; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
        blockquote { border-left: 4px solid #ddd; margin: 10px 0; padding: 10px 15px; background: #f9f9f9; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
    }

    destroy() { document.removeEventListener('selectionchange', () => this._updateToolbarState()); if (this.host) this.host.innerHTML = ''; this.host = null; }
}
