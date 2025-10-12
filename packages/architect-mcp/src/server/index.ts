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
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GetFileDesignPatternTool } from '../tools/GetFileDesignPatternTool';
import { ReviewCodeChangeTool } from '../tools/ReviewCodeChangeTool';
import { AddDesignPatternTool } from '../tools/AddDesignPatternTool';
import { AddRuleTool } from '../tools/AddRuleTool';

export function createServer(options?: {
  designPatternTool?: 'claude-code';
  reviewTool?: 'claude-code';
  adminEnabled?: boolean;
}): Server {
  const server = new Server(
    {
      name: 'architect-mcp',
      version: '0.4.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Initialize core tools with optional LLM support
  const getFileDesignPatternTool = new GetFileDesignPatternTool({
    llmTool: options?.designPatternTool,
  });
  const reviewCodeChangeTool = new ReviewCodeChangeTool({ llmTool: options?.reviewTool });

  // Initialize admin tools if enabled
  const adminEnabled = options?.adminEnabled ?? false;
  const addDesignPatternTool = adminEnabled ? new AddDesignPatternTool() : null;
  const addRuleTool = adminEnabled ? new AddRuleTool() : null;

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [getFileDesignPatternTool.getDefinition(), reviewCodeChangeTool.getDefinition()];

    // Add admin tools if enabled
    if (adminEnabled && addDesignPatternTool && addRuleTool) {
      tools.push(addDesignPatternTool.getDefinition());
      tools.push(addRuleTool.getDefinition());
    }

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === GetFileDesignPatternTool.TOOL_NAME) {
      return await getFileDesignPatternTool.execute(args as any);
    }

    if (name === ReviewCodeChangeTool.TOOL_NAME) {
      return await reviewCodeChangeTool.execute(args as any);
    }

    // Admin tools
    if (adminEnabled) {
      if (name === AddDesignPatternTool.TOOL_NAME && addDesignPatternTool) {
        return await addDesignPatternTool.execute(args as any);
      }

      if (name === AddRuleTool.TOOL_NAME && addRuleTool) {
        return await addRuleTool.execute(args as any);
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return server;
}
