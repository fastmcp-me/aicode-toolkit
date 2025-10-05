module.exports = {
  extends: ['@commitlint/config-nx-scopes'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'scaffold-generator',
        'scaffold-mcp',
        'release', // Allow 'release' scope for nx release commits
      ],
    ],
  },
};
