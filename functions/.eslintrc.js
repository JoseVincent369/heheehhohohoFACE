module.exports = {
  env: {
      browser: true,
      es2021: true,
      node: true, // Add this line to recognize Node.js
  },
  extends: [
      'eslint:recommended',
      'plugin:react/recommended',
  ],
  parserOptions: {
      ecmaFeatures: {
          jsx: true,
      },
      ecmaVersion: 12,
      sourceType: 'module',
  },
  rules: {
      // Your custom rules here
  },
};
