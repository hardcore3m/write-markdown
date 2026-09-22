import DomUtils from '../utils/DomUtils.js';

/** Renders the mode navigation only. Mode switching is injected by the caller. */
export default class Tabs {
    static build(parent, onChange) {
        const container = DomUtils.createElement('div', 'md-tabs');
        const definitions = [
            ['wysiwyg', 'WYSIWYG'],
            ['markdown', 'Markdown'],
            ['preview', 'Preview']
        ];
        const buttons = {};

        definitions.forEach(([mode, label]) => {
            const button = DomUtils.createElement('button', 'md-tab-button');
            button.type = 'button';
            button.dataset.mode = mode;
            button.textContent = label;
            button.addEventListener('click', () => onChange(mode));
            container.appendChild(button);
            buttons[mode] = button;
        });

        parent.appendChild(container);
        return { container, buttons };
    }

    static activate(buttons, mode) {
        Object.entries(buttons).forEach(([name, button]) => {
            button.classList.toggle('active', name === mode);
            button.setAttribute('aria-selected', String(name === mode));
        });
    }
}
