import DomUtils from '../utils/DomUtils.js';

/** Read-only Preview tab view. */
export default class PreviewView {
    static build(parent) {
        const pane = DomUtils.createElement('div', 'md-preview-pane');
        pane.style.display = 'none';
        pane.dataset.view = 'preview';
        pane.setAttribute('aria-live', 'polite');
        parent.appendChild(pane);
        return pane;
    }
}
