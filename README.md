# AI Code Toolkit

> Scale your AI coding agents with scaffolding, architecture patterns, and validation rules

[![npm version](https://img.shields.io/npm/v/@agiflowai/scaffold-mcp.svg?style=flat-square)](https://www.npmjs.com/package/@agiflowai/scaffold-mcp)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg?style=flat-square)](https://opensource.org/licenses/AGPL-3.0)
[![Node.js Version](https://img.shields.io/node/v/@agiflowai/scaffold-mcp?style=flat-square)](https://nodejs.org)

A collection of [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers and tools that help AI coding agents maintain consistency, follow conventions, and scale with your codebase.

---

## Contents

- [Why This Exists](#why-this-exists)
- [Core Pillars](#core-pillars)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
- [Packages](#packages)
- [Our Approach](#our-approach)
- [Development](#development)
- [Documentation](#documentation)
- [Version Support](#version-support)
- [Contributing](#contributing)
- [License](#license)

---

## Why This Exists

As projects evolve from MVP to production, they develop patterns, conventions, and opinionated approaches. Custom instructions alone struggle to ensure AI agents follow these requirements—especially as complexity grows and context windows fill up.

**AI Code Toolkit provides building blocks to scale coding agent capabilities:**

- ✅ Generate code that follows your team's conventions
- ✅ Enforce architectural patterns automatically
- ✅ Validate agent outputs programmatically
- ✅ Work with any AI coding agent (Claude, Cursor, etc.)
- ✅ Support any tech stack (Next.js, React, or custom frameworks)

Whether you're bootstrapping a new project or managing a complex monorepo, these tools ensure AI agents integrate seamlessly with your development workflow.

---

## Core Pillars

### 1. 🏗️ Scaffolding Templates

Combine templating with LLMs to generate standardized code that follows your internal conventions while reducing maintenance overhead.

### 2. 🎨 Architecture + Design Patterns

Convention over configuration scales. Like Ruby on Rails or Angular, opinionated approaches make code predictable—for both humans and AI agents.

### 3. ✅ Rules

Pre-flight guidance + post-flight validation = consistent output. Rules provide programmatic checks (quantitative or qualitative) to enforce your processes.

---

## Getting Started

### Prerequisites

- **Node.js**: `>= 18` (LTS recommended)
- **Package Manager**: `pnpm` (or `npm`/`yarn`)
- **Git**: `>= 2.13.2`

### Quick Start

#### Option 1: Use as MCP Server (with Claude Desktop)

1. **Install the package:**
   ```bash
   pnpm install @agiflowai/scaffold-mcp
   ```

2. **Configure Claude Desktop:**
   Add to your MCP settings:
   ```json
   {
     "mcpServers": {
       "scaffold": {
         "command": "scaffold-mcp",
         "args": ["mcp-serve"]
       }
     }
   }
   ```

3. **Start using it:**
   The MCP server tools will be available in Claude Desktop.

#### Option 2: Use as CLI

```bash
# Install globally or use npx
pnpm install -g @agiflowai/scaffold-mcp

# Initialize templates
scaffold-mcp init

# List available boilerplates
scaffold-mcp boilerplate list

# Create a new project
scaffold-mcp boilerplate create nextjs-15 --vars '{"appName":"my-app"}'

# Add features to existing projects
scaffold-mcp scaffold list ./my-app
scaffold-mcp scaffold add scaffold-nextjs-page --vars '{"pageName":"dashboard"}'
```

For detailed usage, see the [scaffold-mcp documentation](./packages/scaffold-mcp/README.md).

---

## Packages

### [@agiflowai/scaffold-mcp](./packages/scaffold-mcp)

MCP server for scaffolding applications with boilerplate templates and feature generators.

**Key Features:**
- 🚀 Create projects from boilerplate templates
- 🎯 Add features to existing projects (pages, components, services)
- 📦 Template management (initialize, add from repositories)
- 🔧 Built-in templates: Next.js 15, Vite + React
- 🌐 Multiple transport modes: stdio, HTTP, SSE
- 💻 Standalone CLI mode

[View full documentation →](./packages/scaffold-mcp/README.md)

### [@agiflowai/scaffold-generator](./packages/scaffold-generator)

Core utilities and types for scaffold generators. Internal library used by `scaffold-mcp`.

[View source →](./packages/scaffold-generator)

---

## Our Approach

### 🤖 Agent Agnostic

Works with any AI coding agent (Claude Code, Cursor, Windsurf, etc.). Each library provides:
- **MCP tools** for integration with MCP-compatible agents
- **CLI commands** for scripting deterministic workflows

### 🛠️ Tech Stack Agnostic

Built-in templates for popular frameworks:
- Next.js 15
- Vite + React
- _More coming soon_

Don't see your stack? Use the built-in MCP tools to generate custom templates—the system is fully extensible.

### 🎯 Coding Tool Specific

Maximize effectiveness by combining three layers:

1. **MCP Servers** → Let tools guide the agent with their default prompts
2. **Custom Instructions** → Use `CLAUDE.md`, `AGENTS.md` to specify when to use MCP tools
3. **Hooks** → Intercept tool calls to enforce workflows (e.g., require scaffolding for new files)

Experiment with these layers to find the right balance for your project. There's no one-size-fits-all solution.

---

## Development

This is an [Nx](https://nx.dev) monorepo using [pnpm](https://pnpm.io) for package management.

### Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build a specific package
pnpm exec nx build scaffold-mcp

# Run tests
pnpm test
pnpm exec nx test scaffold-mcp

# Lint and format
pnpm lint              # Check for issues
pnpm lint:fix          # Auto-fix issues
pnpm format            # Format code
pnpm format:check      # Check formatting

# Type checking
pnpm typecheck
pnpm exec nx typecheck scaffold-mcp

# Visualize project graph
pnpm exec nx graph
```

### Code Quality

We use [Biome](https://biomejs.dev/) for lightning-fast linting and formatting:
- ⚡ **10-100x faster** than ESLint (written in Rust)
- 🎯 **All-in-one**: Replaces ESLint + Prettier
- 🔧 **Zero config**: Sensible defaults out of the box

Configuration: [`biome.json`](./biome.json)

### Publishing

See [PUBLISHING.md](./PUBLISHING.md) for the complete release workflow:

```bash
# Preview release (dry run)
pnpm release:dry-run

# Publish to npm
pnpm release
```

---

## Documentation

- **[Scaffold MCP Guide](./packages/scaffold-mcp/README.md)** - Complete guide to the scaffolding MCP server
- **[Contributing Guide](./.github/CONTRIBUTING.md)** - How to contribute to this project
- **[Publishing Guide](./PUBLISHING.md)** - Release and versioning workflow

---

## Version Support

| Component | Requirement |
|-----------|-------------|
| **Node.js** | `>= 18` (LTS recommended) |
| **Git** | `>= 2.13.2` |
| **pnpm** | `>= 9` (or use npm/yarn) |

Security patches are applied to non-EOL versions. Features are added to the latest version only.

---

## Contributing

We welcome contributions! Whether it's bug reports, feature requests, or pull requests—all contributions are appreciated.

**How to contribute:**

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💻 Make your changes
4. ✅ Run tests and linting (`pnpm test && pnpm lint`)
5. 📝 Commit your changes (follow [conventional commits](https://www.conventionalcommits.org))
6. 🚀 Push to your branch (`git push origin feature/amazing-feature`)
7. 🎉 Open a Pull Request

See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for detailed guidelines.

---

## License

[AGPL-3.0](./LICENSE) © AgiflowIO

---

**Built with ❤️ by the AgiflowIO team**

- 🐛 [Report Issues](https://github.com/AgiFlow/aicode-toolkit/issues)
- 💬 [Discussions](https://github.com/AgiFlow/aicode-toolkit/discussions)
- 🌐 [Website](https://agiflow.io)
