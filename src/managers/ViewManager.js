import Tabs from '../components/Tabs.js';

export default class ViewManager {
    constructor({ editableArea, markdownArea, markdownContainer, previewPane, lineNumbers, tabButtons }, converter) {
        this.editableArea = editableArea;
        this.markdownArea = markdownArea;
        this.markdownContainer = markdownContainer;
        this.previewPane = previewPane;
        this.lineNumbers = lineNumbers;
        this.tabButtons = tabButtons;
        this.converter = converter;
    }

    show(mode) {
        const views = {
            wysiwyg: [this.editableArea, 'block'],
            markdown: [this.markdownContainer, 'flex'],
            preview: [this.previewPane, 'block']
        };
        Object.entries(views).forEach(([name, [element, display]]) => {
            element.style.display = name === mode ? display : 'none';
        });
        if (this.tabButtons) Tabs.activate(this.tabButtons, mode);
    }

    syncMarkdownFromHtml() {
        this.markdownArea.value = this.converter.toMarkdown(this.editableArea);
    }

    syncHtmlFromMarkdown() {
        this.editableArea.innerHTML = this.converter.toHtml(this.markdownArea.value);
    }

    updatePreview(markdown = this.markdownArea.value) {
        const source = markdown || this.converter.toMarkdown(this.editableArea);
        this.previewPane.innerHTML = this.converter.toHtml(source);
    }

    updateLineNumbers() {
        const count = Math.max(1, this.markdownArea.value.split('\n').length);
        this.lineNumbers.innerHTML = Array.from(
            { length: count },
            (_, index) => `<div>${index + 1}</div>`
        ).join('');
    }

    syncLineNumbersScroll() {
        this.lineNumbers.scrollTop = this.markdownArea.scrollTop;
    }
}
