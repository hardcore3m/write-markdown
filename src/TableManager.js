// src/TableManager.js
/**
 * TableManager - responsible for inserting tables into WYSIWYG DOM or Markdown
 */
import DomUtils from './utils/DomUtils.js';

export default class TableManager {
    /**
     * Insert table into a contenteditable area at the provided range
     * @param {HTMLElement} editableArea
     * @param {Range} range
     * @param {number} rows
     * @param {number} cols
     */
    static insertTableWysiwyg(editableArea, range, rows, cols) {
        if (!editableArea || isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) return;
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        table.appendChild(thead); table.appendChild(tbody);
        const trHead = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
            const th = document.createElement('th'); th.textContent = `Header ${c + 1}`; trHead.appendChild(th);
        }
        thead.appendChild(trHead);
        for (let r = 1; r < rows; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < cols; c++) { const td = document.createElement('td'); td.innerHTML = '&#8203;'; tr.appendChild(td); }
            tbody.appendChild(tr);
        }
        range.deleteContents();
        const frag = document.createDocumentFragment(); frag.appendChild(table);
        const pAfter = document.createElement('p'); pAfter.innerHTML = '&#8203;'; frag.appendChild(pAfter);
        range.insertNode(frag);
        // focus first cell
        const first = table.querySelector('th, td');
        if (first) TableManager.focusCell(editableArea, first);
    }

    /**
     * Insert a markdown table into textarea
     * @param {HTMLTextAreaElement} textarea
     * @param {number} rows
     * @param {number} cols
     * @param {{start:number,end:number}|null} savedRange
     */
    static insertTableMarkdown(textarea, rows, cols, savedRange = null) {
        if (!textarea) return;
        const start = (savedRange && typeof savedRange.start === 'number') ? savedRange.start : textarea.selectionStart;
        const end = (savedRange && typeof savedRange.end === 'number') ? savedRange.end : textarea.selectionEnd;
        let md = '|';
        const headers = [];
        for (let c = 0; c < cols; c++) { headers.push(`Header ${c + 1}`); md += ` ${headers[c]} |`; }
        md += '\n|'; for (let c = 0; c < cols; c++) md += ' --- |'; md += '\n';
        for (let r = 1; r < rows; r++) { md += '|'; for (let c = 0; c < cols; c++) md += ' Cell |'; md += '\n'; }
        const value = textarea.value;
        const prefix = (start > 0 && value[start - 1] !== '\n') ? '\n\n' : '';
        const textToInsert = prefix + md + '\n';
        textarea.value = value.substring(0, start) + textToInsert + value.substring(end);
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + headers[0].length);
        textarea.focus();
    }

    /**
     * Place caret inside a cell
     * @param {HTMLElement} editableArea
     * @param {HTMLElement} cell
     */
    static focusCell(editableArea, cell) {
        if (!cell) return;
        editableArea.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        if (!cell.firstChild || (cell.firstChild.nodeType === Node.TEXT_NODE && cell.firstChild.textContent === '')) cell.innerHTML = '&#8203;';
        if (cell.firstChild && cell.firstChild.nodeType === Node.TEXT_NODE) {
            const offset = (cell.firstChild.textContent === '\u200B') ? 1 : 0;
            range.setStart(cell.firstChild, offset);
        } else {
            range.selectNodeContents(cell);
        }
        range.collapse(true);
        sel.removeAllRanges(); sel.addRange(range);
    }
}
