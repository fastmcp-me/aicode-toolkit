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

import {
  CLAUDE_CODE,
  CODEX,
  GEMINI_CLI,
  NONE,
  ClaudeCodeService,
  CodexService,
  GeminiCliService,
  type CodingAgentId,
} from '@agiflowai/coding-agent-bridge';
import { print } from '@agiflowai/aicode-utils';

// Re-export the type for convenience
export type CodingAgent = CodingAgentId;

export class CodingAgentService {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Detect which coding agent is enabled in the workspace
   * Checks for Claude Code, Codex, and Gemini CLI installations
   * @param workspaceRoot - The workspace root directory
   * @returns Promise resolving to detected agent ID or null
   */
  static async detectCodingAgent(workspaceRoot: string): Promise<CodingAgent | null> {
    // Check for Claude Code
    const claudeCodeService = new ClaudeCodeService({ workspaceRoot });
    const isClaudeCodeEnabled = await claudeCodeService.isEnabled();

    if (isClaudeCodeEnabled) {
      return CLAUDE_CODE;
    }

    // Check for Codex
    const codexService = new CodexService({ workspaceRoot });
    const isCodexEnabled = await codexService.isEnabled();

    if (isCodexEnabled) {
      return CODEX;
    }

    // Check for Gemini CLI
    const geminiService = new GeminiCliService({ workspaceRoot });
    const isGeminiEnabled = await geminiService.isEnabled();

    if (isGeminiEnabled) {
      return GEMINI_CLI;
    }

    return null;
  }

  /**
   * Get available coding agents with their descriptions
   */
  static getAvailableAgents(): Array<{ value: CodingAgent; name: string; description: string }> {
    return [
      {
        value: CLAUDE_CODE,
        name: 'Claude Code',
        description: 'Anthropic Claude Code CLI agent',
      },
      {
        value: CODEX,
        name: 'Codex',
        description: 'OpenAI Codex CLI agent',
      },
      {
        value: GEMINI_CLI,
        name: 'Gemini CLI',
        description: 'Google Gemini CLI agent',
      },
      {
        value: NONE,
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
    if (agent === NONE) {
      print.info('Skipping MCP configuration');
      return;
    }

    print.info(`\nSetting up MCP for ${agent}...`);

    // Initialize the appropriate service based on agent type
    let service: ClaudeCodeService | CodexService | GeminiCliService | null = null;
    let configLocation = '';
    let restartInstructions = '';

    if (agent === CLAUDE_CODE) {
      service = new ClaudeCodeService({ workspaceRoot: this.workspaceRoot });
      configLocation = '.mcp.json';
      restartInstructions = 'Restart Claude Code to load the new MCP servers';
    } else if (agent === CODEX) {
      service = new CodexService({ workspaceRoot: this.workspaceRoot });
      configLocation = '~/.codex/config.toml';
      restartInstructions = 'Restart Codex CLI to load the new MCP servers';
    } else if (agent === GEMINI_CLI) {
      service = new GeminiCliService({ workspaceRoot: this.workspaceRoot });
      configLocation = '~/.gemini/settings.json';
      restartInstructions = 'Restart Gemini CLI to load the new MCP servers';
    }

    if (!service) {
      print.info(`MCP configuration for ${agent} is not yet supported.`);
      print.info('Please configure MCP servers manually for this coding agent.');
      return;
    }

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

    // Update MCP settings using the service (each service handles its own format conversion)
    await service.updateMcpSettings({
      servers: mcpServers,
    });

    print.success(`Added scaffold-mcp and architect-mcp to ${configLocation}`);
    print.info('\nNext steps:');
    print.indent(`1. ${restartInstructions}`);
    print.indent('2. The scaffold-mcp and architect-mcp servers will be available');

    print.success('\nMCP configuration completed!');
  }
}
