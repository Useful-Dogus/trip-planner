module.exports = {
  root: false,
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ['dist', '.next', 'node_modules', 'coverage'],
};
