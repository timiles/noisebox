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
  },
  overrides: [
    {
      files: ['src/components/**/*.tsx'],
      rules: {
        'react/jsx-props-no-spreading': 'off',
      },
    },
    {
      files: ['src/data/**/*.ts', 'src/types/**/*.ts', 'src/utils/**/*.ts'],
      rules: {
        'import/prefer-default-export': 'off',
      },
    },
  ],
};
