# Plugin Selection Guide

The AICode Toolkit marketplace offers focused plugins organized by project maturity and purpose. This guide helps you choose the right plugins for your needs.

## 🎯 Choose Plugins by Project Stage

### Just Starting? → `aicode-bootstrap`

**You need:** `aicode-bootstrap`

**Perfect for:**
- Creating new projects from scratch
- Bootstrapping applications quickly
- Setting up standard project structures
- Individual developers starting new work

**What you get:**
- `list-boilerplates` - Browse available project templates
- `use-boilerplate` - Create new projects from templates

**Use when:**
```bash
# Starting a new Next.js app
/plugin install aicode-bootstrap@aicode-toolkit
```

**Example tasks:**
- "Create a new Next.js application with Drizzle ORM"
- "List available project templates"
- "Bootstrap a new React + Vite project"

---

### Actively Developing? → `aicode-develop`

**You need:** `aicode-develop`

**Perfect for:**
- Adding features to existing projects
- Following design patterns while coding
- Understanding architectural decisions
- Day-to-day feature development

**What you get:**
- `list-scaffolding-methods` - See available features to add
- `use-scaffold-method` - Generate pages, components, services
- `get-file-design-pattern` - Understand patterns for specific files
- `/edit-with-pattern` - Slash command for enforced quality workflow
- **3 specialized agents:**
  - **Architecture Review Agent** - Evaluate architectural decisions
  - **Test Coverage Agent** - Generate comprehensive tests
  - **Migration Assistant Agent** - Guide framework/library upgrades

**Use when:**
```bash
# Working on an existing project
/plugin install aicode-develop@aicode-toolkit
```

**Example tasks:**
- "Add a new product page to my Next.js app"
- "What design patterns should I follow for this component?"
- "Generate a new API route for user authentication"
- "Show me the architecture patterns for this file"

**Using specialized agents:**
```
Task: architecture-reviewer
Prompt: Should I use WebSockets or Server-Sent Events for real-time notifications?

Task: test-coverage
Prompt: Generate tests for src/components/ProductCard.tsx

Task: migration-assistant
Prompt: Help me migrate from Next.js 12 to Next.js 15
```

---

### Reviewing Code? → `aicode-review`

**You need:** `aicode-review`

**Perfect for:**
- Code reviews and quality checks
- Enforcing coding standards
- Validating architectural compliance
- Tech leads and code reviewers

**What you get:**
- `review-code-change` - Review code against rules and patterns

**Use when:**
```bash
# Reviewing code quality
/plugin install aicode-review@aicode-toolkit
```

**Example tasks:**
- "Review this component for code quality issues"
- "Check if my changes follow the team's standards"
- "Validate this code against architectural rules"

---

### Building Templates? → `aicode-admin`

**You need:** `aicode-admin`

**Perfect for:**
- Creating custom templates and boilerplates
- Defining team design patterns
- Managing coding rules and standards
- Platform engineers and framework authors

**What you get:**
- `generate-boilerplate` - Create new project templates
- `generate-feature-scaffold` - Create feature generators
- `generate-boilerplate-file` - Create template files
- `add-design-pattern` - Define architecture patterns
- `add_rule` - Create coding rules

**Use when:**
```bash
# Building custom templates for your team
/plugin install aicode-admin@aicode-toolkit
```

**Example tasks:**
- "Create a new boilerplate for our microservice template"
- "Define a design pattern for our data access layer"
- "Add a coding rule for error handling"

---

## 📊 Choose Plugins by Team Role

### Individual Developer
**Install:** `aicode-bootstrap` + `aicode-develop`

You'll be able to start new projects and build features following established patterns.

```bash
/plugin install aicode-bootstrap@aicode-toolkit
/plugin install aicode-develop@aicode-toolkit
```

### Tech Lead / Senior Developer
**Install:** `aicode-develop` + `aicode-review`

You'll guide development with patterns and enforce quality through reviews.

```bash
/plugin install aicode-develop@aicode-toolkit
/plugin install aicode-review@aicode-toolkit
```

### Platform Engineer / Architect
**Install:** `aicode-admin` + `aicode-review`

You'll create templates, define patterns, and ensure compliance.

```bash
/plugin install aicode-admin@aicode-toolkit
/plugin install aicode-review@aicode-toolkit
```

### Full Stack (All Phases)
**Install:** All plugins

For complete project lifecycle management.

```bash
/plugin install aicode-bootstrap@aicode-toolkit
/plugin install aicode-develop@aicode-toolkit
/plugin install aicode-review@aicode-toolkit
/plugin install aicode-admin@aicode-toolkit
```

---

## 🔄 Choose Plugins by Workflow

### Workflow: New Project → Production

**Phase 1: Bootstrap** (Week 1)
```bash
/plugin install aicode-bootstrap@aicode-toolkit
```
→ Create project structure, set up initial templates

**Phase 2: Development** (Weeks 2-8)
```bash
/plugin uninstall aicode-bootstrap@aicode-toolkit
/plugin install aicode-develop@aicode-toolkit
```
→ Build features, follow patterns

**Phase 3: Quality & Scale** (Week 8+)
```bash
/plugin install aicode-review@aicode-toolkit
```
→ Enforce standards, review code (keep aicode-develop too)

**Phase 4: Customization** (As needed)
```bash
/plugin install aicode-admin@aicode-toolkit
```
→ Create team-specific templates

---

## 🤔 Decision Tree

```
Are you creating a NEW project?
├─ Yes → Install `aicode-bootstrap`
└─ No → Continue...

Are you adding FEATURES to an existing project?
├─ Yes → Install `aicode-develop`
└─ No → Continue...

Are you REVIEWING code or enforcing standards?
├─ Yes → Install `aicode-review`
└─ No → Continue...

Are you CREATING templates or patterns?
├─ Yes → Install `aicode-admin`
└─ No → You might not need any plugins yet
```

---

## 💡 Common Combinations

### Solo Developer Building MVP
```bash
# Start fast, minimal setup
/plugin install aicode-bootstrap@aicode-toolkit
/plugin install aicode-develop@aicode-toolkit
```

### Team with Established Codebase
```bash
# Focus on consistency
/plugin install aicode-develop@aicode-toolkit
/plugin install aicode-review@aicode-toolkit
```

### Platform Team for Large Org
```bash
# Create and enforce standards
/plugin install aicode-admin@aicode-toolkit
/plugin install aicode-review@aicode-toolkit
```

### Agency Building Multiple Projects
```bash
# Full toolkit for varied projects
/plugin install aicode-bootstrap@aicode-toolkit
/plugin install aicode-develop@aicode-toolkit
/plugin install aicode-admin@aicode-toolkit
```

---

## 📋 Plugin Comparison

| Plugin | Bootstrap | Develop | Review | Admin |
|--------|-----------|---------|--------|-------|
| **Primary Use** | Create projects | Build features | Check quality | Create templates |
| **Target User** | All developers | Active developers | Code reviewers | Platform engineers |
| **Project Phase** | Week 1 | Weeks 2-∞ | Week 4+ | As needed |
| **Complexity** | Low | Medium | Medium | High |
| **MCP Servers** | 1 | 2 | 1 | 2 |
| **Learning Curve** | Easy | Easy | Easy | Advanced |

---

## 🎓 Getting Started Recommendations

### First Time Users
**Start with:** `aicode-bootstrap`

Get familiar with the system by creating a new project. Once comfortable, add `aicode-develop`.

### Experienced Developers
**Start with:** `aicode-develop` + `aicode-review`

Jump into feature development with quality enforcement from day one.

### Framework Authors
**Start with:** `aicode-admin`

Focus on creating reusable templates for your framework or organization.

---

## ⚙️ Plugin Installation

### Install Individual Plugin
```bash
/plugin install <plugin-name>@aicode-toolkit
```

### Install Multiple Plugins
Add to `.claude/settings.json`:
```json
{
  "extraKnownMarketplaces": {
    "aicode-toolkit": {
      "source": {"source": "github", "repo": "AgiFlow/aicode-toolkit"}
    }
  },
  "enabledPlugins": [
    "aicode-bootstrap@aicode-toolkit",
    "aicode-develop@aicode-toolkit"
  ]
}
```

### Switch Plugins as You Progress
```bash
# Start
/plugin install aicode-bootstrap@aicode-toolkit

# Later when project is setup
/plugin uninstall aicode-bootstrap@aicode-toolkit
/plugin install aicode-develop@aicode-toolkit

# When team grows
/plugin install aicode-review@aicode-toolkit
```

---

## 🔍 Still Not Sure?

### Ask Yourself:

**Q: What am I doing RIGHT NOW?**
- Creating a new project → `aicode-bootstrap`
- Adding features → `aicode-develop`
- Reviewing PR → `aicode-review`
- Building templates → `aicode-admin`

**Q: What's my biggest pain point?**
- Too slow to start projects → `aicode-bootstrap`
- Inconsistent code patterns → `aicode-develop`
- Code quality issues → `aicode-review`
- No reusable templates → `aicode-admin`

**Q: What's my team size?**
- Solo (1-2) → `bootstrap` + `develop`
- Small (3-5) → `develop` + `review`
- Medium (6-20) → `develop` + `review` + `admin`
- Large (20+) → All plugins, different roles

---

## 📚 Learn More

- [Full Marketplace Documentation](./MARKETPLACE.md)
- [Bootstrap Plugin Examples](../../packages/scaffold-mcp/README.md)
- [Development Plugin Examples](../../packages/scaffold-mcp/README.md)
- [Review Plugin Examples](../../packages/architect-mcp/README.md)
- [Admin Plugin Examples](../../packages/scaffold-mcp/docs/how-to.md)

---

**Remember:** You can always install more plugins later. Start small and grow as your needs evolve!
