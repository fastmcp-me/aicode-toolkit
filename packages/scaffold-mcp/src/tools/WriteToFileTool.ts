import path from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FileSystemService } from '../services/FileSystemService';
import type { ToolDefinition } from './types';

export class WriteToFileTool {
  static readonly TOOL_NAME = 'write-to-file';

  private fileSystemService: FileSystemService;

  constructor() {
    this.fileSystemService = new FileSystemService();
  }

  /**
   * Get the tool definition for MCP
   */
  getDefinition(): ToolDefinition {
    return {
      name: WriteToFileTool.TOOL_NAME,
      description: `Writes content to a file, creating the file and any necessary directories if they don't exist.

This tool will:
- Create the target file if it doesn't exist
- Create any necessary parent directories
- Write the provided content to the file
- Overwrite existing files with new content

Parameters:
- file_path: Absolute or relative path to the target file
- content: The content to write to the file`,
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description:
              'Path to the file to write (absolute or relative to current working directory)',
          },
          content: {
            type: 'string',
            description: 'Content to write to the file',
          },
        },
        required: ['file_path', 'content'],
        additionalProperties: false,
      },
    };
  }

  /**
   * Execute the tool
   */
  async execute(args: Record<string, any>): Promise<CallToolResult> {
    try {
      const { file_path, content } = args as { file_path: string; content: string };

      if (!file_path) {
        throw new Error('Missing required parameter: file_path');
      }

      if (content === undefined || content === null) {
        throw new Error('Missing required parameter: content');
      }

      // Resolve the file path (handle both absolute and relative paths)
      const resolvedPath = path.isAbsolute(file_path)
        ? file_path
        : path.resolve(process.cwd(), file_path);

      // Ensure the directory exists
      const dirPath = path.dirname(resolvedPath);
      await this.fileSystemService.ensureDir(dirPath);

      // Write the content to the file
      await this.fileSystemService.writeFile(resolvedPath, content);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully wrote content to file: ${resolvedPath}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error writing to file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
