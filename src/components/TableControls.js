import DomUtils from '../utils/DomUtils.js';

/** Optional table UI elements kept independent from the editor controller. */
export class TableGrid {
    static build(parent) {
        const element = DomUtils.createElement('div', 'md-table-grid-selector');
        element.style.display = 'none';
        parent.appendChild(element);
        return element;
    }
}

export class ContextualTableToolbar {
    static build(parent) {
        const element = DomUtils.createElement('div', 'md-contextual-table-toolbar');
        element.style.display = 'none';
        parent.appendChild(element);
        return element;
    }
}
