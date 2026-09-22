import DomUtils from '../utils/DomUtils.js';

/**
 * Encapsulates toolbar rendering and interaction wiring.
 * It only knows how to render toolbar controls; actions belong to the caller.
 */
export default class Toolbar {
    static build(parent, configs, onClick) {
        const toolbar = DomUtils.createElement('div', 'md-toolbar');
        parent.appendChild(toolbar);
        this.render(toolbar, configs, onClick);
        return toolbar;
    }

    static render(toolbar, configs = [], onClick = () => {}) {
        toolbar.replaceChildren();
        configs.forEach((config) => {
            if (config.id === 'separator') {
                toolbar.appendChild(DomUtils.createElement('div', 'md-toolbar-separator'));
                return;
            }

            const button = DomUtils.createElement('button', [
                'md-toolbar-button',
                `md-toolbar-button-${config.id}`
            ]);
            button.type = 'button';
            button.dataset.buttonId = config.id;
            button.title = config.title || '';
            button.textContent = config.label || config.id;
            button.addEventListener('click', () => onClick(config, button));
            toolbar.appendChild(button);
        });
    }
}
