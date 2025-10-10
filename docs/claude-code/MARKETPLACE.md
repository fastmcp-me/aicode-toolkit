# AICode Toolkit Plugin Marketplace

Welcome to the AICode Toolkit plugin marketplace! This marketplace provides access to AI-powered development tools for code generation, architecture design, and monorepo management through Claude Code plugins.

## Overview

The AICode Toolkit marketplace offers **4 focused plugins** organized by project maturity and purpose. Install only what you need for your current development stage.

> **No One-Size-Fits-All:** Each plugin is designed for a specific phase of development. Choose the ones that match your current needs.

### 🚀 aicode-bootstrap
**Bootstrap Phase: Create new projects**

Perfect for starting new applications with boilerplate templates.

**What you get:**
- Create new projects from templates (Next.js, React, Vite, etc.)
- Browse available boilerplates
- Quick project initialization

**When to use:**
- Starting a new project
- Bootstrapping MVP
- Setting up initial structure

**Install:** `/plugin install aicode-bootstrap@aicode-toolkit`

---

### 🔨 aicode-develop
**Development Phase: Build features with guidance**

Combines feature scaffolding with **AI-powered design pattern guidance** for active development.

**What you get:**
- Add pages, components, services to existing projects
- **Intelligent pattern filtering** - AI analyzes your file and shows only relevant patterns
- Get context-aware design recommendations
- Understand architectural decisions before coding
- Follow established patterns automatically
- **`/edit-with-pattern` slash command** - Enforced quality workflow

**AI-Powered Features:**
- Uses Claude Code CLI to analyze file content
- Filters out irrelevant patterns
- Shows only applicable design rules
- Provides precise, context-aware guidance

**Slash Command:**
- `/edit-with-pattern` - Enforces: Check patterns → Edit → Review workflow
- Prevents pattern violations before they happen
- Automatically reviews changes after editing

**Specialized Agents:**
- **Architecture Review Agent** - Evaluates architectural decisions with trade-off analysis
- **Test Coverage Agent** - Generates comprehensive test cases and identifies gaps
- **Migration Assistant Agent** - Guides framework/library upgrades with phased plans

**When to use:**
- Daily feature development
- Adding functionality to existing projects
- Learning project architecture
- Ensuring consistency before editing
- Complex architectural decisions (use agents)
- Testing and migrations (use agents)

**Install:** `/plugin install aicode-develop@aicode-toolkit`

---

### ✅ aicode-review
**Quality Phase: Enforce standards**

Review code changes against architectural rules and coding standards with **AI-powered analysis**.

**What you get:**
- **Intelligent code review** - AI analyzes your changes for violations
- Automated rule compliance checking
- Design pattern validation
- Severity-based feedback (critical, warning, suggestion)
- Context-aware recommendations

**AI-Powered Features:**
- Uses Claude Code CLI to understand code intent
- Detects subtle violations beyond regex matching
- Provides actionable fix suggestions
- Explains why rules matter

**When to use:**
- Code reviews and PR checks
- Quality assurance before commits
- Enforcing team standards
- Mature project governance

**Install:** `/plugin install aicode-review@aicode-toolkit`

---

### ⚙️ aicode-admin
**Customization Phase: Create templates**

For platform engineers building reusable templates and patterns.

**What you get:**
- Create custom boilerplate templates
- Define design patterns
- Manage coding rules
- Build scaffolding features

**When to use:**
- Building framework templates
- Creating team standards
- Platform engineering
- Template customization

**Install:** `/plugin install aicode-admin@aicode-toolkit`

---

## 🎯 Quick Start: Which Plugin Do I Need?

**Not sure which plugin to install?** See the **[Plugin Selection Guide](./PLUGIN_SELECTION_GUIDE.md)** for detailed recommendations based on your:
- Project stage (new, active, mature)
- Team role (developer, lead, architect)
- Current workflow needs

---

## 🤖 AI-Powered Intelligence

The `aicode-develop` and `aicode-review` plugins include **AI-powered analysis** via Claude Code CLI integration:

### Intelligent Pattern Filtering (`aicode-develop`)

When you ask for design patterns, the tool doesn't just match file paths—it **reads and analyzes your file content** using AI:

**Traditional approach:**
```
File: src/components/Button.tsx
Matches pattern: **/*.tsx
Returns: ALL React patterns (even irrelevant ones)
```

**AI-powered approach:**
```
File: src/components/Button.tsx
AI analyzes: "This is a presentational component with props"
Returns: ONLY component patterns, prop validation, accessibility rules
Filters out: Server component patterns, data fetching patterns, etc.
```

**Benefits:**
- ✅ See only patterns that matter for THIS specific file
- ✅ Reduce noise and cognitive load
- ✅ Get precise, actionable guidance
- ✅ Learn why each pattern is relevant

### Intelligent Code Review (`aicode-review`)

Code review goes beyond simple pattern matching—AI **understands your code's intent**:

**Traditional approach:**
```
Rule: "Must handle errors in API calls"
Check: searches for try-catch blocks
Result: false positives, missed edge cases
```

**AI-powered approach:**
```
Rule: "Must handle errors in API calls"
AI analyzes: code flow, error propagation, promise chains
Result: detects missing error handling even in complex async code
Suggests: specific fix for your context
```

**Benefits:**
- ✅ Catch subtle violations beyond regex
- ✅ Context-aware recommendations
- ✅ Fewer false positives
- ✅ Actionable fix suggestions

### How It Works

Both features use the **Claude Code CLI** (`claude` command) to invoke AI analysis:

1. Tool reads your file content
2. Sends file + patterns/rules to Claude Code
3. AI analyzes and returns filtered/enhanced results
4. You get precise, relevant guidance

**Requirements:**
- Claude Code CLI installed (usually already present if using Claude Code)
- Configured automatically via `--design-pattern-tool claude-code` and `--review-tool claude-code` flags

---

## Installation

### Quick Start: Install from GitHub

The easiest way to install the marketplace is directly from GitHub:

```bash
/plugin marketplace add AgiFlow/aicode-toolkit
```

This will add the marketplace to your Claude Code instance and make both MCP servers available for installation.

> **Note:** The GitHub marketplace uses `npx` to run the published npm packages (@agiflowai/scaffold-mcp and @agiflowai/architect-mcp). This ensures dependencies are properly managed without requiring a local build.

### Install Individual Plugins

After adding the marketplace, install the plugins you need based on your development stage:

```bash
# For new projects
/plugin install aicode-bootstrap@aicode-toolkit

# For feature development (most common)
/plugin install aicode-develop@aicode-toolkit

# For code review and quality
/plugin install aicode-review@aicode-toolkit

# For template creation (advanced)
/plugin install aicode-admin@aicode-toolkit

# Or browse all plugins interactively
/plugin
```

**💡 Tip:** Start with `aicode-bootstrap` (new projects) or `aicode-develop` (existing projects). Add others as needed.

### Local Development Installation

For local development or testing, use the local marketplace configuration:

```bash
# Clone the repository
git clone https://github.com/AgiFlow/aicode-toolkit.git
cd aicode-toolkit

# Build the packages
pnpm install
pnpm build

# Add the local marketplace (uses marketplace.local.json)
/plugin marketplace add ./.claude-plugin/marketplace.local.json
```

> **Note:** The local marketplace (`marketplace.local.json`) uses `node ${CLAUDE_PLUGIN_ROOT}/dist/index.cjs` to run the built packages directly from your local repository. This is only suitable for development when you have the repository cloned and built.

## Team Distribution

### Automatic Installation for Teams

Configure your project's `.claude/settings.json` to automatically install the marketplace for all team members.

#### Example: Development Team (Most Common)
```json
{
  "extraKnownMarketplaces": {
    "aicode-toolkit": {
      "source": {
        "source": "github",
        "repo": "AgiFlow/aicode-toolkit"
      }
    }
  },
  "enabledPlugins": [
    "aicode-develop@aicode-toolkit",
    "aicode-review@aicode-toolkit"
  ]
}
```

#### Example: New Project Team
```json
{
  "extraKnownMarketplaces": {
    "aicode-toolkit": {
      "source": {
        "source": "github",
        "repo": "AgiFlow/aicode-toolkit"
      }
    }
  },
  "enabledPlugins": [
    "aicode-bootstrap@aicode-toolkit",
    "aicode-develop@aicode-toolkit"
  ]
}
```

#### Example: Platform Engineering Team
```json
{
  "extraKnownMarketplaces": {
    "aicode-toolkit": {
      "source": {
        "source": "github",
        "repo": "AgiFlow/aicode-toolkit"
      }
    }
  },
  "enabledPlugins": [
    "aicode-admin@aicode-toolkit",
    "aicode-review@aicode-toolkit"
  ]
}
```

When team members trust the repository folder, Claude Code will automatically:
1. Install the aicode-toolkit marketplace
2. Install and enable the specified plugins

**💡 Tip:** Different team members can enable different plugins based on their role. The marketplace configuration stays the same.

### Private Marketplace for Organizations

For organizations that want to customize or extend the marketplace:

1. Fork the repository
2. Customize `.claude-plugin/marketplace.json`
3. Add your custom plugins or modify existing ones
4. Update your team's `.claude/settings.json` to point to your fork:

```json
{
  "extraKnownMarketplaces": {
    "aicode-toolkit": {
      "source": {
        "source": "github",
        "repo": "your-org/aicode-toolkit"
      }
    }
  }
}
```

## Managing the Marketplace

### List Known Marketplaces

```bash
/plugin marketplace list
```

### Update Marketplace Metadata

Refresh plugin listings and metadata:

```bash
/plugin marketplace update aicode-toolkit
```

### Remove the Marketplace

```bash
/plugin marketplace remove aicode-toolkit
```

⚠️ **Warning:** Removing a marketplace will uninstall any plugins you installed from it.

## Plugin Usage

### aicode-bootstrap

After installing aicode-bootstrap, you can:

**List available project templates:**
```
Ask Claude: "List available boilerplates"
Ask Claude: "What project templates can I create?"
```

**Create a new project:**
```
Ask Claude: "Create a new Next.js app called my-store"
Ask Claude: "Bootstrap a React + Vite project with TypeScript"
```

---

### aicode-develop

After installing aicode-develop, you can:

**Add features to existing projects:**
```
Ask Claude: "Add a products page to my Next.js app"
Ask Claude: "Generate a new API route for user authentication"
Ask Claude: "Create a reusable Button component"
```

**Get design pattern guidance:**
```
Ask Claude: "What design patterns should I follow for src/app/products/page.tsx?"
Ask Claude: "Show me the architecture patterns for this component"
```

**Use the workflow slash command:**
```
/edit-with-pattern
```
Then describe what file to edit and what changes to make. Claude will:
1. Check design patterns first (AI-filtered)
2. Show you the applicable rules
3. Make the edit following patterns
4. Review the changes automatically
5. Fix any violations found

**Use specialized agents for complex tasks:**

**Architecture Review Agent** - For major architectural decisions:
```
Task: architecture-reviewer
Prompt: I need to add real-time notifications to my Next.js app. Should I use WebSockets or Server-Sent Events?
```
The agent will:
- Analyze your current architecture with get-file-design-pattern
- Present multiple alternatives with trade-offs
- Provide implementation recommendations
- Create a detailed plan

**Test Coverage Agent** - For comprehensive testing:
```
Task: test-coverage
Prompt: Analyze test coverage for src/components/ProductCard.tsx and generate missing tests
```
The agent will:
- Identify untested code paths
- Generate test cases (happy paths, edge cases, errors)
- Review test quality with review-code-change
- Suggest coverage improvements

**Migration Assistant Agent** - For framework/library upgrades:
```
Task: migration-assistant
Prompt: Help me migrate from Next.js 12 to Next.js 15
```
The agent will:
- Research breaking changes from official docs
- Analyze codebase impact with grep and design pattern tools
- Create a phased, reversible migration plan
- Guide you through each step with validation

---

### aicode-review

After installing aicode-review, you can:

**Review code quality:**
```
Ask Claude: "Review src/components/ProductCard.tsx for code quality"
Ask Claude: "Check if my changes follow the team's coding standards"
Ask Claude: "Validate this file against architectural rules"
```

---

### aicode-admin

After installing aicode-admin, you can:

**Create custom templates:**
```
Ask Claude: "Create a new boilerplate for our microservice template"
Ask Claude: "Add a feature scaffold for creating database models"
```

**Define patterns and rules:**
```
Ask Claude: "Add a design pattern for our data access layer"
Ask Claude: "Create a coding rule for error handling in API routes"
```

## Troubleshooting

### Marketplace not loading

**Symptoms:** Can't add marketplace or see plugins from it

**Solutions:**
- Verify you have access to the GitHub repository
- Check your network connection
- Ensure Claude Code is up to date
- Try removing and re-adding the marketplace

### Plugin installation failures

**Symptoms:** Marketplace appears but plugin installation fails

**Solutions:**
- Verify the packages are built: `pnpm build`
- Check that `dist/index.cjs` exists in each package
- For local installation, ensure you're using an absolute path
- Check Claude Code logs for detailed error messages

### Validation and Testing

Test your marketplace before sharing:

```bash
# Validate marketplace JSON syntax
claude plugin validate .

# Add marketplace for testing
/plugin marketplace add ./path/to/aicode-toolkit

# Install test plugin
/plugin install scaffold-mcp@aicode-toolkit
```

## Contributing

We welcome contributions to the AICode Toolkit marketplace!

### Adding New Plugins

1. Create your MCP server package in `packages/`
2. Add a `plugin.json` manifest to your package
3. Update `.claude-plugin/marketplace.json` to include your plugin
4. Submit a pull request

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/AgiFlow/aicode-toolkit/issues) on GitHub.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation:** [GitHub Repository](https://github.com/AgiFlow/aicode-toolkit)
- **Issues:** [GitHub Issues](https://github.com/AgiFlow/aicode-toolkit/issues)
- **Discussions:** [GitHub Discussions](https://github.com/AgiFlow/aicode-toolkit/discussions)

## See Also

- [Claude Code Plugins Documentation](https://docs.claude.com/en/docs/claude-code/plugins)
- [Plugin Marketplaces Guide](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- [Model Context Protocol (MCP)](https://docs.claude.com/en/docs/mcp)
