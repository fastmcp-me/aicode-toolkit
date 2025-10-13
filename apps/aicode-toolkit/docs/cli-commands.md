# CLI Commands Reference

Complete reference for all CLI commands in scaffold-mcp.

## Table of Contents

- [Boilerplate Commands](#boilerplate-commands)
  - [boilerplate list](#boilerplate-list)
  - [boilerplate info](#boilerplate-info)
  - [boilerplate create](#boilerplate-create)
- [Scaffold Commands](#scaffold-commands)
  - [scaffold list](#scaffold-list)
  - [scaffold info](#scaffold-info)
  - [scaffold add](#scaffold-add)

---

## Boilerplate Commands

Commands for working with boilerplate templates to create new projects.

### boilerplate list

List all available boilerplate templates.

**Usage:**
```bash
scaffold-mcp boilerplate list
```

**Output:**
```
Available boilerplates:
┌─────────┬──────────────────────────┬─────────────────────────────────────────────┐
│ (index) │ name                     │ description                                 │
├─────────┼──────────────────────────┼─────────────────────────────────────────────┤
│ 0       │ 'nextjs-15-boilerplate'  │ 'Next.js 15 application boilerplate...'     │
└─────────┴──────────────────────────┴─────────────────────────────────────────────┘
```

---

### boilerplate info

Get detailed information about a specific boilerplate template.

**Usage:**
```bash
scaffold-mcp boilerplate info <boilerplate-name>
```

**Arguments:**
- `<boilerplate-name>` - The exact name of the boilerplate (from `boilerplate list`)

**Example:**
```bash
scaffold-mcp boilerplate info nextjs-15-boilerplate
```

**Output:**
Shows the boilerplate's:
- Name and description
- Template path location
- Required variables schema
- Variable examples
- Available scaffold features

---

### boilerplate create

Create a new project from a boilerplate template.

**Usage:**
```bash
scaffold-mcp boilerplate create <boilerplate-name> [options]
```

**Arguments:**
- `<boilerplate-name>` - The exact name of the boilerplate

**Options:**
- `--vars <json>` - JSON object with variables (required)
- `--target <path>` - Target directory (default: current directory)

**Example:**
```bash
scaffold-mcp boilerplate create nextjs-15-boilerplate \
  --vars '{
    "projectName": "my-app",
    "packageName": "@myorg/my-app",
    "appName": "My App",
    "description": "My awesome application"
  }' \
  --target ./apps
```

**What it does:**
1. Creates a new directory at `<target>/<projectName>`
2. Copies all template files from the boilerplate
3. Processes all files for variable replacement using Liquid templating
4. Creates or updates `project.json` with `sourceTemplate` field
5. Returns list of created files

**Output:**
```
✅ Boilerplate created successfully!

Successfully scaffolded my-app in ./apps/my-app.

📁 Created files:
   - ./apps/my-app/package.json
   - ./apps/my-app/project.json
   - ./apps/my-app/src/app/page.tsx
   - ... (all template files)
```

---

## Scaffold Commands

Commands for adding features to existing projects.

### scaffold list

List all available scaffold methods (features) for a project.

**Usage:**
```bash
scaffold-mcp scaffold list <project-path>
```

**Arguments:**
- `<project-path>` - Absolute or relative path to the project directory

**How it works:**
1. Reads `project.json` in the project directory
2. Extracts the `sourceTemplate` field
3. Finds the template directory matching the `sourceTemplate`
4. Reads `scaffold.yaml` from that template
5. Lists all scaffold methods defined in the configuration

**Example:**
```bash
scaffold-mcp scaffold list ./apps/my-app
```

**Output:**
```
Available scaffold methods for project at ./apps/my-app:

┌─────────┬──────────────────────────┬─────────────────────────────────────────────┐
│ (index) │ name                     │ description                                 │
├─────────┼──────────────────────────┼─────────────────────────────────────────────┤
│ 0       │ 'scaffold-nextjs-page'   │ 'Add new pages to Next.js applications...'  │
└─────────┴──────────────────────────┴─────────────────────────────────────────────┘
```

**Note:** Project must have a `project.json` file with a `sourceTemplate` field.

---

### scaffold info

Get detailed information about a specific scaffold method.

**Usage:**
```bash
scaffold-mcp scaffold info <feature-name> --project <project-path>
```

**Arguments:**
- `<feature-name>` - The name of the scaffold method

**Options:**
- `--project <path>` - Path to the project (required)

**Example:**
```bash
scaffold-mcp scaffold info scaffold-nextjs-page --project ./apps/my-app
```

**Output:**
Shows the scaffold method's:
- Name and description
- Detailed instruction on how to use the generated code
- Required variables schema
- Variable examples
- Include patterns
- Custom generator (if any)

---

### scaffold add

Add a feature to an existing project using a scaffold method.

**Usage:**
```bash
scaffold-mcp scaffold add <feature-name> [options]
```

**Arguments:**
- `<feature-name>` - The name of the scaffold method to use

**Options:**
- `--project <path>` - Path to the project (required)
- `--vars <json>` - JSON object with variables (required)

**Example:**
```bash
scaffold-mcp scaffold add scaffold-nextjs-page \
  --project ./apps/my-app \
  --vars '{
    "appPath": "/absolute/path/to/apps/my-app",
    "appName": "my-app",
    "pageTitle": "About Us",
    "pageDescription": "Learn more about our company",
    "nextjsPagePath": "/about",
    "withLayout": false
  }'
```

**What it does:**
1. Validates the project has a `project.json` with `sourceTemplate`
2. Finds the template and scaffold method configuration
3. If the scaffold method has a custom generator:
   - Dynamically imports the generator from the template's `generators/` folder
   - Executes the generator with context and utilities
4. If no custom generator:
   - Processes include patterns from `scaffold.yaml`
   - Copies files from template to project
   - Performs variable replacement using Liquid templating
5. Tracks created and existing files
6. Returns success message with instructions

**Output:**
```
✅ Feature added successfully!

Successfully scaffolded scaffold-nextjs-page in ./apps/my-app.

Please follow this instruction:
[Detailed instructions from scaffold.yaml]

📁 Created files:
   - ./apps/my-app/src/app/about/page.tsx

📋 Next steps:
   - Review the generated files
   - Update imports if necessary
   - Run tests to ensure everything works
```

**Custom Generators:**
If a scaffold method specifies a `generator` field in `scaffold.yaml`, it will use a custom TypeScript generator instead of the default include-based scaffolding. The generator receives:
- All variables
- File system service
- Variable replacement service
- Scaffold config loader
- Template processing utilities

---

## Variable Substitution

All commands that accept `--vars` support Liquid templating syntax in template files.

**Example template file:**
```typescript
// src/components/{{ componentName }}.tsx
export const {{ componentName }} = () => {
  return <div>{{ description }}</div>;
};
```

**With variables:**
```json
{
  "componentName": "MyComponent",
  "description": "A simple component"
}
```

**Result:**
```typescript
// src/components/MyComponent.tsx
export const MyComponent = () => {
  return <div>A simple component</div>;
};
```

---

## Exit Codes

- `0` - Success
- `1` - General error (template not found, validation failed, etc.)
- Non-zero - Command execution error

---

## Examples

### Complete workflow: Create project and add features

```bash
# 1. List available boilerplates
scaffold-mcp boilerplate list

# 2. Create a new Next.js project
scaffold-mcp boilerplate create nextjs-15-boilerplate \
  --vars '{"projectName":"my-app","packageName":"@myorg/my-app","appName":"My App"}' \
  --target ./apps

# 3. List available features for the new project
scaffold-mcp scaffold list ./apps/my-app

# 4. Add an About page
scaffold-mcp scaffold add scaffold-nextjs-page \
  --project ./apps/my-app \
  --vars '{
    "appPath": "/absolute/path/to/apps/my-app",
    "appName": "my-app",
    "pageTitle": "About Us",
    "pageDescription": "Learn more about our company",
    "nextjsPagePath": "/about"
  }'

# 5. Add a Contact page
scaffold-mcp scaffold add scaffold-nextjs-page \
  --project ./apps/my-app \
  --vars '{
    "appPath": "/absolute/path/to/apps/my-app",
    "appName": "my-app",
    "pageTitle": "Contact",
    "pageDescription": "Get in touch with us",
    "nextjsPagePath": "/contact"
  }'
```
