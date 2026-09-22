import DomUtils from '../utils/DomUtils.js';

/** A heading menu with no knowledge of the editor implementation. */
export default class HeadingMenu {
    static build(parent, onSelect) {
        const menu = DomUtils.createElement('div', 'md-heading-menu');
        menu.style.display = 'none';
        parent.appendChild(menu);
        this.render(menu, onSelect);
        return menu;
    }

    static render(menu, onSelect = () => {}) {
        menu.replaceChildren();
        const options = [
            { label: 'Paragraph', level: 0 },
            ...Array.from({ length: 6 }, (_, index) => ({
                label: `Heading ${index + 1}`,
                level: index + 1
            }))
        ];

        options.forEach(({ label, level }) => {
            const item = DomUtils.createElement('button', 'md-heading-menu-item');
            item.type = 'button';
            item.textContent = label;
            item.dataset.level = String(level);
            item.addEventListener('click', () => onSelect(level));
            menu.appendChild(item);
        });
    }

    static toggle(menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}
