module.exports = {
  extends: ['airbnb-typescript', 'prettier'],
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'prettier'],
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  rules: {
    'linebreak-style': ['error', 'unix'],
    'no-param-reassign': ['error', { props: true }],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^exhaustiveCheck$' }],
    'prettier/prettier': ['error'],
    'react/react-in-jsx-scope': 'off',
    'react/require-default-props': 'off',
    // Allow console for warn|error|info until we implement better user feedback
    'no-console': 'off',
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "CallExpression[callee.object.name='console'][callee.property.name!=/^(warn|error|info)$/]",
        message: 'Unexpected property on console object was called',
      },
    ],
  },
  overrides: [
    {
      files: ['src/utils/**/*.ts'],
      rules: {
        'import/prefer-default-export': 'off',
      },
    },
  ],
};
