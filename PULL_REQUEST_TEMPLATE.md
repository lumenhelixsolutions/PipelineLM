/**
 * PipelineLM Pro — ESLint Configuration
 * Linting rules for Chrome Extension MV3 JavaScript
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    webextensions: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  globals: {
    // Chrome Extension API
    chrome: 'readonly',
  },
  rules: {
    // ─── Best Practices ─────────────────────────────────────────────
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // Console logging is useful in extensions
    'no-debugger': 'warn',
    'no-alert': 'off', // alert() is used for user-facing messages
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-var': 'error',
    'prefer-const': 'warn',
    'prefer-arrow-callback': 'warn',
    'arrow-body-style': ['warn', 'as-needed'],

    // ─── Chrome Extension Specific ──────────────────────────────────
    // Service Worker constraints
    'no-restricted-globals': ['error', {
      name: 'window',
      message: 'Service Worker has no window object. Use self.',
    }],

    // ─── Security ───────────────────────────────────────────────────
    'no-inner-declarations': 'error',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',

    // ─── Style ──────────────────────────────────────────────────────
    'indent': ['warn', 2, { SwitchCase: 1 }],
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'always-multiline'],
    'eol-last': ['warn', 'always'],
    'no-trailing-spaces': 'warn',
    'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true }],
  },
  overrides: [
    {
      // Service Worker — stricter rules
      files: ['src/background/**/*.js'],
      rules: {
        'no-console': 'off',
        'no-restricted-globals': ['error', {
          name: 'window',
          message: 'Service Worker has no window object. Use self.',
        }, {
          name: 'document',
          message: 'Service Worker has no document. Use chrome API.',
        }],
      },
    },
    {
      // Content Script — browser environment
      files: ['src/content/**/*.js'],
      env: {
        browser: true,
        es2022: true,
      },
      globals: {
        chrome: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
      },
    },
    {
      // Scripts — Node.js environment
      files: ['scripts/**/*.js'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'releases/',
    'docs/',
    '*.min.js',
  ],
};
