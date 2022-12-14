module.exports = {
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: [
    'next',
    'plugin:@typescript-eslint/recommended',
    'airbnb',
    'airbnb-typescript',
    'plugin:prettier/recommended',
    'airbnb/hooks',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/no-array-index-key': 'off',
    'react/require-default-props': 'off',
    'react/no-unknown-property': 'off',
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
    'react/function-component-definition': [
      2,
      { namedComponents: 'function-declaration' },
    ],
    '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
  },
};
