// src/DialogManager.js
import DomUtils from './utils/DomUtils.js';

/**
 * DialogManager - generic dialog form helper
 */
export default class DialogManager {
    /**
     * Show a small form dialog and resolve with collected values or null
     * @param {string} title
     * @param {Array<{label:string,name:string,type?:string,required?:boolean}>} fields
     * @param {HTMLElement} container
     * @returns {Promise<Record<string,string>|null>}
     */
    static showFormDialog(title, fields, container = document.body) {
        return new Promise((resolve) => {
            const dialog = DomUtils.createElement('dialog', 'md-generic-dialog');
            const form = DomUtils.createElement('form');
            form.method = 'dialog';
            const h3 = DomUtils.createElement('h3');
            h3.textContent = title;
            form.appendChild(h3);
            const inputs = {};
            fields.forEach(f => {
                const label = DomUtils.createElement('label');
                label.textContent = f.label;
                form.appendChild(label);
                const input = DomUtils.createElement('input');
                input.type = f.type || 'text';
                input.name = f.name;
                if (f.required) input.required = true;
                form.appendChild(input);
                inputs[f.name] = input;
            });
            const footer = DomUtils.createElement('footer');
            const cancelBtn = DomUtils.createElement('button');
            cancelBtn.type = 'button'; cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', () => { dialog.close(); dialog.remove(); resolve(null); });
            const okBtn = DomUtils.createElement('button'); okBtn.type = 'submit'; okBtn.textContent = 'Insert';
            footer.appendChild(cancelBtn); footer.appendChild(okBtn);
            form.appendChild(footer);
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const data = {};
                Object.keys(inputs).forEach(k => data[k] = inputs[k].value.trim());
                dialog.close(); dialog.remove(); resolve(data);
            });
            dialog.appendChild(form);
            container.appendChild(dialog);
            dialog.showModal();
        });
    }
}
