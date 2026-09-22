import DOMBuilder from './DOMBuilder.js';
import UndoManager from './UndoManager.js';
import MarkdownConverter from './MarkdownConverter.js';
import EditorController from './managers/EditorController.js';
import EditorEventBinder from './managers/EditorEventBinder.js';

const BUTTONS = [
    { id: 'bold', label: 'B', title: 'Bold', execCommand: 'bold' },
    { id: 'italic', label: 'I', title: 'Italic', execCommand: 'italic' },
    { id: 'ul', label: '•', title: 'Unordered list', execCommand: 'insertUnorderedList' },
    { id: 'ol', label: '1.', title: 'Ordered list', execCommand: 'insertOrderedList' }
];

/** Composition facade for consumers that need a modular editor instance. */
export default class ModularMarkdownWriter {
    constructor(elementId, options = {}) {
        this.host = document.getElementById(elementId);
        if (!this.host) throw new Error(`Host element ${elementId} not found`);
        this.options = { initialValue: '', initialMode: 'wysiwyg', ...options };
        this.converter = new MarkdownConverter();
        this.undoManager = new UndoManager(50);
        this.currentMode = this.options.initialMode;
        this.elements = DOMBuilder.build(this.host, {
            toolbarConfigs: BUTTONS,
            onToolbarClick: (config) => this.execute(config),
            onTabChange: (mode) => this.switchToMode(mode),
            onHeadingSelect: (level) => this.applyHeading(level)
        });
        Object.assign(this, this.elements);
        this.controller = new EditorController({
            elements: this.elements,
            converter: this.converter,
            undoManager: this.undoManager,
            initialMode: this.currentMode,
            onUpdate: () => this.options.onUpdate?.(this.getValue())
        });
        this.events = new EditorEventBinder(this).bind();
        this.setValue(this.options.initialValue, true);
        this.controller.setMode(this.currentMode);
    }

    execute(config) {
        if (this.currentMode !== 'wysiwyg' || !config.execCommand) return;
        document.execCommand(config.execCommand, false, config.value || null);
        this.undoManager.push(this.editableArea.innerHTML);
        this.options.onUpdate?.(this.getValue());
    }

    applyHeading(level) {
        if (this.currentMode === 'wysiwyg') {
            document.execCommand('formatBlock', false, level ? `H${level}` : 'P');
            this.undoManager.push(this.editableArea.innerHTML);
            return;
        }
        const value = this.markdownArea.value;
        const start = this.markdownArea.selectionStart;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', lineStart);
        const line = value.slice(lineStart, lineEnd < 0 ? value.length : lineEnd);
        const content = line.replace(/^#+\s*/, '');
        const replacement = `${'#'.repeat(level)}${level ? ' ' : ''}${content}`;
        this.markdownArea.value = value.slice(0, lineStart) + replacement + value.slice(lineEnd < 0 ? value.length : lineEnd);
        this.undoManager.push(this.markdownArea.value);
    }

    switchToMode(mode) {
        this.controller.setMode(mode);
        this.currentMode = mode;
    }

    setValue(markdown = '', resetHistory = false) {
        this.controller.setMarkdown(markdown, resetHistory);
    }

    getValue() {
        return this.currentMode === 'markdown'
            ? this.markdownArea.value
            : this.converter.toMarkdown(this.editableArea);
    }

    getMarkdownContent() { return this.controller.content.getMarkdown(); }
    setMarkdownContent(value, resetHistory = false) { this.controller.setMarkdown(value, resetHistory); }
    getHtmlContent() { return this.controller.content.getHtml(); }
    setHtmlContent(value, resetHistory = false) { this.controller.setHtml(value, resetHistory); }
    getRawHtml() { return this.controller.content.getRawHtml(); }
    setRawHtml(value, resetHistory = false) { this.controller.content.setRawHtml(value); if (resetHistory) this.undoManager.reset(this.editableArea.innerHTML); }

    undo() { const state = this.undoManager.undo(); if (state !== null) this.restore(state); }
    redo() { const state = this.undoManager.redo(); if (state !== null) this.restore(state); }
    restore(state) { if (this.currentMode === 'wysiwyg') this.editableArea.innerHTML = state; else this.markdownArea.value = state; this.controller.views.updatePreview(); }

    destroy() {
        this.events.unbind();
        this.host.innerHTML = '';
        this.host = null;
    }
}
