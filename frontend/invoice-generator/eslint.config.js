import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Cypress specs run in Node, not the browser, and get `cy` / `expect`
    // injected at runtime -- so they need their own globals or every spec
    // reports a wall of false `no-undef` errors.
    files: ['cypress/**/*.js', 'cypress.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
        cy: 'readonly',
        Cypress: 'readonly',
        expect: 'readonly',
      },
    },
    rules: {
      // `setupNodeEvents(on, config)` keeps Cypress's documented signature,
      // so unused parameters are expected here rather than a smell.
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
