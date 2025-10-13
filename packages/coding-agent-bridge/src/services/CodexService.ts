/**
 * CodexService
 *
 * DESIGN PATTERNS:
 * - Class-based service pattern for encapsulating business logic
 * - Interface implementation for dependency injection and testing
 * - Single Responsibility: Manages Codex CLI interactions
 * - Method-based API: Public methods expose service capabilities
 *
 * CODING STANDARDS:
 * - Service class names use PascalCase with 'Service' suffix
 * - Method names use camelCase with descriptive verbs
 * - Return types should be explicit (never use implicit any)
 * - Use async/await for asynchronous operations
 * - Handle errors with try-catch and throw descriptive Error objects
 * - Document public methods with JSDoc comments
 *
 * AVOID:
 * - Side effects in constructors (keep them lightweight)
 * - Mixing concerns (keep services focused on single domain)
 * - Direct coupling to other services (use dependency injection)
 * - Exposing internal implementation details
 */

import { execa } from 'execa';
import * as fs from 'fs-extra';
import * as os from 'node:os';
import * as path from 'node:path';
import * as readline from 'node:readline';
import type {
  CodingAgentService,
  LlmInvocationParams,
  LlmInvocationResponse,
  McpSettings,
  PromptConfig,
} from '../types';

/**
 * Internal message types for parsing JSONL output from Codex CLI
 */
interface CodexStreamEvent {
  type:
    | 'thread.started'
    | 'turn.started'
    | 'turn.completed'
    | 'item.started'
    | 'item.updated'
    | 'item.completed';
  data?: {
    item?: {
      type?: 'agent_message' | 'reasoning' | 'command_execution';
      content?: string;
      message?: {
        content?: string;
      };
    };
    turn?: {
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
    };
  };
}

/**
 * Service for interacting with Codex CLI as a coding agent
 * Provides standard LLM interface using Codex's exec mode with JSON output
 */
export class CodexService implements CodingAgentService {
  private mcpSettings: McpSettings = {};
  private promptConfig: PromptConfig = {};
  private readonly workspaceRoot: string;
  private readonly codexPath: string;
  private readonly defaultTimeout: number;
  private readonly defaultModel: string;
  private readonly defaultEnv: Record<string, string>;

  constructor(options?: {
    workspaceRoot?: string;
    codexPath?: string;
    defaultTimeout?: number;
    defaultModel?: string;
    defaultEnv?: Record<string, string>;
  }) {
    this.workspaceRoot = options?.workspaceRoot || process.cwd();
    this.codexPath = options?.codexPath || 'codex';
    this.defaultTimeout = options?.defaultTimeout || 60000; // 1 minute default
    this.defaultModel = options?.defaultModel || 'gpt-5-codex';
    this.defaultEnv = options?.defaultEnv || {
      CODEX_API_KEY: process.env.CODEX_API_KEY || '',
    };
  }

  /**
   * Check if the Codex service is enabled
   * Detects Codex by checking for .codex file in workspace root (project-level only)
   */
  async isEnabled(): Promise<boolean> {
    const codexWorkspaceFile = path.join(this.workspaceRoot, '.codex');
    return fs.pathExists(codexWorkspaceFile);
  }

  /**
   * Update MCP (Model Context Protocol) settings for Codex
   * Writes MCP server configuration to ~/.codex/config.toml
   * Converts standardized McpServerConfig to Codex TOML format
   */
  async updateMcpSettings(settings: McpSettings): Promise<void> {
    this.mcpSettings = { ...this.mcpSettings, ...settings };

    // Codex uses config.toml in ~/.codex directory
    const configDir = path.join(os.homedir(), '.codex');
    const configPath = path.join(configDir, 'config.toml');

    // Ensure config directory exists
    await fs.ensureDir(configDir);

    // Read existing config or create new
    let configContent = '';
    if (await fs.pathExists(configPath)) {
      configContent = await fs.readFile(configPath, 'utf-8');
    }

    // Parse TOML (simple approach - append MCP servers section)
    // For production, consider using a TOML parser library like @iarna/toml
    if (settings.servers) {
      // Remove existing [mcp_servers] section if present
      configContent = configContent.replace(/\[mcp_servers\][\s\S]*?(?=\n\[|\n*$)/, '');

      // Build MCP servers TOML section
      let mcpSection = '\n[mcp_servers]\n';
      for (const [serverName, serverConfig] of Object.entries(settings.servers)) {
        mcpSection += `\n[mcp_servers.${serverName}]\n`;
        mcpSection += `disabled = ${serverConfig.disabled ?? false}\n`;

        if (serverConfig.type === 'stdio') {
          mcpSection += 'type = "stdio"\n';
          mcpSection += `command = "${serverConfig.command}"\n`;
          if (serverConfig.args && serverConfig.args.length > 0) {
            mcpSection += `args = [${serverConfig.args.map((arg) => `"${arg}"`).join(', ')}]\n`;
          }
          if (serverConfig.env) {
            mcpSection += `[mcp_servers.${serverName}.env]\n`;
            for (const [key, value] of Object.entries(serverConfig.env)) {
              mcpSection += `${key} = "${value}"\n`;
            }
          }
        } else if (serverConfig.type === 'http' || serverConfig.type === 'sse') {
          mcpSection += `type = "${serverConfig.type}"\n`;
          mcpSection += `url = "${serverConfig.url}"\n`;
        }
      }

      // Append MCP section to config
      configContent = configContent.trim() + mcpSection;
    }

    // Write config back
    await fs.writeFile(configPath, configContent);
  }

  /**
   * Update prompt configuration for Codex
   */
  async updatePrompt(config: PromptConfig): Promise<void> {
    this.promptConfig = { ...this.promptConfig, ...config };
  }

  /**
   * Invoke Codex as an LLM
   * Executes Codex CLI with exec mode and JSON output format
   */
  async invokeAsLlm(params: LlmInvocationParams): Promise<LlmInvocationResponse> {
    // Build the prompt with optional system prompt
    let fullPrompt = params.prompt;
    const systemPrompt = this.promptConfig.systemPrompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\n${params.prompt}`;
    }

    // Build command arguments for non-interactive LLM invocation
    const args = [
      'exec',
      '--json', // Enable JSON output
      '--skip-git-repo-check', // Allow running outside git repos
      fullPrompt,
    ];

    if (params.model) {
      args.push('--model', params.model);
    }

    // Build environment with API key and custom env vars
    const env = {
      ...process.env,
      ...this.defaultEnv,
    };

    // Execute Codex CLI
    const child = execa(this.codexPath, args, {
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: params.maxTokens ? params.maxTokens * 100 : this.defaultTimeout,
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      env,
      cwd: this.workspaceRoot,
    });

    // Create readline interface for streaming output
    const rl = readline.createInterface({
      input: child.stdout,
    });

    // Collect response data
    let responseContent = '';
    const model = params.model || this.defaultModel;
    const usage = {
      inputTokens: 0,
      outputTokens: 0,
    };
    let partialData = '';

    try {
      // Process streaming JSONL output
      for await (const line of rl) {
        if (!line.trim()) continue;

        let event: CodexStreamEvent;
        try {
          event = JSON.parse(line);
        } catch {
          // Handle partial JSON by accumulating
          partialData += line;
          try {
            event = JSON.parse(partialData);
            partialData = '';
          } catch {
            continue;
          }
        }

        // Process different event types
        if (event.type === 'item.completed' && event.data?.item) {
          const item = event.data.item;

          // Extract text content from agent messages
          if (item.type === 'agent_message') {
            const content = item.content || item.message?.content || '';
            if (content) {
              responseContent += content;
            }
          }
        } else if (event.type === 'turn.completed' && event.data?.turn?.usage) {
          // Extract usage statistics
          const turnUsage = event.data.turn.usage;
          usage.inputTokens = turnUsage.input_tokens || 0;
          usage.outputTokens = turnUsage.output_tokens || 0;
        }
      }

      // Wait for process to complete
      const { exitCode } = await child;
      if (exitCode !== 0) {
        throw new Error(`Codex process exited with code ${exitCode}`);
      }

      // Return standard LLM response
      return {
        content: responseContent.trim(),
        model,
        usage: {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        },
      };
    } catch (error) {
      // Clean up on error
      rl.close();
      if (!child.killed) {
        child.kill();
      }

      // Provide descriptive error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('ETIMEDOUT') || error.message.includes('timed out')) {
          throw new Error(
            `Codex invocation timed out after ${params.maxTokens ? params.maxTokens * 100 : this.defaultTimeout}ms. Consider increasing the timeout or reducing maxTokens.`,
          );
        }
        if (error.message.includes('ENOENT')) {
          throw new Error(
            `Codex CLI not found at path: ${this.codexPath}. Ensure Codex is installed and the path is correct.`,
          );
        }
        if (error.message.includes('exited with code')) {
          throw new Error(`Codex process failed: ${error.message}. Check Codex logs for details.`);
        }
        throw new Error(`Failed to invoke Codex: ${error.message}`);
      }
      throw new Error(`Failed to invoke Codex: ${String(error)}`);
    } finally {
      rl.close();
    }
  }
}
