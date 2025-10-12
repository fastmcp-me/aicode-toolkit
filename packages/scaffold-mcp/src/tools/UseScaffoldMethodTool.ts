import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FileSystemService } from '../services/FileSystemService';
import { ScaffoldingMethodsService } from '../services/ScaffoldingMethodsService';
import type { ToolDefinition } from './types';

export class UseScaffoldMethodTool {
  static readonly TOOL_NAME = 'use-scaffold-method';

  private fileSystemService: FileSystemService;
  private scaffoldingMethodsService: ScaffoldingMethodsService;

  constructor(templatesPath: string) {
    this.fileSystemService = new FileSystemService();
    this.scaffoldingMethodsService = new ScaffoldingMethodsService(
      this.fileSystemService,
      templatesPath,
    );
  }

  /**
   * Get the tool definition for MCP
   */
  getDefinition(): ToolDefinition {
    return {
      name: UseScaffoldMethodTool.TOOL_NAME,
      description: `Generates and adds a specific feature to an existing project using a scaffolding method.

This tool will:
- Generate files based on the selected scaffolding method
- Replace template variables with provided values
- Add files to the appropriate locations in the project
- Follow the project's existing patterns and conventions
- Update imports and exports as needed

IMPORTANT:
- Always call \`list-scaffolding-methods\` first to see available methods and their schemas
- Use the exact scaffold method name from the list response
- Provide variables that match the method's variables_schema exactly
- The tool validates all inputs before generating code
`,
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description:
              'Absolute path to the project directory (for monorepo: containing project.json; for monolith: workspace root with toolkit.yaml)',
          },
          scaffold_feature_name: {
            type: 'string',
            description:
              'Exact name of the scaffold method to use (from list-scaffolding-methods response)',
          },
          variables: {
            type: 'object',
            description: "Variables object matching the scaffold method's variables_schema exactly",
          },
        },
        required: ['projectPath', 'scaffold_feature_name', 'variables'],
        additionalProperties: false,
      },
    };
  }

  /**
   * Execute the tool
   */
  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const { projectPath, scaffold_feature_name, variables } = args as {
        projectPath: string;
        scaffold_feature_name: string;
        variables: Record<string, any>;
      };

      if (!projectPath) {
        throw new Error('Missing required parameter: projectPath');
      }

      if (!scaffold_feature_name) {
        throw new Error('Missing required parameter: scaffold_feature_name');
      }

      if (!variables) {
        throw new Error('Missing required parameter: variables');
      }

      const result = await this.scaffoldingMethodsService.useScaffoldMethod({
        projectPath,
        scaffold_feature_name,
        variables,
      });

      // Append instructions for LLM to review and implement the scaffolded files
      const enhancedMessage = `${result.message}

IMPORTANT - Next Steps:
1. READ the generated files to understand their structure and template placeholders
2. IMPLEMENT the actual business logic according to the feature's purpose (replace TODOs and template variables)
3. REGISTER the feature in the appropriate files (e.g., import and register tools in server/index.ts, export from index.ts)
4. TEST the implementation to ensure it works correctly
5. Only after completing the implementation should you move to other tasks

Do not skip the implementation step - the scaffolded files contain templates that need actual code.`;

      return {
        content: [
          {
            type: 'text',
            text: enhancedMessage,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error using scaffold method: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
