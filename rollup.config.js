import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  external: ['marked', 'turndown'],
  output: [
    { file: 'dist/write-markdown.esm.js', format: 'esm' },
    {
      file: 'dist/write-markdown.umd.js',
      format: 'umd',
      name: 'WriteMarkdown',
      globals: { marked: 'marked', turndown: 'TurndownService' }
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    terser()
  ]
};
