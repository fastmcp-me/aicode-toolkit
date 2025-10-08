/**
 * GetFileDesignPatternTool
 *
 * DESIGN PATTERNS:
 * - Tool pattern with getDefinition() and execute() methods
 * - Service delegation for business logic
 * - JSON Schema validation for inputs
 *
 * CODING STANDARDS:
 * - Implement Tool interface from ../types
 * - Use TOOL_NAME constant with snake_case (e.g., 'file_read')
 * - Return CallToolResult with content array
 * - Handle errors with isError flag
 * - Delegate complex logic to services
 *
 * AVOID:
 * - Complex business logic in execute method
 * - Unhandled promise rejections
 * - Missing input validation
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Tool, ToolDefinition, FileDesignPatternResult } from '../types/index.js';
import { TemplateFinder } from '../services/TemplateFinder.js';
import { ArchitectParser } from '../services/ArchitectParser.js';
import { PatternMatcher } from '../services/PatternMatcher.js';
import * as path from 'path';

interface GetFileDesignPatternToolInput {
  file_path: string;
}

export class GetFileDesignPatternTool implements Tool<GetFileDesignPatternToolInput> {
  static readonly TOOL_NAME = 'get-file-design-pattern';

  private templateFinder: TemplateFinder;
  private architectParser: ArchitectParser;
  private patternMatcher: PatternMatcher;

  constructor() {
    this.templateFinder = new TemplateFinder();
    this.architectParser = new ArchitectParser();
    this.patternMatcher = new PatternMatcher();
  }

  getDefinition(): ToolDefinition {
    return {
      name: GetFileDesignPatternTool.TOOL_NAME,
      description: 'Review a file against template-specific and global design patterns with detailed guidance',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The file path to check for design patterns (absolute or relative to workspace)',
          },
        },
        required: ['file_path'],
        additionalProperties: false,
      },
    };
  }

  async execute(input: GetFileDesignPatternToolInput): Promise<CallToolResult> {
    try {
      // Find the template for this file
      const templateMapping = await this.templateFinder.findTemplateForFile(input.file_path);

      // Parse architect.yaml files
      const templateConfig = templateMapping
        ? await this.architectParser.parseArchitectFile(templateMapping.templatePath)
        : null;

      const globalConfig = await this.architectParser.parseGlobalArchitectFile();

      // Match patterns
      const result = this.patternMatcher.matchFileToPatterns(
        input.file_path,
        templateConfig,
        globalConfig,
        templateMapping?.projectPath,
      );

      // Add additional metadata
      const enrichedResult: FileDesignPatternResult = {
        ...result,
        project_name: templateMapping?.projectName,
        source_template: templateMapping?.sourceTemplate,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(enrichedResult, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : 'Unknown error',
                file_path: input.file_path,
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
  }
}
