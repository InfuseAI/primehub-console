module.exports = {
  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],

  env: {
    node: true,
    browser: true,
    jest: true,
    es6: true,
  },

  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],

  settings: {
    react: {
      version: 'detect',
    },
  },

  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        'react/prop-types': 'off',
        'react/display-name': 'warn',
        'react/jsx-no-target-blank': 'warn',
      },
    },
  ],

  rules: {
    'react/react-in-jsx-scope': 'off',

    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',

    'prettier/prettier': ['error', {}, { usePrettierrc: true }],

    'no-console': [1, { allow: ['warn', 'error'] }],
  },
};
