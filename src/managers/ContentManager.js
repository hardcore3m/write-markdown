/**
 * Handles content conversion and DOM synchronization.
 * It deliberately exposes only content operations, not UI or history concerns.
 */
export default class ContentManager {
    constructor({ editableArea, markdownArea }, converter) {
        this.editableArea = editableArea;
        this.markdownArea = markdownArea;
        this.converter = converter;
    }

    getMarkdown() {
        return this.markdownArea.value || this.converter.toMarkdown(this.editableArea);
    }

    getHtml() {
        return this.converter.toHtml(this.getMarkdown());
    }

    setMarkdown(markdown = '') {
        this.markdownArea.value = markdown;
        this.editableArea.innerHTML = this.converter.toHtml(markdown);
    }

    setHtml(html = '') {
        this.editableArea.innerHTML = html;
        this.markdownArea.value = this.converter.toMarkdown(this.editableArea);
    }

    setRawHtml(html = '') {
        const parser = new DOMParser();
        const document = parser.parseFromString(html, 'text/html');
        this.setHtml(document.body.innerHTML);
    }

    getRawHtml() {
        return this.editableArea.innerHTML;
    }
}
