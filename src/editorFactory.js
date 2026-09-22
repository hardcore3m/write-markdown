import DOMBuilder from './DOMBuilder.js';
import EditorController from './managers/EditorController.js';

/**
 * Creates an editor UI and exposes the separated view/content controller.
 * Existing consumers can continue using DOMBuilder directly.
 */
export function createEditorUI(host, options = {}) {
    const elements = DOMBuilder.build(host, options);
    const editor = { ...elements, converter: options.converter, undoManager: options.undoManager };
    const controller = new EditorController(editor);
    controller.views.show(options.initialMode || 'wysiwyg');
    return { elements, controller };
}

export { DOMBuilder, EditorController };
