# architect-mcp

MCP server for software architecture design and planning

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Test

```bash
pnpm test
```

## Usage with Claude Code

Add to your Claude Code configuration:

```json
{
  "mcpServers": {
    "architect-mcp": {
      "command": "node",
      "args": ["/path/to/architect-mcp/dist/index.js"]
    }
  }
}
```