/**
 * CodingAgentService
 *
 * DESIGN PATTERNS:
 * - Service pattern for business logic encapsulation
 * - Strategy pattern for different agent configurations
 * - Single responsibility: Handle MCP setup for coding agents
 *
 * CODING STANDARDS:
 * - Use async/await for asynchronous operations
 * - Throw descriptive errors for error cases
 * - Document methods with JSDoc comments
 *
 * AVOID:
 * - Direct UI interaction (no prompts in services)
 * - Hard-coding agent configurations (use strategies)
 */

import path from 'node:path';
import { ClaudeCodeService } from '@agiflowai/coding-agent-bridge';
import { print } from '@agiflowai/aicode-utils';

export enum CodingAgent {
  CLAUDE_CODE = 'claude-code',
  CURSOR = 'cursor',
  GEMINI_CLI = 'gemini-cli',
  CLINE = 'cline',
  NONE = 'none',
}

export class CodingAgentService {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Detect if Claude Code is enabled in the workspace
   * Uses ClaudeCodeService to check for .claude folder or CLAUDE.md file
   * @param workspaceRoot - The workspace root directory
   * @returns Promise resolving to CodingAgent.CLAUDE_CODE if detected, null otherwise
   */
  static async detectCodingAgent(workspaceRoot: string): Promise<CodingAgent | null> {
    const claudeCodeService = new ClaudeCodeService({ workspaceRoot });
    const isClaudeCodeEnabled = await claudeCodeService.isEnabled();

    if (isClaudeCodeEnabled) {
      return CodingAgent.CLAUDE_CODE;
    }

    return null;
  }

  /**
   * Get available coding agents with their descriptions
   */
  static getAvailableAgents(): Array<{ value: CodingAgent; name: string; description: string }> {
    return [
      {
        value: CodingAgent.CLAUDE_CODE,
        name: 'Claude Code',
        description: 'Anthropic Claude Code CLI agent',
      },
      {
        value: CodingAgent.NONE,
        name: 'Other',
        description: 'Other coding agent or skip MCP configuration',
      },
    ];
  }

  /**
   * Setup MCP configuration for the selected coding agent
   * @param agent - The coding agent to configure
   */
  async setupMCP(agent: CodingAgent): Promise<void> {
    if (agent === CodingAgent.NONE) {
      print.info('Skipping MCP configuration');
      return;
    }

    print.info(`\nSetting up MCP for ${agent}...`);

    if (agent === CodingAgent.CLAUDE_CODE) {
      await this.setupClaudeCodeMCP();
    } else {
      print.info(`MCP configuration for ${agent} is not yet supported.`);
      print.info('Please configure MCP servers manually for this coding agent.');
    }

    print.success('\nMCP configuration completed!');
  }

  /**
   * Setup MCP configuration for Claude Code
   * Passes standardized MCP config to ClaudeCodeService
   */
  private async setupClaudeCodeMCP(): Promise<void> {
    const claudeCodeService = new ClaudeCodeService({ workspaceRoot: this.workspaceRoot });

    // Build standardized MCP server configurations
    const mcpServers = {
      'scaffold-mcp': {
        type: 'stdio' as const,
        command: 'npx',
        args: ['-y', '@agiflowai/scaffold-mcp', 'mcp-serve'],
        disabled: false,
      },
      'architect-mcp': {
        type: 'stdio' as const,
        command: 'npx',
        args: ['-y', '@agiflowai/architect-mcp', 'mcp-serve'],
        disabled: false,
      },
    };

    // Update MCP settings using ClaudeCodeService (it handles format conversion)
    await claudeCodeService.updateMcpSettings({
      servers: mcpServers,
    });

    print.success('Added scaffold-mcp and architect-mcp to .mcp.json');
    print.info('\nNext steps:');
    print.indent('1. Restart Claude Code to load the new MCP servers');
    print.indent('2. The scaffold-mcp and architect-mcp servers will be available');
  }
}
