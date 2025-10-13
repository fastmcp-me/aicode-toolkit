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

import os from 'node:os';
import path from 'node:path';
import { icons, print } from '@agiflowai/aicode-utils';
import * as fs from 'fs-extra';

export enum CodingAgent {
  CLAUDE_CODE = 'claude-code',
  CURSOR = 'cursor',
  GEMINI_CLI = 'gemini-cli',
  CLINE = 'cline',
  NONE = 'none',
}

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface AgentConfig {
  name: string;
  configPath: string;
  mcpConfigKey: string;
}

export class CodingAgentService {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
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
        value: CodingAgent.CURSOR,
        name: 'Cursor',
        description: 'Cursor IDE with AI capabilities',
      },
      {
        value: CodingAgent.GEMINI_CLI,
        name: 'Gemini CLI',
        description: 'Google Gemini CLI agent',
      },
      {
        value: CodingAgent.CLINE,
        name: 'Cline (formerly Claude Dev)',
        description: 'VSCode extension for AI coding',
      },
      {
        value: CodingAgent.NONE,
        name: 'Skip',
        description: 'Skip MCP configuration for now',
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

    try {
      const agentConfig = this.getAgentConfig(agent);
      const configPath = this.resolveConfigPath(agentConfig.configPath);

      // Ensure config directory exists
      await fs.ensureDir(path.dirname(configPath));

      // Read or create config
      let config: any = {};
      if (await fs.pathExists(configPath)) {
        const content = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(content);
        print.info(`Found existing config at ${configPath}`);
      } else {
        print.info(`Creating new config at ${configPath}`);
      }

      // Add MCP servers configuration
      if (!config[agentConfig.mcpConfigKey]) {
        config[agentConfig.mcpConfigKey] = {};
      }

      // Add our MCP servers
      const servers = this.getMCPServers();

      for (const [serverName, serverConfig] of Object.entries(servers)) {
        if (!config[agentConfig.mcpConfigKey][serverName]) {
          config[agentConfig.mcpConfigKey][serverName] = serverConfig;
          print.success(`Added ${serverName} MCP server`);
        } else {
          print.info(`${serverName} already configured`);
        }
      }

      // Write config back
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      print.success(`\nMCP configuration completed for ${agent}!`);

      // Show next steps
      this.showNextSteps(agent);
    } catch (error) {
      throw new Error(`Failed to setup MCP for ${agent}: ${(error as Error).message}`);
    }
  }

  /**
   * Get agent-specific configuration
   */
  private getAgentConfig(agent: CodingAgent): AgentConfig {
    const homeDir = os.homedir();

    switch (agent) {
      case CodingAgent.CLAUDE_CODE:
        return {
          name: 'Claude Code',
          configPath: path.join(
            homeDir,
            'Library',
            'Application Support',
            'Claude',
            'claude_desktop_config.json',
          ),
          mcpConfigKey: 'mcpServers',
        };

      case CodingAgent.CURSOR:
        return {
          name: 'Cursor',
          configPath: path.join(homeDir, '.cursor', 'mcp.json'),
          mcpConfigKey: 'mcpServers',
        };

      case CodingAgent.GEMINI_CLI:
        return {
          name: 'Gemini CLI',
          configPath: path.join(homeDir, '.config', 'gemini-cli', 'config.json'),
          mcpConfigKey: 'mcpServers',
        };

      case CodingAgent.CLINE:
        return {
          name: 'Cline',
          configPath: path.join(homeDir, '.vscode', 'extensions', 'cline', 'mcp-settings.json'),
          mcpConfigKey: 'mcpServers',
        };

      default:
        throw new Error(`Unknown coding agent: ${agent}`);
    }
  }

  /**
   * Resolve config path (handle cross-platform)
   */
  private resolveConfigPath(configPath: string): string {
    const platform = os.platform();

    // Adjust for platform differences
    if (platform === 'win32') {
      // Windows uses AppData instead of Library
      return configPath.replace('Library/Application Support', 'AppData/Roaming');
    }

    if (platform === 'linux') {
      // Linux uses .config
      return configPath.replace('Library/Application Support', '.config');
    }

    // macOS - use as is
    return configPath;
  }

  /**
   * Get MCP servers configuration
   */
  private getMCPServers(): Record<string, MCPServerConfig> {
    return {
      'scaffold-mcp': {
        command: 'npx',
        args: ['-y', '@agiflowai/scaffold-mcp'],
        env: {
          TEMPLATES_PATH: path.join(this.workspaceRoot, 'templates'),
        },
      },
      'architect-mcp': {
        command: 'npx',
        args: ['-y', '@agiflowai/architect-mcp'],
        env: {
          TEMPLATES_PATH: path.join(this.workspaceRoot, 'templates'),
        },
      },
    };
  }

  /**
   * Show next steps after MCP setup
   */
  private showNextSteps(agent: CodingAgent): void {
    print.info('\nNext steps:');

    switch (agent) {
      case CodingAgent.CLAUDE_CODE:
        print.indent('1. Restart Claude Code to load the new MCP servers');
        print.indent('2. The scaffold-mcp and architect-mcp servers will be available');
        break;

      case CodingAgent.CURSOR:
        print.indent('1. Restart Cursor to load the new MCP servers');
        print.indent('2. Open MCP settings in Cursor to verify configuration');
        break;

      case CodingAgent.GEMINI_CLI:
        print.indent('1. Restart Gemini CLI');
        print.indent('2. Use MCP commands to interact with the servers');
        break;

      case CodingAgent.CLINE:
        print.indent('1. Restart VSCode');
        print.indent('2. Open Cline extension settings to verify MCP configuration');
        break;
    }
  }

  /**
   * Check if agent is already configured
   * @param agent - The coding agent to check
   * @returns true if configuration file exists
   */
  async isConfigured(agent: CodingAgent): Promise<boolean> {
    if (agent === CodingAgent.NONE) {
      return false;
    }

    try {
      const agentConfig = this.getAgentConfig(agent);
      const configPath = this.resolveConfigPath(agentConfig.configPath);
      return await fs.pathExists(configPath);
    } catch {
      return false;
    }
  }
}
