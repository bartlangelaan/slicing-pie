module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'airbnb-typescript',
    'prettier',
    'plugin:prettier/recommended',
    'airbnb/hooks',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/no-array-index-key': 'off',
    'react/require-default-props': 'off',
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-unsafe-assignment': 0,
    '@typescript-eslint/no-unsafe-call': 0,
    'react/destructuring-assignment': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    'import/default': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/named': 'off',
    'import/namespace': 'off',
    'import/prefer-default-export': 'off',
    'prefer-destructuring': 'off',
    'react/jsx-props-no-spreading': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.stories.tsx'],
      },
    ],
  },
  env: {
    node: true,
    jest: true,
  },
};
