import DomUtils from './utils/DomUtils.js';
import Toolbar from './components/Toolbar.js';
import HeadingMenu from './components/HeadingMenu.js';
import Tabs from './components/Tabs.js';
import WysiwygView from './components/WysiwygView.js';
import MarkdownView from './components/MarkdownView.js';
import PreviewView from './components/PreviewView.js';
import { TableGrid, ContextualTableToolbar } from './components/TableControls.js';

/**
 * Composition root for the editor DOM.
 * Each visual element has a small component with one responsibility.
 */
export default class DOMBuilder {
    static build(host, {
        toolbarConfigs = [],
        onToolbarClick = () => {},
        onTabChange = () => {},
        onHeadingSelect = () => {}
    } = {}) {
        const wrapper = DomUtils.createElement('div', 'md-wysiwyg-editor-wrapper');
        host.appendChild(wrapper);

        const toolbar = Toolbar.build(wrapper, toolbarConfigs, onToolbarClick);
        const contentArea = DomUtils.createElement('div', 'md-editor-content-area');
        wrapper.appendChild(contentArea);

        const editableArea = WysiwygView.build(contentArea);
        const markdown = MarkdownView.build(contentArea);
        const tabs = Tabs.build(wrapper, onTabChange);
        const headingMenu = HeadingMenu.build(wrapper, onHeadingSelect);
        const tableGrid = TableGrid.build(wrapper);
        const contextualTableToolbar = ContextualTableToolbar.build(wrapper);
        const previewPane = PreviewView.build(wrapper);

        return {
            wrapper,
            toolbar,
            editableArea,
            markdownArea: markdown.textarea,
            markdownContainer: markdown.container,
            lineNumbers: markdown.lineNumbers,
            tabs: tabs.container,
            tabButtons: tabs.buttons,
            wysiwygTab: tabs.buttons.wysiwyg,
            markdownTab: tabs.buttons.markdown,
            previewTab: tabs.buttons.preview,
            headingMenu,
            tableGrid,
            contextualTableToolbar,
            previewPane
        };
    }

    // Compatibility API for integrations that used DOMBuilder directly.
    static populateToolbar(toolbar, configs, onClick) {
        Toolbar.render(toolbar, configs, onClick);
    }

    static buildHeadingMenu(menu, onSelect) {
        HeadingMenu.render(menu, onSelect);
    }
}
