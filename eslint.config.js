import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.vite-react-ssg', 'public/media', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // The Kling keys must never reach the client bundle: Vite inlines any
      // import.meta.env value prefixed with VITE_.
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name=/^VITE_KLING/]",
          message:
            'Kling credentials must never be VITE_-prefixed — Vite would inline them into the client bundle. Read them from process.env in scripts/ instead.',
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.ts', '*.config.ts'],
    languageOptions: { globals: globals.node },
  },
);
