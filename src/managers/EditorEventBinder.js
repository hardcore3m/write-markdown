/**
 * Binds editor DOM events without owning editor business rules.
 * This keeps event registration separate from command and state management.
 */
export default class EditorEventBinder {
    constructor(editor) {
        this.editor = editor;
        this.handlers = [];
    }

    bind() {
        const { editor } = this;
        this.on(document, 'selectionchange', () => editor._updateToolbarState());
        this.on(editor.editableArea, 'input', () => editor._onEditableInput());
        this.on(editor.editableArea, 'keydown', (event) => editor._onEditableKeyDown(event));
        this.on(editor.editableArea, 'click', (event) => editor._onEditableClick(event));
        this.on(editor.markdownArea, 'input', () => editor._onMarkdownInput());
        this.on(editor.markdownArea, 'keydown', (event) => editor._onMarkdownKeyDown(event));
        this.on(editor.markdownArea, 'scroll', () => editor.viewManager.syncLineNumbersScroll());
        return this;
    }

    on(target, type, listener) {
        target.addEventListener(type, listener);
        this.handlers.push({ target, type, listener });
    }

    unbind() {
        this.handlers.forEach(({ target, type, listener }) => {
            target.removeEventListener(type, listener);
        });
        this.handlers = [];
    }
}
