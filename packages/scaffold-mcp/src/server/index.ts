import { TemplatesManagerService } from '@agiflowai/aicode-utils';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  GenerateBoilerplatePrompt,
  GenerateFeatureScaffoldPrompt,
  ScaffoldApplicationPrompt,
  ScaffoldFeaturePrompt,
} from '../prompts';
import {
  GenerateBoilerplateFileTool,
  GenerateBoilerplateTool,
  GenerateFeatureScaffoldTool,
  ListBoilerplatesTool,
  ListScaffoldingMethodsTool,
  UseBoilerplateTool,
  UseScaffoldMethodTool,
  WriteToFileTool,
} from '../tools';

export interface ServerOptions {
  adminEnabled?: boolean;
}

export function createServer(options: ServerOptions = {}) {
  const { adminEnabled = false } = options;

  // Find templates folder by searching upwards from current directory
  const templatesPath = TemplatesManagerService.findTemplatesPathSync();

  // Initialize tools
  const listBoilerplatesTool = new ListBoilerplatesTool(templatesPath);
  const useBoilerplateTool = new UseBoilerplateTool(templatesPath);
  const listScaffoldingMethodsTool = new ListScaffoldingMethodsTool(templatesPath);
  const useScaffoldMethodTool = new UseScaffoldMethodTool(templatesPath);
  const writeToFileTool = new WriteToFileTool();
  const generateBoilerplateTool = adminEnabled ? new GenerateBoilerplateTool(templatesPath) : null;
  const generateBoilerplateFileTool = adminEnabled
    ? new GenerateBoilerplateFileTool(templatesPath)
    : null;
  const generateFeatureScaffoldTool = adminEnabled
    ? new GenerateFeatureScaffoldTool(templatesPath)
    : null;

  // Initialize prompts (admin only)
  const generateBoilerplatePrompt = adminEnabled ? new GenerateBoilerplatePrompt() : null;
  const generateFeatureScaffoldPrompt = adminEnabled ? new GenerateFeatureScaffoldPrompt() : null;

  // Initialize user-facing prompts (always available)
  const scaffoldApplicationPrompt = new ScaffoldApplicationPrompt();
  const scaffoldFeaturePrompt = new ScaffoldFeaturePrompt();

  // Build instructions based on admin mode
  const baseInstructions = `Use this MCP server to create new project and adding a new feature (pages, component, services, etc...).

## Workflow:

1. **Creating New Project**: Use \`list-boilerplates\` → \`use-boilerplate\`
2. **Adding Features**: Use \`list-scaffolding-methods\` → \`use-scaffold-method\`

## AI Usage Guidelines:

- Always call \`list-boilerplates\` first when creating new projects to see available options
- Always call \`list-scaffolding-methods\` first when adding features to understand what's available
- Follow the exact variable schema provided - validation will fail if required fields are missing
- Use kebab-case for project names (e.g., "my-new-app")
- The tools automatically handle file placement, imports, and code generation
- Check the returned JSON schemas to understand required vs optional variables`;

  const adminInstructions = adminEnabled
    ? `

## Admin Mode (Template Generation):

When creating custom boilerplate templates for frameworks not yet supported:

1. **Create Boilerplate Configuration**: Use \`generate-boilerplate\` to add a new boilerplate entry to a template's scaffold.yaml
   - Specify template name, boilerplate name, description, target folder, and variable schema
   - This creates the scaffold.yaml structure following the nextjs-15 pattern
   - Optional: Add detailed instruction about file purposes and design patterns

2. **Create Feature Configuration**: Use \`generate-feature-scaffold\` to add a new feature entry to a template's scaffold.yaml
   - Specify template name, feature name, generator, description, and variable schema
   - This creates the scaffold.yaml structure for feature scaffolds (pages, components, etc.)
   - Optional: Add detailed instruction about file purposes and design patterns
   - Optional: Specify patterns to match existing files this feature works with

3. **Create Template Files**: Use \`generate-boilerplate-file\` to create the actual template files
   - Create files referenced in the boilerplate's or feature's includes array
   - Use {{ variableName }} syntax for Liquid variable placeholders
   - Can copy from existing source files or provide content directly
   - Files automatically get .liquid extension

4. **Test the Template**: Use \`list-boilerplates\`/\`list-scaffolding-methods\` and \`use-boilerplate\`/\`use-scaffold-method\` to verify your template works

Example workflow for boilerplate:
\`\`\`
1. generate-boilerplate { templateName: "react-vite", boilerplateName: "scaffold-vite-app", ... }
2. generate-boilerplate-file { templateName: "react-vite", filePath: "package.json", content: "..." }
3. generate-boilerplate-file { templateName: "react-vite", filePath: "src/App.tsx", content: "..." }
4. list-boilerplates (verify it appears)
5. use-boilerplate { boilerplateName: "scaffold-vite-app", variables: {...} }
\`\`\`

Example workflow for feature:
\`\`\`
1. generate-feature-scaffold { templateName: "nextjs-15", featureName: "scaffold-nextjs-component", generator: "componentGenerator.ts", ... }
2. generate-boilerplate-file { templateName: "nextjs-15", filePath: "src/components/Component.tsx", content: "..." }
3. list-scaffolding-methods (verify it appears)
4. use-scaffold-method { scaffoldName: "scaffold-nextjs-component", variables: {...} }
\`\`\``
    : '';

  const instructions = baseInstructions + adminInstructions;

  const server = new Server(
    {
      name: 'scaffold-mcp',
      version: '1.0.0',
    },
    {
      instructions,
      capabilities: {
        tools: {},
        prompts: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Get tool definitions
    const listBoilerplateTool = listBoilerplatesTool.getDefinition();
    const useBoilerplateToolDef = useBoilerplateTool.getDefinition();
    const listScaffoldingMethodsToolDef = listScaffoldingMethodsTool.getDefinition();
    const useScaffoldMethodToolDef = useScaffoldMethodTool.getDefinition();
    const writeToFileToolDef = writeToFileTool.getDefinition();

    const tools = [
      listBoilerplateTool,
      useBoilerplateToolDef,
      listScaffoldingMethodsToolDef,
      useScaffoldMethodToolDef,
      writeToFileToolDef,
    ];

    // Add admin tools if enabled
    if (adminEnabled) {
      if (generateBoilerplateTool) {
        tools.push(generateBoilerplateTool.getDefinition());
      }
      if (generateBoilerplateFileTool) {
        tools.push(generateBoilerplateFileTool.getDefinition());
      }
      if (generateFeatureScaffoldTool) {
        tools.push(generateFeatureScaffoldTool.getDefinition());
      }
    }

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === ListBoilerplatesTool.TOOL_NAME) {
      return await listBoilerplatesTool.execute(args || {});
    }

    if (name === UseBoilerplateTool.TOOL_NAME) {
      return await useBoilerplateTool.execute(args || {});
    }

    if (name === ListScaffoldingMethodsTool.TOOL_NAME) {
      return await listScaffoldingMethodsTool.execute(args || {});
    }

    if (name === UseScaffoldMethodTool.TOOL_NAME) {
      return await useScaffoldMethodTool.execute(args || {});
    }

    if (name === WriteToFileTool.TOOL_NAME) {
      return await writeToFileTool.execute(args || {});
    }

    if (name === GenerateBoilerplateTool.TOOL_NAME) {
      if (!adminEnabled || !generateBoilerplateTool) {
        throw new Error('Admin tools are not enabled. Use --admin-enable flag to enable.');
      }
      return await generateBoilerplateTool.execute(args as any);
    }

    if (name === GenerateBoilerplateFileTool.TOOL_NAME) {
      if (!adminEnabled || !generateBoilerplateFileTool) {
        throw new Error('Admin tools are not enabled. Use --admin-enable flag to enable.');
      }
      return await generateBoilerplateFileTool.execute(args as any);
    }

    if (name === GenerateFeatureScaffoldTool.TOOL_NAME) {
      if (!adminEnabled || !generateFeatureScaffoldTool) {
        throw new Error('Admin tools are not enabled. Use --admin-enable flag to enable.');
      }
      return await generateFeatureScaffoldTool.execute(args as any);
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  // Prompt handlers
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    const prompts = [];

    // User-facing prompts (always available)
    prompts.push(scaffoldApplicationPrompt.getDefinition());
    prompts.push(scaffoldFeaturePrompt.getDefinition());

    // Admin prompts (only in admin mode)
    if (adminEnabled) {
      if (generateBoilerplatePrompt) {
        prompts.push(generateBoilerplatePrompt.getDefinition());
      }

      if (generateFeatureScaffoldPrompt) {
        prompts.push(generateFeatureScaffoldPrompt.getDefinition());
      }
    }

    return { prompts };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // User-facing prompts (always available)
    if (name === ScaffoldApplicationPrompt.PROMPT_NAME) {
      return {
        messages: scaffoldApplicationPrompt.getMessages(args as any),
      };
    }

    if (name === ScaffoldFeaturePrompt.PROMPT_NAME) {
      return {
        messages: scaffoldFeaturePrompt.getMessages(args as any),
      };
    }

    // Admin prompts (only in admin mode)
    if (name === GenerateBoilerplatePrompt.PROMPT_NAME) {
      if (!generateBoilerplatePrompt) {
        throw new Error('Prompt not available');
      }
      return {
        messages: generateBoilerplatePrompt.getMessages(args as any),
      };
    }

    if (name === GenerateFeatureScaffoldPrompt.PROMPT_NAME) {
      if (!generateFeatureScaffoldPrompt) {
        throw new Error('Prompt not available');
      }
      return {
        messages: generateFeatureScaffoldPrompt.getMessages(args as any),
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });

  return server;
}
