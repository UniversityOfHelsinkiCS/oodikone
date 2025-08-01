// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

import globals from 'globals'
import pluginCypress from 'eslint-plugin-cypress'
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginImportX from 'eslint-plugin-import-x'
import { createNodeResolver } from 'eslint-plugin-import-x'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'

export default tseslint.config(
  {
    // Global ignores
    ignores: [
      'eslint.config.mjs',
      '**/build/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/instrumented/**'
    ]
  },

  // Global options (excl. e2e)
  {
    files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
    ignores: ['cypress/**'],
    extends: [
      eslint.configs.recommended,
      pluginImportX.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'eslint-react': pluginReact,
      'import-x': pluginImportX
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      'camelcase': 'off', // TODO: Enable eventually
      'class-methods-use-this': 'error',
      'consistent-return': 'error',
      'id-denylist': ['error', 'c', 'd', 'e', 'err', 't'],
      'import-x/no-commonjs': 'error',
      'import-x/no-default-export': 'error',
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: false }],
      'import-x/no-unused-modules': ['error',
        {
          missingExports: true,
          unusedExports: true,
          src: ['{services,updater}/**/*.{js,jsx,ts,tsx}']
        }],
      'import-x/order': ['error', {
        alphabetize: { order: 'asc', caseInsensitive: true },
        groups: [['builtin', 'external'], ['internal'], ['parent'], ['sibling', 'index']],
      },
      ],
      'no-unused-vars': ['error',
        { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_' },
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
      'prefer-destructuring': ['error',
        { VariableDeclarator: { object: true } }
      ],
      'dot-notation': 'error',
      'no-restricted-imports': ['error', { 'patterns': [{ 'regex': '^@mui/[^/]+$' }] }],
      'quotes': ['error', 'single',
        { avoidEscape: true, allowTemplateLiterals: false }
      ],
    },
    settings: {
      'import-x/internal-regex': '^@oodikone/shared/',
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: [
            'services/frontend/tsconfig.json',
            'services/frontend/tsconfig.node.json',
            'services/backend/tsconfig.json',
            'services/shared/tsconfig.json',
          ],
        }),
        createNodeResolver({
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        })
      ],
    },
  },

  // TypeScript options
  {
    files: ['**/*.{ts,cts,mts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    extends: [
      tseslint.configs.recommendedTypeCheckedOnly,
      tseslint.configs.stylisticTypeChecked,
      pluginImportX.flatConfigs.typescript,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true
      },
    },
    rules: {
      'no-unused-vars': 'off', // Disable in favor of tseslint
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_' },
      ],
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
      '@typescript-eslint/restrict-template-expressions': 'off',
    },
  },

  // React options
  {
    files: ['services/frontend/src/**/*.{jsx,tsx}'],
    plugins: { pluginReact },
    extends: [
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat['jsx-runtime'],
      pluginReactHooks.configs['recommended-latest'],
    ],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: '18',
      },
    },
    rules: {
      'react/display-name': 'off', // TODO: Delete this override
      'react/function-component-definition': ['error',
        { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
      ],
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-filename-extension': ['error',
        { allow: 'as-needed', extensions: ['.jsx', '.tsx'] }
      ],
      'react/jsx-sort-props': ['error', { reservedFirst: false }],
      'react/no-array-index-key': 'error',
      'react/no-this-in-sfc': 'error',
      'react/no-unescaped-entities': 'off',
      'react/no-unknown-property': 'off', // TODO: Delete this override
      'react/prefer-stateless-function': 'error',
      'react/prop-types': 'off',
    }
  },

  // TODO: Remove when ts migration is complete
  {
    files: ['services/frontend/src/**/*.{js,jsx}'],
    rules: {
      'import-x/no-unused-modules': 'off',
    }
  },


  // Cypress should only use rules provided by the plugin below
  {
    files: ['cypress/**/*.js'],
    extends: [
      pluginCypress.configs.recommended
    ]
  },

  // Overrides for CommonJS
  {
    files: [
      '**/*.cjs',
      'cypress/**/*.js',
      'services/backend/**/*.js',
      'updater/sis-updater-scheduler/**/*.js'
    ],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      'import-x/no-commonjs': 'off',
    },
  },

  // Rapodiff
  {
    files: ['services/backend/src/rapodiff/**/*'],
    rules: {
      'no-console': 'off',
    },
  },

  // TODO: figure out why this exists
  {
    files: [
      'services/**/shared/**/*',
      'services/frontend/**/.*js',
      'updater/**/migrations/*.cjs',
    ],
    rules: {
      'import-x/no-unused-modules': 'off',
    },
  },

  // TODO: Figure out why this exists
  {
    files: ['services/backend/**/*.{js,ts}', 'updater/**/*.js'],
    rules: {
      // TODO: Most of these overrides should probably be removed
      'consistent-return': 'off',
      'import-x/no-default-export': 'off',
      'import-x/no-unused-modules': 'off',
      'no-await-in-loop': 'off',
      'no-param-reassign': 'off',
      'no-promise-executor-return': 'off',
    },
  },
  pluginPrettierRecommended, // This must be the last plugin so it can override other configs
)
