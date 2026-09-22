import DomUtils from '../utils/DomUtils.js';

/** The Markdown tab view, including its line-number gutter. */
export default class MarkdownView {
    static build(parent) {
        const container = DomUtils.createElement('div', 'md-markdown-editor-container');
        container.style.display = 'none';
        container.dataset.view = 'markdown';

        const lineNumbers = DomUtils.createElement('div', 'md-markdown-line-numbers');
        const textareaWrapper = DomUtils.createElement('div', 'md-markdown-textarea-wrapper');
        const textarea = DomUtils.createElement('textarea', 'md-markdown-area');
        textarea.spellcheck = false;
        textarea.setAttribute('aria-label', 'Markdown editor');

        textareaWrapper.appendChild(textarea);
        container.append(lineNumbers, textareaWrapper);
        parent.appendChild(container);
        return { container, lineNumbers, textarea };
    }
}
