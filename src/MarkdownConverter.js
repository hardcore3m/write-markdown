// src/MarkdownConverter.js
/**
 * MarkdownConverter - uses marked (markdown->html) and turndown (html->markdown)
 * NOTE: marked and turndown must be available at runtime (peerDependencies)
 */
import { marked } from 'marked';
import TurndownService from 'turndown';

/**
 * Class responsible for bidirectional conversion between Markdown and HTML.
 */
export default class MarkdownConverter {
    constructor() {
        this.turndownService = new TurndownService({ headingStyle: 'atx' });
    }

    /**
     * Convert markdown string to HTML using marked
     * @param {string} markdown
     * @returns {string}
     * @example
     * const html = converter.toHtml('# Hello');
     */
    toHtml(markdown) {
        return marked.parse(markdown || '');
    }

    /**
     * Convert HTML (string or element) to Markdown using Turndown
     * @param {string|HTMLElement} input
     * @returns {string}
     * @example
     * const md = converter.toMarkdown('<h1>Hello</h1>');
     */
    toMarkdown(input) {
        if (!input) return '';
        if (typeof input === 'string') return this.turndownService.turndown(input);
        return this.turndownService.turndown(input.outerHTML);
    }
}
