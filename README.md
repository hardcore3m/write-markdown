# write-markdown (refactor/modular-editor-marked-preview)

This branch contains a refactored, modular implementation of the Write Markdown editor.
The code has been split into ES modules (src/) and uses `marked` (markdown → HTML) and `turndown` (HTML → markdown) for bidirectional conversion. A Preview tab was also added that renders the HTML output.

Files added:

- src/
  - index.js
  - MarkdownWYSIWYG.js
  - DOMBuilder.js
  - TableManager.js
  - DialogManager.js
  - MarkdownConverter.js
  - UndoManager.js
  - utils/DomUtils.js
- rollup.config.js
- package.template.json (suggested package.json content — DO NOT overwrite your existing package.json automatically)
- demo/
  - index.html (demo placeholder, explained below)

Installation and build

1. Install peer dependencies and dev dependencies (recommended via project's package.json). Example: 

```bash
npm install marked turndown
npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs rollup-plugin-terser
```

2. Build the bundle:

```bash
npx rollup -c
```

This will output:
- dist/write-markdown.esm.js
- dist/write-markdown.umd.js

Usage (ES Module)

```js
import MarkdownWYSIWYG from './dist/write-markdown.esm.js';
const editor = new MarkdownWYSIWYG('editor-host', { initialValue: '# Hello' });
```

Usage (UMD)

Include the UMD bundle and peer libs (marked, turndown) in your page and use `WriteMarkdown` global:

```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/turndown/dist/turndown.js"></script>
<script src="dist/write-markdown.umd.js"></script>
<script>
  const editor = new WriteMarkdown('editor-host', { initialValue: '# Hello' });
</script>
```

Demo

There is a simple demo file `demo/index.html` that explains how to run the demo after you build the bundle. Open it after running `npx rollup -c`.

Notes and next steps

- The conversion uses `marked` and `turndown`. You can customize Turndown rules inside `src/MarkdownConverter.js` if you need more control over HTML → Markdown.
- The toolbar behavior and markdown active-state detection were simplified to accelerate modularization. If you need exact parity with the old behavior, I can port the original active-state detection into a separate utility.
- I intentionally created `package.template.json` instead of overwriting your repository's package.json. Merge the suggested fields manually into your package.json (scripts, peerDependencies, devDependencies) if desired.

If you want, I can now:
1) open a PR with these changes on the branch
2) create the rollup output (run a build) and commit `dist/` bundles to the branch (not recommended — better to include in releases)
3) port the original toolbar active-state detection into a standalone util

Reply which next step you want (1/2/3) or ask for changes.
