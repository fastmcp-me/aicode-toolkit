# How to Use Scaffold MCP Prompts

This guide shows you how to use the scaffold-mcp slash command prompts with AI coding agents like Claude Code.

## Table of Contents

- [For Users: Using Existing Templates](#for-users-using-existing-templates)
  - [Creating a New Application](#creating-a-new-application)
  - [Adding Features to Existing Projects](#adding-features-to-existing-projects)
- [For Template Creators: Creating Custom Templates](#for-template-creators-creating-custom-templates)
  - [Creating a Boilerplate Template](#creating-a-boilerplate-template)
  - [Creating a Feature Scaffold](#creating-a-feature-scaffold)

---

## For Users: Using Existing Templates

### Creating a New Application

Use the `/scaffold-mcp:scaffold-application` prompt to create a new project from built-in templates.

**Example prompts:**
```
/scaffold-mcp:scaffold-application create a new Next.js app for e-commerce
/scaffold-mcp:scaffold-application I need a new React app with Vite
/scaffold-mcp:scaffold-application scaffold a dashboard application
```

**What happens:**
1. The AI agent will list available boilerplate templates
2. It will ask for required information (project name, description, etc.)
3. It will create your project in the appropriate directory
4. You'll get instructions on how to run it

**Tips:**
- Use descriptive project names in kebab-case (e.g., `user-dashboard`, `admin-panel`)
- The AI will infer the best template based on your request
- All projects are created in the `apps/` directory by default

---

### Adding Features to Existing Projects

Use the `/scaffold-mcp:scaffold-feature` prompt to add pages, components, or services to existing projects.

**Example prompts:**
```
/scaffold-mcp:scaffold-feature add a products page to apps/ecommerce-app
/scaffold-mcp:scaffold-feature create a dashboard route in my Next.js app
/scaffold-mcp:scaffold-feature I need a new component in apps/my-app
```

**What happens:**
1. The AI will check what scaffolding methods are available for your project
2. It will ask for details about the feature (name, path, etc.)
3. It will generate the files following your project's patterns
4. You'll get guidance on how to use the generated code

**Tips:**
- Specify the project path (e.g., `apps/my-app`)
- Available features depend on your project's template type
- The AI follows your project's existing conventions automatically

---

## For Template Creators: Creating Custom Templates

### Creating a Boilerplate Template

Use the `/scaffold-mcp:generate-boilerplate` prompt to create a new boilerplate template from your codebase.

**When to use:**
- You have a project structure you want to reuse
- You want to create templates for frameworks not yet supported
- You need organization-specific boilerplates

**Example prompts:**
```
/scaffold-mcp:generate-boilerplate create a template for Express API with TypeScript
/scaffold-mcp:generate-boilerplate I want to make a boilerplate for React Native apps
/scaffold-mcp:generate-boilerplate template for our internal microservice architecture
```

**What happens:**
1. The AI will ask for template details:
   - Framework/technology (e.g., "React Native", "Express")
   - Template name in kebab-case (e.g., `react-native`)
   - Boilerplate name prefixed with `scaffold-` (e.g., `scaffold-rn-app`)
   - Target folder (`apps` or `packages`)
   - Required variables (at minimum: `appName` or `packageName`)
   - Files to include

2. The AI will guide you through:
   - Creating the boilerplate configuration with `generate-boilerplate`
   - Creating template files with `generate-boilerplate-file`
   - Testing the boilerplate with `use-boilerplate`

**Step-by-step workflow:**

#### Step 1: Provide Template Information
The AI will ask for:
- **Template name**: e.g., `express-api` (kebab-case)
- **Boilerplate name**: e.g., `scaffold-express-api` (must start with `scaffold-`)
- **Description**: Multi-paragraph overview explaining:
  - Core technology stack and value proposition
  - Target use cases
  - Key integrations or features
- **Target folder**: `apps` for applications, `packages` for libraries
- **Variables**: At minimum `appName` or `packageName`

#### Step 2: Generate Configuration
The AI uses `generate-boilerplate` to create `templates/{template-name}/scaffold.yaml`

#### Step 3: Create Template Files
For each file in your template:
- The AI uses `generate-boilerplate-file` to create `.liquid` files
- Template files use `{{ variableName }}` for substitution
- The AI adds helpful header comments with design patterns

**Example template file:**
```typescript
// templates/express-api/src/index.ts.liquid
/**
 * {{ appName }} - Express API Server
 *
 * DESIGN PATTERNS:
 * - MVC architecture with controller/service/repository layers
 * - Dependency injection for testability
 *
 * CODING STANDARDS:
 * - Use async/await for all async operations
 * - Export types alongside implementations
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to {{ appName }}' });
});

app.listen(PORT, () => {
  console.log(`{{ appName }} running on port ${PORT}`);
});
```

#### Step 4: Test Your Template
The AI will:
- List boilerplates to verify it appears
- Test it by creating a sample project
- Show you the generated files

**Tips:**
- Keep template content minimal and business-agnostic
- Focus on structure and patterns, not specific business logic
- Use clear variable names that make sense for your domain
- Include comprehensive instructions for AI agents

---

### Creating a Feature Scaffold

Use the `/scaffold-mcp:generate-feature-scaffold` prompt to create reusable feature generators.

**When to use:**
- You want to add scaffolding for pages, components, or services
- You have coding patterns you want to standardize
- You need to extend existing templates with new capabilities

**Example prompts:**
```
/scaffold-mcp:generate-feature-scaffold create a page scaffold for Next.js
/scaffold-mcp:generate-feature-scaffold I need a component generator for React
/scaffold-mcp:generate-feature-scaffold scaffold for creating API routes in Express
```

**What happens:**
1. The AI will ask for feature details:
   - Template name (e.g., `nextjs-15`)
   - Feature name prefixed with `scaffold-` (e.g., `scaffold-nextjs-component`)
   - Feature type (page, component, service, etc.)
   - Variables needed (e.g., `componentName`, `routePath`)
   - Files to include (with optional conditions)

2. The AI will guide you through:
   - Creating the feature configuration with `generate-feature-scaffold`
   - Creating template files with `generate-boilerplate-file`
   - Testing the feature with `use-scaffold-method`

**Step-by-step workflow:**

#### Step 1: Provide Feature Information
The AI will ask for:
- **Template name**: e.g., `nextjs-15` (must already exist)
- **Feature name**: e.g., `scaffold-nextjs-component` (must start with `scaffold-`)
- **Description**: 2-3 sentences explaining:
  - What type of code it generates
  - Key features or capabilities
  - When to use it
- **Variables**: Required fields for generation (e.g., `componentName`, `path`)

#### Step 2: Generate Configuration
The AI uses `generate-feature-scaffold` to add the feature to `templates/{template-name}/scaffold.yaml`

#### Step 3: Create Template Files
For each file the feature generates:
- The AI uses `generate-boilerplate-file` to create `.liquid` files
- Supports conditional includes: `file.tsx?withTests=true`
- Supports path mapping: `component.tsx->src/{{ componentPath }}/Component.tsx`

**Example feature template:**
```typescript
// templates/nextjs-15/src/components/Component.tsx.liquid
/**
 * {{ componentName }} Component
 *
 * DESIGN PATTERNS:
 * - Server Component by default (add 'use client' only when needed)
 * - Props interface defined above component
 *
 * CODING STANDARDS:
 * - Component name must be PascalCase
 * - Export as default for Next.js compatibility
 */

interface {{ componentName }}Props {
  // TODO: Add props
}

export default function {{ componentName }}({ }: {{ componentName }}Props) {
  return (
    <div>
      <h1>{{ componentName }}</h1>
    </div>
  );
}
```

#### Step 4: Test Your Feature
The AI will:
- List scaffolding methods to verify it appears
- Test it in a sample project
- Show you the generated files

**Advanced: Conditional Includes**

Use conditional syntax for optional files:

```yaml
includes:
  - "src/components/{{ componentName }}.tsx"
  - "src/components/{{ componentName }}.test.tsx?withTests=true"
  - "src/components/{{ componentName }}.stories.tsx?withStories=true"
```

**Advanced: Path Mapping**

Map source templates to dynamic target paths:

```yaml
includes:
  - "component.tsx->src/{{ componentPath }}/{{ componentName }}.tsx"
  - "index.ts->src/{{ componentPath }}/index.ts"
```

**Tips:**
- Keep generated code minimal - let AI fill in business logic later
- Add clear header comments explaining patterns and standards
- Use conditional includes for optional features (tests, stories, etc.)
- Test your feature scaffold thoroughly before sharing

---

## Best Practices

### For All Users

1. **Use Clear Prompts**: Be specific about what you want
2. **Follow Naming Conventions**: Use kebab-case for project/template names
3. **Leverage AI Guidance**: The prompts provide step-by-step instructions
4. **Test Thoroughly**: Always test generated code before committing

### For Template Creators

1. **Keep Templates Generic**: Focus on structure, not business logic
2. **Document Patterns**: Use header comments to explain design decisions
3. **Provide Clear Instructions**: Help AI understand your conventions
4. **Use Variables Wisely**: Make templates flexible but not overcomplicated
5. **Test with Real Projects**: Create sample projects to validate templates

---

## Troubleshooting

### Template Not Found
- Make sure you're using the correct template name
- Run `list-boilerplates` or `list-scaffolding-methods` to see available options

### Variables Not Working
- Check that variable names match exactly (case-sensitive)
- Ensure all required variables are provided
- Use `{{ variableName }}` syntax in template files

### Files Not Generated
- Verify file paths in the `includes` array
- Check conditional syntax for optional files (`?condition=true`)
- Ensure template files have `.liquid` extension

### Getting Help
- Check the [scaffold-mcp README](../README.md) for detailed documentation
- Review example templates in the `templates/` directory
- Open an issue on GitHub if you need assistance

---

## Next Steps

- **Explore Examples**: Check `templates/nextjs-15/` for a complete example
- **Read the API Docs**: See [README.md](../README.md) for MCP tool documentation
- **Join the Community**: Share your templates and get help from others
- **Contribute**: Help improve scaffold-mcp by contributing templates or features
