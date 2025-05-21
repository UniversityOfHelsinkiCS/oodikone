import pluginJs from '@eslint/js'
import globals from 'globals'
import pluginCypress from 'eslint-plugin-cypress/flat'
import pluginImport from 'eslint-plugin-import'
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import tsEslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
  },
  {
    ignores: ['eslint.config.mjs', '**/build/', '**/dist/', '**/node_modules/'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: [
          'services/frontend/tsconfig.json',
          'services/frontend/tsconfig.node.json',
          'services/backend/tsconfig.json',
          'services/shared/tsconfig.json',
        ],
      },
    },
  },
  pluginJs.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  ...tsEslint.configs.stylisticTypeChecked,
  pluginCypress.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  pluginImport.flatConfigs.recommended,
  pluginImport.flatConfigs.typescript,
  pluginPrettierRecommended, // This must be the last plugin so it can override other configs
  {
    plugins: {
      'react-hooks': pluginReactHooks,
    },
  },
  {
    rules: {
      camelcase: 'off', // TODO: Enable this rule (at least for frontend)
      'class-methods-use-this': 'error',
      'consistent-return': 'error',
      'id-denylist': ['error', 'c', 'd', 'e', 'err', 't'],
      'import/no-commonjs': 'error',
      'import/no-default-export': 'error',
      'import/no-extraneous-dependencies': ['error', { devDependencies: false }],
      'import/no-unused-modules': ['error', { missingExports: true, unusedExports: true }],
      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: [['builtin', 'external'], ['internal'], ['parent'], ['sibling', 'index']],
        },
      ],
      'no-alert': 'error',
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'error',
      'no-console': 'error',
      'no-implied-eval': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-promise-executor-return': 'error',
      'no-return-assign': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-const': 'error',
      'prefer-destructuring': ['error', { VariableDeclarator: { object: true } }],
      "no-restricted-imports": ['error', { 'patterns': [{ 'regex': '^@mui/[^/]+$' }] }],
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
      'react/display-name': 'off', // TODO: Delete this override
      'react/function-component-definition': [
        'error',
        { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
      ],
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-filename-extension': ['error', { allow: 'as-needed', extensions: ['.jsx', '.tsx'] }],
      'react/jsx-sort-props': ['error', { reservedFirst: false }],
      'react/no-array-index-key': 'error',
      'react/no-this-in-sfc': 'error',
      'react/no-unescaped-entities': 'off',
      'react/no-unknown-property': 'off', // TODO: Delete this override
      'react/prefer-stateless-function': 'error',
      'react/prop-types': 'off',
      ...pluginReactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn', // TODO: Delete this override
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-misused-promises': 'off', // Most of these errors come from Express route handlers that are handled correctly by express-async-errors
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/restrict-template-expressions': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      ...tsEslint.configs.disableTypeChecked.rules,
      'dot-notation': 'error',
    },
  },
  {
    files: ['services/backend/src/rapodiff/**/*'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['services/**/shared/**/*'],
    rules: {
      'import/no-unused-modules': 'off',
    },
  },
  {
    files: ['cypress/**/*.js', 'services/backend/**/*.js', 'updater/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-commonjs': 'off',
      'import/no-unused-modules': 'off',
    },
  },
  {
    files: ['services/backend/**/*.{js,ts}', 'updater/**/*.js'],
    rules: {
      // TODO: Most of these overrides should probably be removed
      'consistent-return': 'off',
      'import/no-default-export': 'off',
      'import/no-unused-modules': 'off',
      'no-await-in-loop': 'off',
      'no-param-reassign': 'off',
      'no-promise-executor-return': 'off',
    },
  },
  {
    settings: {
      'import/internal-regex': '^@oodikone/shared/',
      'import/resolver': {
        typescript: {
          project: [
            'services/frontend/tsconfig.json',
            'services/frontend/tsconfig.node.json',
            'services/backend/tsconfig.json',
            'services/shared/tsconfig.json',
          ],
        },
      },
      react: {
        version: '18.3',
      },
    },
  },
]
