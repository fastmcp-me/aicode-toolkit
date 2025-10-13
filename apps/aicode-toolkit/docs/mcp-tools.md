# MCP Tools Reference

Complete reference for all MCP server tools available when running scaffold-mcp as an MCP server (stdio, HTTP, or SSE mode).

## Table of Contents

- [Available Tools](#available-tools)
  - [list-boilerplates](#list-boilerplates)
  - [use-boilerplate](#use-boilerplate)
  - [list-scaffolding-methods](#list-scaffolding-methods)
  - [use-scaffold-method](#use-scaffold-method)
  - [write-to-file](#write-to-file)
- [Usage Examples](#usage-examples)
- [Tool Call Patterns](#tool-call-patterns)

---

## Available Tools

### list-boilerplates

List all available project boilerplate templates.

**Tool Name:** `list-boilerplates`

**Arguments:** None

**Returns:**
```json
{
  "boilerplates": [
    {
      "name": "nextjs-15-boilerplate",
      "description": "Next.js 15 application boilerplate with TypeScript and Tailwind CSS",
      "template_path": "nextjs-15",
      "variables_schema": {
        "type": "object",
        "properties": {
          "projectName": {
            "type": "string",
            "description": "Name of the project (used for directory name)"
          },
          "packageName": {
            "type": "string",
            "description": "NPM package name (e.g., @myorg/my-app)"
          },
          "appName": {
            "type": "string",
            "description": "Human-readable application name"
          }
        },
        "required": ["projectName", "packageName", "appName"]
      }
    }
  ]
}
```

**Use when:**
- User asks to see available templates
- User wants to create a new project but doesn't know which template to use
- Starting a scaffolding conversation

---

### use-boilerplate

Create a new project from a boilerplate template.

**Tool Name:** `use-boilerplate`

**Arguments:**
```typescript
{
  boilerplateName: string;    // Exact name from list-boilerplates
  variables: {                // Variables matching the boilerplate's schema
    projectName: string;
    packageName: string;
    appName: string;
    // ... other template-specific variables
    [key: string]: any;
  };
}
```

**Example:**
```json
{
  "boilerplateName": "nextjs-15-boilerplate",
  "variables": {
    "projectName": "my-app",
    "packageName": "@myorg/my-app",
    "appName": "My Awesome App",
    "description": "A Next.js application"
  }
}
```

**Returns:**
```json
{
  "success": true,
  "message": "Successfully scaffolded my-app in ./apps/my-app",
  "createdFiles": [
    "./apps/my-app/package.json",
    "./apps/my-app/project.json",
    "./apps/my-app/src/app/page.tsx",
    "./apps/my-app/tsconfig.json"
  ]
}
```

**What it does:**
1. Creates a new directory at `apps/<projectName>`
2. Copies all template files from the boilerplate
3. Processes files for variable replacement
4. Creates/updates `project.json` with `sourceTemplate` field
5. Returns list of created files

**Error cases:**
- Boilerplate not found: Returns error with list of available boilerplates
- Missing required variables: Returns error with schema
- Target directory already exists: Returns warning

---

### list-scaffolding-methods

List available scaffold methods (features) for an existing project.

**Tool Name:** `list-scaffolding-methods`

**Arguments:**
```typescript
{
  projectPath: string;  // Absolute path to the project directory
}
```

**Example:**
```json
{
  "projectPath": "/Users/me/workspace/apps/my-app"
}
```

**Returns:**
```json
{
  "scaffoldingMethods": [
    {
      "name": "scaffold-nextjs-page",
      "description": "Add new pages to Next.js applications using the App Router pattern",
      "instruction": "Detailed instructions on how to use the generated code...",
      "variables_schema": {
        "type": "object",
        "properties": {
          "appPath": {
            "type": "string",
            "description": "Absolute path to the app"
          },
          "pageTitle": {
            "type": "string",
            "description": "Title for the page"
          }
        },
        "required": ["appPath", "pageTitle"]
      },
      "generator": "nextjsPageGenerator.ts",
      "patterns": ["src/app/**/page.tsx"]
    }
  ]
}
```

**How it works:**
1. Reads `project.json` from the project directory
2. Extracts `sourceTemplate` field
3. Finds the template directory
4. Reads `scaffold.yaml` configuration
5. Returns all defined scaffold methods

**Error cases:**
- Project path doesn't exist
- No `project.json` found
- No `sourceTemplate` field in `project.json`
- Template not found
- No `scaffold.yaml` in template

---

### use-scaffold-method

Add a feature to an existing project using a scaffold method.

**Tool Name:** `use-scaffold-method`

**Arguments:**
```typescript
{
  projectPath: string;           // Absolute path to the project
  scaffold_feature_name: string; // Name of the scaffold method
  variables: {                   // Variables matching the method's schema
    [key: string]: any;
  };
}
```

**Example:**
```json
{
  "projectPath": "/Users/me/workspace/apps/my-app",
  "scaffold_feature_name": "scaffold-nextjs-page",
  "variables": {
    "appPath": "/Users/me/workspace/apps/my-app",
    "appName": "my-app",
    "pageTitle": "About Us",
    "pageDescription": "Learn more about our company",
    "nextjsPagePath": "/about",
    "withLayout": false
  }
}
```

**Returns:**
```json
{
  "success": true,
  "message": "Successfully scaffolded scaffold-nextjs-page in /Users/me/workspace/apps/my-app",
  "instruction": "Next.js page template using App Router structure...\n\nHow to use the scaffolded code:\n1. Access the page...",
  "createdFiles": [
    "/Users/me/workspace/apps/my-app/src/app/about/page.tsx"
  ],
  "existingFiles": [],
  "warnings": []
}
```

**What it does:**
1. Validates project has correct `sourceTemplate`
2. Finds the scaffold method configuration
3. If custom generator exists:
   - Loads generator from template's `generators/` folder
   - Executes generator with context
4. If no custom generator:
   - Processes include patterns
   - Copies and processes template files
5. Returns created files and instructions

**Error cases:**
- Project not found
- Scaffold method not found
- Missing required variables
- Generator execution error

---

### write-to-file

Write content to a file (utility tool).

**Tool Name:** `write-to-file`

**Arguments:**
```typescript
{
  file_path: string;  // Absolute or relative path to file
  content: string;    // Content to write
}
```

**Example:**
```json
{
  "file_path": "/Users/me/workspace/apps/my-app/src/utils/helpers.ts",
  "content": "export const helper = () => {\n  return 'Hello';\n};"
}
```

**Returns:**
```json
{
  "success": true,
  "message": "File written successfully"
}
```

**What it does:**
1. Creates parent directories if they don't exist
2. Writes content to the file
3. Overwrites if file exists

**Use when:**
- Need to create a custom file not covered by templates
- Need to update an existing file
- Need to create configuration files

---

## Usage Examples

### Example 1: Create a new Next.js project

```json
// Step 1: List available boilerplates
{
  "name": "list-boilerplates",
  "arguments": {}
}

// Step 2: Create project from boilerplate
{
  "name": "use-boilerplate",
  "arguments": {
    "boilerplateName": "nextjs-15-boilerplate",
    "variables": {
      "projectName": "my-app",
      "packageName": "@myorg/my-app",
      "appName": "My App"
    }
  }
}
```

### Example 2: Add features to existing project

```json
// Step 1: List available features
{
  "name": "list-scaffolding-methods",
  "arguments": {
    "projectPath": "/Users/me/workspace/apps/my-app"
  }
}

// Step 2: Add a new page
{
  "name": "use-scaffold-method",
  "arguments": {
    "projectPath": "/Users/me/workspace/apps/my-app",
    "scaffold_feature_name": "scaffold-nextjs-page",
    "variables": {
      "appPath": "/Users/me/workspace/apps/my-app",
      "appName": "my-app",
      "pageTitle": "About Us",
      "pageDescription": "Learn more about our company",
      "nextjsPagePath": "/about"
    }
  }
}
```

### Example 3: Create custom configuration file

```json
{
  "name": "write-to-file",
  "arguments": {
    "file_path": "/Users/me/workspace/apps/my-app/.env.local",
    "content": "NEXT_PUBLIC_API_URL=https://api.example.com\nNEXT_PUBLIC_APP_NAME=My App"
  }
}
```

---

## Tool Call Patterns

### Pattern 1: Discovery → Creation

When user wants to create a new project:

1. **List boilerplates** to show available options
2. **Use boilerplate** with user-provided variables
3. **List scaffolding methods** to show what features can be added
4. **Use scaffold method** to add initial features

### Pattern 2: Enhancement → Iteration

When user wants to add features to existing project:

1. **List scaffolding methods** for the project
2. **Use scaffold method** for each feature
3. Optionally **write-to-file** for custom modifications

### Pattern 3: Validation → Execution

For safe scaffolding:

1. **List scaffolding methods** to validate the method exists
2. Check the `variables_schema` to ensure all required variables are provided
3. **Use scaffold method** with validated variables

---

## Best Practices

### 1. Always validate before scaffolding

Before calling `use-boilerplate` or `use-scaffold-method`, call the corresponding list tool to:
- Verify the template/method exists
- Get the correct variable schema
- Show options to the user

### 2. Use absolute paths for projectPath

Always provide absolute paths for `projectPath` arguments to avoid ambiguity:

✅ Good:
```json
{
  "projectPath": "/Users/me/workspace/apps/my-app"
}
```

❌ Bad:
```json
{
  "projectPath": "./apps/my-app"
}
```

### 3. Handle errors gracefully

All tools return structured error messages. Present these to the user clearly:

```json
{
  "success": false,
  "message": "Template not found: invalid-template. Available templates: nextjs-15-boilerplate"
}
```

### 4. Provide context in instructions

After successful scaffolding, always show the `instruction` field to help users understand how to use the generated code.

### 5. Track created files

Use the `createdFiles` and `existingFiles` arrays to:
- Show what was created
- Avoid overwriting existing files
- Help users understand the scaffolding result
