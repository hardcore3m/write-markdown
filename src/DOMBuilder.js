// src/DOMBuilder.js
import DomUtils from './utils/DomUtils.js';

/**
 * DOMBuilder - constructs editor DOM structure and returns refs
 */
export default class DOMBuilder {
    /**
     * Build basic editor layout
     * @param {HTMLElement} host
     * @returns {object}
     */
    static build(host) {
        const wrapper = DomUtils.createElement('div', 'md-wysiwyg-editor-wrapper');
        host.appendChild(wrapper);
        const toolbar = DomUtils.createElement('div', 'md-toolbar'); wrapper.appendChild(toolbar);
        const contentArea = DomUtils.createElement('div', 'md-editor-content-area');
        const editableArea = DomUtils.createElement('div', 'md-editable-area'); editableArea.setAttribute('contenteditable', 'true'); editableArea.setAttribute('spellcheck', 'false');
        contentArea.appendChild(editableArea);
        const markdownContainer = DomUtils.createElement('div', 'md-markdown-editor-container'); markdownContainer.style.display = 'none';
        const lineNumbers = DomUtils.createElement('div', 'md-markdown-line-numbers');
        const textareaWrapper = DomUtils.createElement('div', 'md-markdown-textarea-wrapper');
        const markdownArea = DomUtils.createElement('textarea', 'md-markdown-area'); markdownArea.setAttribute('spellcheck', 'false');
        textareaWrapper.appendChild(markdownArea); markdownContainer.appendChild(lineNumbers); markdownContainer.appendChild(textareaWrapper);
        contentArea.appendChild(markdownContainer);
        wrapper.appendChild(contentArea);
        const tabs = DomUtils.createElement('div', 'md-tabs');
        const wysiwygTab = DomUtils.createElement('button', 'md-tab-button'); wysiwygTab.textContent = 'WYSIWYG';
        const markdownTab = DomUtils.createElement('button', 'md-tab-button'); markdownTab.textContent = 'Markdown';
        const previewTab = DomUtils.createElement('button', 'md-tab-button'); previewTab.textContent = 'Preview';
        tabs.appendChild(wysiwygTab); tabs.appendChild(markdownTab); tabs.appendChild(previewTab);
        wrapper.appendChild(tabs);
        const headingMenu = DomUtils.createElement('div', 'md-heading-menu'); headingMenu.style.display = 'none'; wrapper.appendChild(headingMenu);
        const tableGrid = DomUtils.createElement('div', 'md-table-grid-selector'); tableGrid.style.display = 'none'; wrapper.appendChild(tableGrid);
        const contextualTableToolbar = DomUtils.createElement('div', 'md-contextual-table-toolbar'); contextualTableToolbar.style.display = 'none'; wrapper.appendChild(contextualTableToolbar);
        const previewPane = DomUtils.createElement('div', 'md-preview-pane'); previewPane.style.display = 'none'; wrapper.appendChild(previewPane);
        return { wrapper, toolbar, editableArea, markdownArea, markdownContainer, lineNumbers, wysiwygTab, markdownTab, previewTab, headingMenu, tableGrid, contextualTableToolbar, previewPane };
    }

    /**
     * Populate toolbar with button configs
     * @param {HTMLElement} toolbar
     * @param {Array} configs
     * @param {Function} onClick
     */
    static populateToolbar(toolbar, configs, onClick) {
        toolbar.innerHTML = '';
        configs.forEach(cfg => {
            if (cfg.id === 'separator') { toolbar.appendChild(DomUtils.createElement('div', 'md-toolbar-separator')); return; }
            const btn = DomUtils.createElement('button', ['md-toolbar-button', `md-toolbar-button-${cfg.id}`]); btn.type = 'button'; btn.dataset.buttonId = cfg.id; btn.title = cfg.title || ''; btn.innerHTML = cfg.label || cfg.id; btn.addEventListener('click', () => onClick(cfg, btn)); toolbar.appendChild(btn);
        });
    }

    /**
     * Build heading menu items
     * @param {HTMLElement} headingMenu
     * @param {Function} onSelect
     */
    static buildHeadingMenu(headingMenu, onSelect) {
        headingMenu.innerHTML = '';
        const options = [{label:'Paragraph', level:0}, {label:'Heading 1', level:1}, {label:'Heading 2', level:2}, {label:'Heading 3', level:3}, {label:'Heading 4', level:4}, {label:'Heading 5', level:5}, {label:'Heading 6', level:6}];
        options.forEach(opt => { const item = DomUtils.createElement('div', 'md-heading-menu-item'); item.textContent = opt.label; item.dataset.level = opt.level; item.addEventListener('click', () => onSelect(opt.level)); headingMenu.appendChild(item); });
    }
}
