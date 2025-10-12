import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FileSystemService } from '../services/FileSystemService';
import { ScaffoldingMethodsService } from '../services/ScaffoldingMethodsService';
import type { ToolDefinition } from './types';

export class ListScaffoldingMethodsTool {
  static readonly TOOL_NAME = 'list-scaffolding-methods';

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
      name: ListScaffoldingMethodsTool.TOOL_NAME,
      description: `Lists all available scaffolding methods (features) that can be added to an existing project.

This tool:
- Reads the project's sourceTemplate from project.json (monorepo) or toolkit.yaml (monolith)
- Returns available features for that template type
- Provides variable schemas for each scaffolding method
- Shows descriptions of what each method creates

Use this FIRST when adding features to existing projects to understand:
- What scaffolding methods are available
- What variables each method requires
- What files/features will be generated

Example methods might include:
- Adding new React routes (for React apps)
- Creating API endpoints (for backend projects)
- Adding new components (for frontend projects)
- Setting up database models (for API projects)`,
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description:
              'Absolute path to the project directory (for monorepo: containing project.json; for monolith: workspace root with toolkit.yaml)',
          },
        },
        required: ['projectPath'],
        additionalProperties: false,
      },
    };
  }

  /**
   * Execute the tool
   */
  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const { projectPath } = args as { projectPath: string };

      if (!projectPath) {
        throw new Error('Missing required parameter: projectPath');
      }

      const result = await this.scaffoldingMethodsService.listScaffoldingMethods(projectPath);

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
            text: `Error listing scaffolding methods: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
