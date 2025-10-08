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

# Initialize templates (auto-downloads official templates)
scaffold-mcp init

# List available boilerplates
scaffold-mcp boilerplate list

# Create a new project
scaffold-mcp boilerplate create scaffold-nextjs-app \
  --vars '{"appName":"my-app","withDrizzle":true}'

# Add features to existing projects
scaffold-mcp scaffold list ./apps/my-app
scaffold-mcp scaffold add scaffold-route \
  --project ./apps/my-app \
  --vars '{"routePath":"about","pageTitle":"About Us"}'
```

**Key Features:**
- 🎁 **Auto-download templates**: `init` command downloads official templates from GitHub
- 🔗 **GitHub subdirectory support**: Add templates from specific folders in repositories
- 🌐 **Multiple transport modes**: stdio (MCP), HTTP, SSE, or standalone CLI
- 📦 **Built-in templates**: Next.js 15 with Drizzle ORM, Storybook, and more

For detailed usage, see the [scaffold-mcp documentation](./packages/scaffold-mcp/README.md).

### Template Management

The `init` command automatically downloads official templates from the AgiFlow repository:

```bash
# Initialize and auto-download official templates
scaffold-mcp init

# Skip auto-download
scaffold-mcp init --no-download

# Custom templates path
scaffold-mcp init --path ./custom-templates
```

Add additional templates from GitHub (supports subdirectories):

```bash
# Add from full repository
scaffold-mcp add --name my-template --url https://github.com/user/repo

# Add from repository subdirectory
scaffold-mcp add \
  --name nextjs-template \
  --url https://github.com/user/repo/tree/main/templates/nextjs
```

**Current Templates:**
- **nextjs-15-drizzle**: Next.js 15 + App Router + TypeScript + Tailwind CSS 4 + Storybook + Optional Drizzle ORM
  - Boilerplate: Full application setup
  - Features: Routes, components, API routes, auth, services, and more

---

## Development Workflow

The AI Code Toolkit packages work together to create a complete development workflow for AI coding agents. Here's how they integrate:

### Complete Workflow: From Project Creation to Code Review

```
1. Bootstrap Project (scaffold-mcp)
   ↓
   scaffold-mcp boilerplate create → Creates project with template
   ↓
   Result: Project with architect.yaml + RULES.yaml from template

2. Get Design Guidance (architect-mcp)
   ↓
   architect-mcp get-file-design-pattern → Shows patterns for file
   ↓
   Result: AI agent understands architectural patterns to follow

3. Write Code (AI Agent)
   ↓
   Agent writes code following design patterns
   ↓
   Result: Code implementation

4. Review Code (architect-mcp)
   ↓
   architect-mcp review-code-change → Validates against rules
   ↓
   Result: Violations identified, feedback provided

5. Add Features (scaffold-mcp)
   ↓
   scaffold-mcp scaffold add → Adds new features/components
   ↓
   Result: Consistent code following patterns
```

### How They Work Together

**scaffold-mcp** and **architect-mcp** are complementary:

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **scaffold-mcp** | Generate code from templates | Creating new projects, adding standard features (routes, components) |
| **architect-mcp** | Guide and validate code | Understanding patterns, reviewing code quality |

**Integration Points:**

1. **Shared Templates**: Both use the same template structure
   ```
   templates/nextjs-15/
   ├── scaffold.yaml         ← scaffold-mcp: Defines boilerplates/features
   ├── architect.yaml        ← architect-mcp: Defines design patterns
   └── RULES.yaml            ← architect-mcp: Defines coding rules
   ```

2. **Project Configuration**: Projects reference templates via `project.json`
   ```json
   {
     "name": "my-app",
     "sourceTemplate": "nextjs-15"
   }
   ```

3. **Workflow Stages**:
   - **Pre-coding**: scaffold-mcp generates boilerplate → architect-mcp shows patterns
   - **During coding**: architect-mcp provides guidance → AI agent writes code
   - **Post-coding**: architect-mcp reviews code → Identifies violations
   - **Iteration**: scaffold-mcp adds features → architect-mcp validates

### Example: Building a Next.js Application

**Step 1: Create Project**
```bash
scaffold-mcp boilerplate create scaffold-nextjs-app \
  --vars '{"appName":"my-store","withDrizzle":true}'
```
Result: Project created with Next.js structure, architect.yaml, and RULES.yaml

**Step 2: Understand Patterns** (Before writing custom code)
```bash
architect-mcp get-file-design-pattern apps/my-store/src/app/products/page.tsx
```
Result: Shows "Next.js App Router Pattern" and applicable rules

**Step 3: Add Feature** (Standard features)
```bash
scaffold-mcp scaffold add scaffold-nextjs-route \
  --project apps/my-store \
  --vars '{"routePath":"products","pageTitle":"Products"}'
```
Result: Route created following template patterns

**Step 4: Write Custom Code** (AI agent writes business logic)
```typescript
// AI agent adds product fetching logic following patterns shown
export default async function ProductsPage() {
  const products = await fetchProducts(); // Custom logic
  return <div>{/* render products */}</div>;
}
```

**Step 5: Review Code**
```bash
architect-mcp review-code-change apps/my-store/src/app/products/page.tsx
```
Result: Validates against RULES.yaml (named exports, error handling, etc.)

### Why This Approach Works

1. **Templates as Single Source of Truth**: Both tools read from same template definitions
2. **Separation of Concerns**:
   - scaffold-mcp: Generates repetitive code
   - architect-mcp: Guides unique code
3. **Progressive Enhancement**:
   - Start with scaffolding (fast, consistent)
   - Add custom logic (AI-assisted, pattern-guided)
   - Validate output (automated review)
4. **Feedback Loop**: Reviews inform future scaffolding and patterns

### Using with AI Coding Agents

**Claude Desktop Configuration** (Both MCP servers):
```json
{
  "mcpServers": {
    "scaffold-mcp": {
      "command": "npx",
      "args": ["-y", "@agiflowai/scaffold-mcp", "mcp-serve", "--admin-enable"]
    },
    "architect-mcp": {
      "command": "npx",
      "args": [
        "-y", "@agiflowai/architect-mcp", "mcp-serve",
        "--admin-enable",
        "--design-pattern-tool", "claude-code",
        "--review-tool", "claude-code"
      ]
    }
  }
}
```

**Agent Instructions** (in CLAUDE.md or similar):
```markdown
When creating new features:
1. Use scaffold-mcp to generate boilerplate if standard feature exists
2. Use architect-mcp to understand patterns before writing custom code
3. Use architect-mcp to review code before committing

When updating patterns:
1. Use architect-mcp admin tools to update architect.yaml and RULES.yaml
2. Use scaffold-mcp admin tools to update scaffold.yaml templates
```

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
- 🎙️ Slash command prompts for AI coding agents

[View full documentation →](./packages/scaffold-mcp/README.md)

### [@agiflowai/architect-mcp](./packages/architect-mcp)

MCP server for software architecture design, code quality enforcement, and design pattern guidance.

**Key Features:**
- 🎨 Design pattern guidance for specific files
- ✅ Code review against template-specific rules
- 📐 Architecture patterns (architect.yaml)
- 📋 Coding standards and rules (RULES.yaml)
- 🤖 Optional LLM-powered analysis with Claude Code CLI
- 🌐 Multiple transport modes: stdio, HTTP, SSE
- 💻 Standalone CLI mode
- 🔧 Admin tools for pattern and rule management

[View full documentation →](./packages/architect-mcp/README.md)

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

#### Slash Command Prompts

The scaffold-mcp server provides built-in slash commands for AI coding agents like Claude Code:

**For Users:**
- **`/scaffold-mcp:scaffold-application`** - Guide the agent to create a new application from boilerplate templates
- **`/scaffold-mcp:scaffold-feature`** - Guide the agent to add features (pages, components, services) to existing projects

**For Template Creators:**
- **`/scaffold-mcp:generate-boilerplate`** - Guide the agent to create a new boilerplate template configuration
- **`/scaffold-mcp:generate-feature-scaffold`** - Guide the agent to create a new feature scaffold configuration

These prompts provide step-by-step instructions to the AI agent, ensuring it follows the correct workflow for scaffolding tasks. They're automatically available when the MCP server is configured in your coding agent.

📖 **[Learn how to use prompts →](./packages/scaffold-mcp/docs/how-to.md)**

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

### Scaffold MCP
- **[Scaffold MCP Guide](./packages/scaffold-mcp/README.md)** - Complete guide to the scaffolding MCP server
- **[How to Use Prompts](./packages/scaffold-mcp/docs/how-to.md)** - Step-by-step guide for using slash command prompts

### Architect MCP
- **[Architect MCP Guide](./packages/architect-mcp/README.md)** - Complete guide to the architecture and rules MCP server
- **[Design Pattern Overview](./packages/architect-mcp/docs/design-pattern-overview.md)** - High-level explanation of the design pattern system
- **[Rules Overview](./packages/architect-mcp/docs/rules-overview.md)** - Detailed guide to the coding rules system

### General
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to this project
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

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## License

[AGPL-3.0](./LICENSE) © AgiflowIO

---

**Built with ❤️ by the AgiflowIO team**

- 🐛 [Report Issues](https://github.com/AgiFlow/aicode-toolkit/issues)
- 💬 [Discussions](https://github.com/AgiFlow/aicode-toolkit/discussions)
- 🌐 [Website](https://agiflow.io)
