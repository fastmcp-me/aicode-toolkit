# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

An Nx monorepo for building MCP (Model Context Protocol) servers and tooling. Uses pnpm for package management and Nx for build orchestration.

## Packages

### @agiflowai/scaffold-generator
Core utilities and types for scaffold generators.
- Location: `packages/scaffold-generator/`
- Exports shared functionality used by scaffold-mcp

### @agiflowai/scaffold-mcp
MCP server for scaffolding applications with boilerplate templates.
- Location: `packages/scaffold-mcp/`
- Provides CLI and MCP server for template-based code generation
- Depends on scaffold-generator via workspace protocol

## Templates

Templates are stored in `templates/` directory:
- Each template has a `scaffold.yaml` defining boilerplates and features
- Template files use `.liquid` extension for variable substitution
- See template-specific READMEs for details

## Development

```bash
# Build packages
pnpm build

# Lint and format
pnpm lint          # Check for issues
pnpm lint:fix      # Fix issues automatically
pnpm format        # Format code

# Test and type check
pnpm test
pnpm typecheck
```

Code quality: Uses [Biome](https://biomejs.dev/) for fast linting/formatting (config: `biome.json`)

## Publishing

See `PUBLISHING.md` for complete publishing workflow. Quick reference:

```bash
# Preview release
pnpm release:dry-run

# Publish to npm
pnpm release
```
