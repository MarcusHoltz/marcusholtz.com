import eslintPluginAstro from 'eslint-plugin-astro';
import tsParser from '@typescript-eslint/parser';

export default [
  // Astro recommended rules
  ...eslintPluginAstro.configs.recommended,

  // Wire up the TypeScript parser for Astro frontmatter (the --- fenced section).
  // Without this, ESLint chokes on TS syntax like interfaces, type aliases,
  // and import aliases — all valid TypeScript that the default parser can't handle.
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.astro'],
      },
    },
  },

  // Global ignores
  {
    ignores: ['dist/', 'output/', 'node_modules/', '.astro/', 'public/', 'scripts/'],
  },

  // Project-wide rule overrides
  {
    rules: {
      'astro/no-set-html-directive': 'off', // set:html is safe — all content is author-controlled
      'no-console': 'off',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // astro/no-unused-css-selector intentionally omitted —
      // false positives for selectors toggled by JS at runtime
    },
  },
];
