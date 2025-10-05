import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { BoilerplateGeneratorService } from '../services/BoilerplateGeneratorService';
import type { ToolDefinition } from './types';

/**
 * Tool to generate template files for boilerplates and features
 */
export class GenerateBoilerplateFileTool {
  static readonly TOOL_NAME = 'generate-boilerplate-file';

  private boilerplateGeneratorService: BoilerplateGeneratorService;

  constructor(templatesPath: string) {
    this.boilerplateGeneratorService = new BoilerplateGeneratorService(templatesPath);
  }

  /**
   * Get the tool definition for MCP
   */
  getDefinition(): ToolDefinition {
    return {
      name: GenerateBoilerplateFileTool.TOOL_NAME,
      description: `Create or update template files for boilerplates or features in the specified template directory.

This tool:
- Creates template files with .liquid extension for variable substitution
- Supports creating nested directory structures
- Can create files from source files (copying and converting to templates)
- Validates that the template directory exists
- Works for both boilerplate includes and feature scaffold includes

Use this after generate-boilerplate or generate-feature-scaffold to create the actual template files referenced in the includes array.`,
      inputSchema: {
        type: 'object',
        properties: {
          templateName: {
            type: 'string',
            description: 'Name of the template folder (must already exist)',
          },
          filePath: {
            type: 'string',
            description:
              'Path of the file to create within the template (e.g., "package.json", "src/app/page.tsx")',
          },
          content: {
            type: 'string',
            description: `Content of the template file (use {{ variableName }} for Liquid placeholders).

IMPORTANT - Keep content minimal and business-agnostic:
- Focus on structure and patterns, not specific business logic
- Use placeholder data and generic examples
- Include only essential boilerplate code
- Demonstrate the pattern, not a complete implementation
- Let AI fill in business-specific logic later

Example (good - minimal):
export function {{ functionName }}() {
  // TODO: Implement logic
  return null;
}

Example (bad - too specific):
export function calculateTax(income: number) {
  const federalRate = 0.22;
  const stateRate = 0.05;
  return income * (federalRate + stateRate);
}`,
          },
          sourceFile: {
            type: 'string',
            description: 'Optional: Path to a source file to copy and convert to a template',
          },
          header: {
            type: 'string',
            description: `Optional: Header comment to add at the top of the file to provide AI hints about design patterns, coding standards, and best practices.

Example format for TypeScript/JavaScript files:
/**
 * {{ componentName }} Component
 *
 * DESIGN PATTERNS:
 * - Component pattern description
 * - Architecture decisions
 *
 * CODING STANDARDS:
 * - Naming conventions
 * - Required elements
 *
 * AVOID:
 * - Common pitfalls
 * - Anti-patterns
 */

The header helps AI understand and follow established patterns when working with generated code.`,
          },
        },
        required: ['templateName', 'filePath'],
        additionalProperties: false,
      },
    };
  }

  /**
   * Execute the tool
   */
  async execute(args: {
    templateName: string;
    filePath: string;
    content?: string;
    sourceFile?: string;
    header?: string;
  }): Promise<CallToolResult> {
    try {
      const result = await this.boilerplateGeneratorService.createTemplateFile(args);

      if (!result.success) {
        return {
          content: [
            {
              type: 'text',
              text: result.message,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: result.message,
                filePath: result.filePath,
                fullPath: result.fullPath,
                sourceFile: args.sourceFile || null,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating template file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
