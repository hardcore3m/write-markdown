import ContentManager from './ContentManager.js';
import ViewManager from './ViewManager.js';

/**
 * Facade for editor state that coordinates content and visual views.
 * Commands, dialogs and history remain outside this class.
 */
export default class EditorController {
    constructor(editor) {
        this.editor = editor;
        this.content = new ContentManager(editor, editor.converter);
        this.views = new ViewManager(editor, editor.converter);
        this.mode = editor.currentMode || 'wysiwyg';
    }

    switchTo(mode) {
        if (!['wysiwyg', 'markdown', 'preview'].includes(mode)) return;
        if (mode === 'wysiwyg') this.views.syncHtmlFromMarkdown();
        if (mode === 'markdown') this.views.syncMarkdownFromHtml();
        this.mode = mode;
        this.views.show(mode);
        this.views.updateLineNumbers();
        this.views.updatePreview(this.content.getMarkdown());
        this.editor.currentMode = mode;
    }

    setMarkdown(markdown, resetHistory = false) {
        this.content.setMarkdown(markdown);
        this.views.updateLineNumbers();
        this.views.updatePreview(markdown);
        if (resetHistory) this.editor.undoManager.reset(this.historyState());
    }

    setHtml(html, resetHistory = false) {
        this.content.setHtml(html);
        this.views.updateLineNumbers();
        this.views.updatePreview(this.content.getMarkdown());
        if (resetHistory) this.editor.undoManager.reset(this.historyState());
    }

    historyState() {
        return this.mode === 'wysiwyg'
            ? this.editor.editableArea.innerHTML
            : this.editor.markdownArea.value;
    }
}
