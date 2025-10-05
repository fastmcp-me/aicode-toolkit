# AI Code Toolkit

A collection of Model Context Protocol (MCP) servers for AI-powered development tools.

## Why This Exists

As projects evolve from MVP to mature state, they develop patterns, conventions, and opinionated approaches. Unfortunately, custom instructions (prompts) alone don't always ensure coding agents follow your requirements. As complexity grows, documenting all conventions and patterns in custom instructions and `.md` files overloads the context window.

This toolkit provides building blocks to scale coding agent capabilities as your project grows. Whether you're going from 0 to 1 or managing a complex monorepo with multiple apps and APIs, these tools ensure coding agents integrate with your internal processes and opinionated setup.

### Three Core Pillars

**1. Scaffolding Templates**

Scaffolding ensures standardization. Combining templating with LLMs generates code that follows your internal conventions while reducing template maintenance effort.

**2. Architecture + Design Patterns**

As projects grow, convention becomes more important than configuration. Frameworks like Ruby on Rails and Angular demonstrate how opinionated approaches make code easier to find and understand—the same principle applies to coding agents.

**3. Rules**

Think of architecture and design patterns as pre-steps to guide the coding agent, and rules as post-checks to enforce your processes. Rules can be quantitative or qualitative, providing programmatic validation of agent outputs.

## Our Approach

### Agent Agnostic

The toolkit includes MCPs for scaffolding, architecture guidance, rules checking, and more. These MCPs work with any coding agent. Each library also provides CLI commands as alternatives to MCP tools, allowing you to script deterministic workflows.

### Tech Stack Agnostic

The toolkit works with any tech stack. While we provide templates for popular frameworks (Next.js, Vite React, etc.), you can create custom templates for any framework. If your stack isn't covered, use the provided custom instructions or built-in MCP tools to generate your own templates.

### Coding Tool Specific

To maximize effectiveness, combine MCPs with custom instructions, slash commands, and hooks. Follow this experimentation flow:

1. **Install MCP servers** - Let the MCPs' default prompts guide the agent
2. **Add custom instructions** - Use `CLAUDE.md`, `AGENTS.md`, etc. to specify when to use particular MCP servers
3. **Add hooks** - Use CLI commands directly or intercept tool calls (e.g., prevent agents from creating arbitrary files when template features exist, prompting them to use scaffolding MCP instead)

Calibrate these three steps to find the sweet spot for your project and tools. No one-size-fits-all solution exists.

## Packages

### [@agiflowai/scaffold-mcp](./packages/scaffold-mcp)

An MCP server for scaffolding applications with boilerplate templates and feature generators.

**Features:**
- Create projects from boilerplate templates
- Add features to existing projects with custom generators
- Template management (initialize, add from repositories)
- Support for Next.js, Vite React, and custom boilerplates
- Multiple transport modes: stdio, HTTP, SSE
- Standalone CLI mode

**Quick Start:**
```bash
# Install
pnpm install @agiflowai/scaffold-mcp

# Run as MCP server (for Claude Desktop)
scaffold-mcp mcp-serve

# Use as CLI
scaffold-mcp init
scaffold-mcp boilerplate list
scaffold-mcp boilerplate create <name> --vars '{"appName":"my-app"}'
```

[View full documentation](./packages/scaffold-mcp/README.md)

## Development

This is an Nx monorepo. Common commands:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build a specific package
pnpm exec nx build scaffold-mcp

# Lint all packages
pnpm lint

# Lint and fix all packages
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Run tests
pnpm exec nx test scaffold-mcp

# Type check
pnpm exec nx typecheck scaffold-mcp

# View project graph
pnpm exec nx graph
```

### Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting:
- **Fast**: Written in Rust, much faster than ESLint
- **All-in-one**: Replaces ESLint and Prettier
- **Zero config**: Works out of the box with sensible defaults

Configuration is in `biome.json` at the workspace root.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

AGPL-3.0
