import DomUtils from '../utils/DomUtils.js';

/** The WYSIWYG tab view. */
export default class WysiwygView {
    static build(parent) {
        const view = DomUtils.createElement('div', 'md-editable-area');
        view.contentEditable = 'true';
        view.spellcheck = false;
        view.dataset.view = 'wysiwyg';
        parent.appendChild(view);
        return view;
    }
}
