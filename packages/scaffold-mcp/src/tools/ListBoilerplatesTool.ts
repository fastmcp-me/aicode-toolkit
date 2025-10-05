import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { BoilerplateService } from '../services/BoilerplateService';
import type { ListBoilerplateResponse } from '../types/boilerplateTypes';
import type { ToolDefinition } from './types';

export class ListBoilerplatesTool {
  static readonly TOOL_NAME = 'list-boilerplates';

  private boilerplateService: BoilerplateService;

  constructor(templatesPath: string) {
    this.boilerplateService = new BoilerplateService(templatesPath);
  }

  /**
   * Get the tool definition for MCP
   */
  getDefinition(): ToolDefinition {
    return {
      name: ListBoilerplatesTool.TOOL_NAME,
      description: `Lists all available project boilerplates for creating new applications, APIs, or packages in the monorepo.

Each boilerplate includes:
- Complete project template with starter files
- Variable schema for customization
- Target directory information
- Required and optional configuration options

Use this FIRST when creating new projects to understand available templates and their requirements.`,
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    };
  }

  /**
   * Execute the tool
   */
  async execute(_args: Record<string, any> = {}): Promise<CallToolResult> {
    try {
      const result: ListBoilerplateResponse = await this.boilerplateService.listBoilerplates();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing boilerplates: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
