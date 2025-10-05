import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { BoilerplateService } from '../services/BoilerplateService';
import type { UseBoilerplateRequest } from '../types/boilerplateTypes';
import type { ToolDefinition } from './types';

export class UseBoilerplateTool {
  static readonly TOOL_NAME = 'use-boilerplate';

  private boilerplateService: BoilerplateService;

  constructor(templatesPath: string) {
    this.boilerplateService = new BoilerplateService(templatesPath);
  }

  /**
   * Get the tool definition for MCP
   */
  getDefinition(): ToolDefinition {
    return {
      name: UseBoilerplateTool.TOOL_NAME,
      description: `Creates a new project from a boilerplate template with the specified variables.

This tool will:
- Generate all necessary files from the template
- Replace template variables with provided values
- Create the project in the appropriate monorepo directory
- Set up initial configuration files (package.json, tsconfig.json, etc.)

IMPORTANT:
- Always call \`list-boilerplates\` first to get the exact variable schema
- Follow the schema exactly - required fields must be provided
- Use kebab-case for project names (e.g., "my-new-app", not "MyNewApp")
- The tool will validate all variables against the schema before proceeding`,
      inputSchema: {
        type: 'object',
        properties: {
          boilerplateName: {
            type: 'string',
            description: 'Exact name of the boilerplate to use (from list-boilerplates response)',
          },
          variables: {
            type: 'object',
            description: "Variables object matching the boilerplate's variables_schema exactly",
          },
        },
        required: ['boilerplateName', 'variables'],
        additionalProperties: false,
      },
    };
  }

  /**
   * Execute the tool
   */
  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const { boilerplateName, variables } = args as {
        boilerplateName: string;
        variables: Record<string, any>;
      };

      // Validate required parameters
      if (!boilerplateName) {
        throw new Error('Missing required parameter: boilerplateName');
      }

      if (!variables) {
        throw new Error('Missing required parameter: variables');
      }

      // Create the request object
      const request: UseBoilerplateRequest = { boilerplateName, variables };

      // Execute the boilerplate service
      const result = await this.boilerplateService.useBoilerplate(request);

      return {
        content: [
          {
            type: 'text',
            text: result.message,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error using boilerplate: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
