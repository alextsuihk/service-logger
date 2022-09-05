/**
 * eslintrc
 *
 */
module.exports = {
  root: true, // prevent ESLint to search parent folder for config file

  env: {
    es6: true,
    node: true,
    jest: true,
  },

  parser: '@typescript-eslint/parser',

  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  plugins: ['jsdoc'],

  parserOptions: {
    ecmaVersion: 2020, // require node 14.x
    sourceType: 'module', // allow for use of imports
  },

  rules: {
    // '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: 'res|next|^err' }],
    // 'arrow-parens': ['error', 'as-needed'],
    'jsdoc/require-jsdoc': 'warn',
    'no-console': 'error',
    'no-return-await': 'warn',
    'no-trailing-spaces': 'warn',
    'no-useless-return': 'warn',
    'prefer-destructuring': 'warn',
    'prefer-template': 'warn',
  },
};
