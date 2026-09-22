import ContentManager from './ContentManager.js';
import ViewManager from './ViewManager.js';

const MODES = new Set(['wysiwyg', 'markdown', 'preview']);

/** Coordinates independent content and view services without owning DOM construction. */
export default class EditorController {
    constructor({ elements, converter, undoManager, initialMode = 'wysiwyg', onUpdate = null }) {
        this.elements = elements;
        this.converter = converter;
        this.undoManager = undoManager;
        this.onUpdate = onUpdate;
        this.content = new ContentManager(elements, converter);
        this.views = new ViewManager(elements, converter);
        this.mode = MODES.has(initialMode) ? initialMode : 'wysiwyg';
    }

    get historyState() {
        return this.mode === 'wysiwyg'
            ? this.elements.editableArea.innerHTML
            : this.elements.markdownArea.value;
    }

    setMode(mode) {
        if (!MODES.has(mode)) throw new Error(`Unsupported editor mode: ${mode}`);
        if (mode === 'wysiwyg') this.views.syncHtmlFromMarkdown();
        if (mode === 'markdown') this.views.syncMarkdownFromHtml();
        this.mode = mode;
        this.views.show(mode);
        this.views.updateLineNumbers();
        this.views.updatePreview(this.content.getMarkdown());
        return mode;
    }

    setMarkdown(markdown, resetHistory = false) {
        this.content.setMarkdown(markdown);
        this.views.updateLineNumbers();
        this.views.updatePreview(markdown);
        if (resetHistory) this.undoManager.reset(this.historyState);
        this.notify();
    }

    setHtml(html, resetHistory = false) {
        this.content.setHtml(html);
        this.views.updateLineNumbers();
        this.views.updatePreview(this.content.getMarkdown());
        if (resetHistory) this.undoManager.reset(this.historyState);
        this.notify();
    }

    notify() {
        if (this.onUpdate) this.onUpdate(this.content.getMarkdown());
    }
}
