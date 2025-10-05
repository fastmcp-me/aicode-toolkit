# Publishing Packages to npm

This guide explains how to publish packages from this monorepo to npm using Nx Release.

## Prerequisites

1. **npm account**: You need an npm account with access to publish under the `@agiflowai` scope
2. **Authentication**: Set up npm authentication using one of these methods:
   - Run `npm login` to authenticate interactively
   - Set `NPM_TOKEN` environment variable with your npm token
   - Uncomment and configure the auth line in `.npmrc`

## Package Configuration

Both packages are configured for publishing:

- `@agiflowai/scaffold-generator` - Shared utilities and types
- `@agiflowai/scaffold-mcp` - MCP server with CLI

### Key Configuration Details

- **Access**: Both packages use `publishConfig.access: "public"` for public npm packages
- **Files**: Only `dist` and `README.md` are published (via `files` field)
- **Workspace Dependencies**: `workspace:*` protocol is automatically converted to actual versions during publish
- **License**: AGPL-3.0

## Publishing Workflow

### 1. First-Time Release

For the initial release (already at version 0.0.1):

```bash
# Preview what will happen (recommended)
pnpm exec nx release --first-release --dry-run
# or use the npm script
pnpm release:dry-run -- --first-release

# Review the output, then publish
pnpm exec nx release --first-release
# or use the npm script
pnpm release -- --first-release
```

This will:
- ✅ Skip version bumping (already at 0.0.1)
- ✅ Generate changelogs
- ✅ Create git tags
- ✅ Build packages
- ✅ Publish to npm registry

### 2. Subsequent Releases

After the first release, use the standard workflow:

```bash
# Always start with dry-run
pnpm exec nx release --dry-run
# or use the npm script
pnpm release:dry-run

# Review and confirm, then publish
pnpm exec nx release
# or use the npm script
pnpm release
```

### 3. Version Bumping Options

Nx Release supports conventional commits for automatic version bumping:

```bash
# Patch release (0.0.1 -> 0.0.2)
pnpm exec nx release patch

# Minor release (0.0.1 -> 0.1.0)
pnpm exec nx release minor

# Major release (0.0.1 -> 1.0.0)
pnpm exec nx release major

# Specific version
pnpm exec nx release --version=0.1.0
```

### 4. Publishing Individual Packages

To publish only specific packages:

```bash
# Publish only scaffold-generator
pnpm exec nx release --projects=@agiflowai/scaffold-generator

# Publish only scaffold-mcp
pnpm exec nx release --projects=@agiflowai/scaffold-mcp
```

## Nx Release Configuration

The release process is configured in `nx.json`:

```json
{
  "release": {
    "projects": ["packages/*"],
    "version": {
      "conventionalCommits": true,
      "generatorOptions": {
        "updateDependents": "auto"
      }
    },
    "changelog": {
      "projectChangelogs": {
        "createRelease": "github",
        "renderOptions": {
          "authors": true
        }
      }
    }
  }
}
```

Key features:
- **Conventional Commits**: Automatically determines version bump based on commit messages
- **Update Dependents**: Automatically updates dependent packages when dependencies change
- **GitHub Releases**: Creates GitHub releases with changelog
- **Author Attribution**: Includes commit authors in changelogs

## CI/CD Publishing

### GitHub Actions Example

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Packages

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to publish (leave empty for auto)'
        required: false

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: pnpm/action-setup@v2
        with:
          version: 10.18.0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build

      - name: Configure npm
        run: |
          echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc

      - name: Publish packages
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          if [ -z "${{ github.event.inputs.version }}" ]; then
            pnpm exec nx release --yes
          else
            pnpm exec nx release --version=${{ github.event.inputs.version }} --yes
          fi
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Required Secrets

Add to your GitHub repository settings:
- `NPM_TOKEN`: Your npm access token (create at https://www.npmjs.com/settings/tokens)

## Troubleshooting

### Authentication Issues

If you get authentication errors:

```bash
# Login to npm
npm login

# Or set NPM_TOKEN environment variable
export NPM_TOKEN=your-token-here
```

### Workspace Dependencies

The `workspace:*` protocol in `scaffold-mcp`'s dependency on `scaffold-generator` is automatically converted to the actual version during publishing. You don't need to manually update this.

### Build Before Publish

Always ensure packages are built before publishing:

```bash
# Build all packages
pnpm build

# Or build specific package
pnpm exec nx build scaffold-mcp
```

### Verify Published Packages

After publishing, verify on npm:

- https://www.npmjs.com/package/@agiflowai/scaffold-generator
- https://www.npmjs.com/package/@agiflowai/scaffold-mcp

## Best Practices

1. **Always use --dry-run first**: Preview changes before publishing
2. **Use conventional commits**: Enables automatic version bumping
   - `feat:` → minor version bump
   - `fix:` → patch version bump
   - `BREAKING CHANGE:` → major version bump
3. **Test packages locally**: Use `npm pack` to test package contents
4. **Review changelogs**: Ensure generated changelogs are accurate
5. **Tag releases**: Nx Release automatically creates git tags
6. **Document breaking changes**: Always document breaking changes in commit messages

## Resources

- [Nx Release Documentation](https://nx.dev/features/manage-releases)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
