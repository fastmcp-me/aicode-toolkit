import type { PromptDefinition, PromptMessage } from './types';

/**
 * Prompt for scaffolding a new feature in an existing project
 */
export class ScaffoldFeaturePrompt {
  static readonly PROMPT_NAME = 'scaffold-feature';

  /**
   * Get the prompt definition for MCP
   */
  getDefinition(): PromptDefinition {
    return {
      name: ScaffoldFeaturePrompt.PROMPT_NAME,
      description: 'Scaffold a new feature (page, component, service, etc.) in an existing project',
      arguments: [
        {
          name: 'request',
          description: 'Describe the feature you want to add (optional)',
          required: false,
        },
        {
          name: 'projectPath',
          description: 'Path to the project (e.g., "apps/my-app") - optional if can be inferred',
          required: false,
        },
      ],
    };
  }

  /**
   * Get the prompt messages
   */
  getMessages(args?: { request?: string; projectPath?: string }): PromptMessage[] {
    const userRequest = args?.request || '';
    const projectPath = args?.projectPath || '';

    return [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `You are helping add a new feature to an existing project using the scaffold-mcp MCP tools.

${userRequest ? `User request: ${userRequest}\n` : ''}${projectPath ? `Project path: ${projectPath}\n` : ''}
Your task is to scaffold a new feature by following this workflow:

## Step 1: Identify the Project
Determine the project path where the feature will be added:
- If projectPath is provided, use it
- Otherwise, ask the user or infer from context (e.g., "apps/my-app", "packages/my-lib")
- The path should point to a directory containing a \`project.json\` file

## Step 2: List Available Scaffolding Methods
Use the \`list-scaffolding-methods\` tool with the projectPath.

**What to look for:**
- Feature name (e.g., "scaffold-nextjs-page", "scaffold-react-component")
- Description of what files/code it generates
- Required and optional variables in the variables_schema
- The template type (derived from project's sourceTemplate)

**Example:**
\`\`\`json
{
  "projectPath": "apps/my-dashboard"
}
\`\`\`

## Step 3: Gather Required Information
Based on the selected scaffolding method's variables_schema, collect:
- **Feature-specific variables**: Name, path, type, etc.
- **Required variables**: All variables marked as required: true
- **Optional variables**: Variables with required: false (ask user if needed)

Common variables:
- \`componentName\` / \`pageName\` / \`serviceName\`: Name in PascalCase
- \`componentPath\` / \`pagePath\`: Where to place the file (may use kebab-case)
- Boolean flags: \`withTests\`, \`withLayout\`, \`withStyles\`, etc.

## Step 4: Execute the Scaffolding Method
Use the \`use-scaffold-method\` tool with:
- \`projectPath\`: Same path from step 1
- \`scaffold_feature_name\`: Exact name from list-scaffolding-methods response
- \`variables\`: Object matching the variables_schema exactly

**Example:**
\`\`\`json
{
  "projectPath": "apps/my-dashboard",
  "scaffold_feature_name": "scaffold-nextjs-page",
  "variables": {
    "pageName": "UserProfile",
    "pagePath": "user/profile",
    "withLayout": true,
    "withTests": false
  }
}
\`\`\`

## Important Guidelines:
- **Always call \`list-scaffolding-methods\` first** with the projectPath
- **Use exact variable names** from the schema (case-sensitive)
- **Provide all required variables** - the tool will fail if any are missing
- **Follow naming conventions**:
  - Component/Page/Service names: PascalCase (e.g., "UserProfile")
  - File paths: kebab-case or as specified in schema (e.g., "user/profile")
- **Conditional files**: Files with \`?condition=true\` are only included when the variable is true
- The tool will create files in the appropriate locations automatically
- After creation, inform the user what files were created

## Example Workflow:
1. Identify project path (provided or ask user)
2. Call \`list-scaffolding-methods\` → See available features for this project
3. Ask user which feature to add (or infer from request)
4. Collect required variables based on schema
5. Call \`use-scaffold-method\` with projectPath, scaffold_feature_name, and variables
6. Report success and list created files`,
        },
      },
    ];
  }
}
