// src/utils/DomUtils.js
/**
 * DomUtils - helper utilities for DOM operations
 * @module DomUtils
 */
export default class DomUtils {
    /**
     * Create element with optional classes
     * @param {string} tag
     * @param {string|string[]} [classes]
     * @returns {HTMLElement}
     */
    static createElement(tag, classes) {
        const el = document.createElement(tag);
        if (classes) {
            if (Array.isArray(classes)) el.classList.add(...classes);
            else el.classList.add(classes);
        }
        return el;
    }

    /**
     * Find nearest ancestor matching tag(s)
     * @param {Node} node
     * @param {string|string[]} tagNameOrNames
     * @returns {Element|null}
     */
    static findParent(node, tagNameOrNames) {
        if (!node) return null;
        const tagNames = Array.isArray(tagNameOrNames) ? tagNameOrNames.map(n => n.toUpperCase()) : [tagNameOrNames.toUpperCase()];
        let cur = node;
        while (cur && cur !== document.body && cur !== document.documentElement) {
            if (cur.nodeType === Node.ELEMENT_NODE && tagNames.includes(cur.nodeName)) return cur;
            cur = cur.parentNode;
        }
        return null;
    }

    /**
     * Escape html special characters
     * @param {string} str
     * @returns {string}
     */
    static escapeHtml(str) {
        return (str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
