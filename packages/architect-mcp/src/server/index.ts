/**
 * MCP Server Setup
 *
 * DESIGN PATTERNS:
 * - Factory pattern for server creation
 * - Tool registration pattern
 *
 * CODING STANDARDS:
 * - Register all tools, resources, and prompts here
 * - Keep server setup modular and extensible
 * - Import tools from ../tools/ and register them in the handlers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GetFileDesignPatternTool } from '../tools/GetFileDesignPatternTool';
import { ReviewCodeChangeTool } from '../tools/ReviewCodeChangeTool';
import { AddDesignPatternTool } from '../tools/AddDesignPatternTool';

export function createServer(): Server {
  const server = new Server(
    {
      name: 'architect-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize tools
  const getFileDesignPatternTool = new GetFileDesignPatternTool();
  const reviewCodeChangeTool = new ReviewCodeChangeTool();
  const addDesignPatternTool = new AddDesignPatternTool();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      getFileDesignPatternTool.getDefinition(),
      reviewCodeChangeTool.getDefinition(),
      addDesignPatternTool.getDefinition(),
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === GetFileDesignPatternTool.TOOL_NAME) {
      return await getFileDesignPatternTool.execute(args as any);
    }

    if (name === ReviewCodeChangeTool.TOOL_NAME) {
      return await reviewCodeChangeTool.execute(args as any);
    }

    if (name === AddDesignPatternTool.TOOL_NAME) {
      return await addDesignPatternTool.execute(args as any);
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return server;
}
