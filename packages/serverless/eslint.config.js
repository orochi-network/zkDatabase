import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import typescriptEslint from '@typescript-eslint/eslint-plugin';

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },

  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],

    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },

      ecmaVersion: 2020,
      sourceType: 'module',

      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },

    rules: {
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error', {}],

      'class-methods-use-this': [1],
      'no-underscore-dangle': [0],
      'import/no-unresolved': [0],
      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': [
        2,
        {
          args: 'all',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],

      camelcase: 2,
      'arrow-body-style': 0,
      'no-mixed-spaces-and-tabs': 2,

      'max-len': [
        2,
        {
          code: 120,
          tabWidth: 2,
          ignoreUrls: true,
        },
      ],
    },
  },
  {
    ignores: [
      'build/**',
      'node_modules/**',
      'husky.js',
      'increase-built.js',
      'devel.js',
    ],
  },
];
