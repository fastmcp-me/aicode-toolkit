import type { PromptDefinition, PromptMessage } from './types';

/**
 * Prompt for scaffolding a new application using boilerplate templates
 */
export class ScaffoldApplicationPrompt {
  static readonly PROMPT_NAME = 'scaffold-application';

  /**
   * Get the prompt definition for MCP
   */
  getDefinition(): PromptDefinition {
    return {
      name: ScaffoldApplicationPrompt.PROMPT_NAME,
      description: 'Scaffold a new application from a boilerplate template',
      arguments: [
        {
          name: 'request',
          description: 'Describe the application you want to create (optional)',
          required: false,
        },
      ],
    };
  }

  /**
   * Get the prompt messages
   */
  getMessages(args?: { request?: string }): PromptMessage[] {
    const userRequest = args?.request || '';

    return [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `You are helping create a new application using the scaffold-mcp MCP tools.

${userRequest ? `User request: ${userRequest}\n` : ''}
Your task is to scaffold a new application by following this workflow:

## Step 1: List Available Boilerplates
Use the \`list-boilerplates\` tool to see all available project templates.

**What to look for:**
- Boilerplate name (e.g., "scaffold-nextjs-app", "scaffold-vite-app")
- Description of what the boilerplate creates
- Target folder where projects will be created (e.g., "apps", "packages")
- Required and optional variables in the variables_schema

## Step 2: Gather Required Information
Based on the selected boilerplate's variables_schema, collect:
- **Project name**: Must be kebab-case (e.g., "my-new-app", not "MyNewApp")
- **Required variables**: All variables marked as required: true
- **Optional variables**: Variables with required: false (ask user if needed)

Common variables:
- \`appName\` or \`packageName\`: The project name (kebab-case)
- \`description\`: Brief description of what the project does
- \`author\`: Author name

## Step 3: Execute the Boilerplate
Use the \`use-boilerplate\` tool with:
- \`boilerplateName\`: Exact name from list-boilerplates response
- \`variables\`: Object matching the variables_schema exactly

**Example:**
\`\`\`json
{
  "boilerplateName": "scaffold-nextjs-app",
  "variables": {
    "appName": "my-dashboard",
    "description": "Admin dashboard for managing users",
    "author": "John Doe"
  }
}
\`\`\`

## Important Guidelines:
- **Always call \`list-boilerplates\` first** to see available options and their schemas
- **Use exact variable names** from the schema (case-sensitive)
- **Provide all required variables** - the tool will fail if any are missing
- **Use kebab-case for project names** (e.g., "user-dashboard", not "UserDashboard")
- The tool will create the project in the appropriate directory automatically
- After creation, inform the user where the project was created

## Step 4: Review and Add Features (If Needed)
After the boilerplate is created, **consider if additional features are needed**:
1. **READ** the generated project structure to understand what was created
2. **REVIEW** the user's request to see if they asked for specific features (e.g., "with tool for X", "with prompt for Y")
3. **If features are needed**:
   - Use \`list-scaffolding-methods\` with the new project path
   - Use \`use-scaffold-method\` to add tools, services, prompts, etc.
   - **IMPLEMENT** the actual logic in the scaffolded feature files
   - **REGISTER** the features in \`src/server/index.ts\`
4. **Install dependencies**: Remind user to run \`pnpm install\`
5. **Report** the complete setup including any features added

## Example Workflow:
1. Call \`list-boilerplates\` → See available templates
2. Ask user which template to use (or infer from request)
3. Collect required variables based on schema
4. Call \`use-boilerplate\` with boilerplateName and variables
5. **Review if user requested specific features (tools, prompts, etc.)**
6. **If features needed**: Add them using \`list-scaffolding-methods\` and \`use-scaffold-method\`
7. **READ and IMPLEMENT** the scaffolded feature files with actual logic
8. Report success and next steps to the user`,
        },
      },
    ];
  }
}
