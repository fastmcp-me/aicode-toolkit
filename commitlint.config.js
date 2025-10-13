module.exports = {
  extends: ['@commitlint/config-nx-scopes'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'aicode-toolkit',
        'aicode-utils',
        'scaffold-mcp',
        'architect-mcp',
        'release', // Allow 'release' scope for nx release commits
      ],
    ],
  },
};
