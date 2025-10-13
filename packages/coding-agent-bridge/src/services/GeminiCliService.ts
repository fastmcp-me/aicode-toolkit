/**
 * GeminiCliService
 *
 * DESIGN PATTERNS:
 * - Class-based service pattern for encapsulating business logic
 * - Interface implementation for dependency injection and testing
 * - Single Responsibility: Manages Gemini CLI interactions
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
import type {
  CodingAgentService,
  LlmInvocationParams,
  LlmInvocationResponse,
  McpSettings,
  PromptConfig,
} from '../types';

/**
 * Gemini CLI JSON response format
 */
interface GeminiJsonResponse {
  response?: string;
  stats?: {
    models?: string[];
    tools?: string[];
    files?: string[];
    inputTokens?: number;
    outputTokens?: number;
  };
  error?: {
    type?: string;
    message?: string;
    code?: string;
  };
}

/**
 * Service for interacting with Gemini CLI as a coding agent
 * Provides standard LLM interface using Gemini's headless mode with JSON output
 */
export class GeminiCliService implements CodingAgentService {
  private mcpSettings: McpSettings = {};
  private promptConfig: PromptConfig = {};
  private readonly workspaceRoot: string;
  private readonly geminiPath: string;
  private readonly defaultTimeout: number;
  private readonly defaultModel: string;
  private readonly defaultEnv: Record<string, string>;

  constructor(options?: {
    workspaceRoot?: string;
    geminiPath?: string;
    defaultTimeout?: number;
    defaultModel?: string;
    defaultEnv?: Record<string, string>;
  }) {
    this.workspaceRoot = options?.workspaceRoot || process.cwd();
    this.geminiPath = options?.geminiPath || 'gemini';
    this.defaultTimeout = options?.defaultTimeout || 60000; // 1 minute default
    this.defaultModel = options?.defaultModel || 'gemini-2.0-flash-exp';
    this.defaultEnv = options?.defaultEnv || {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    };
  }

  /**
   * Check if the Gemini CLI service is enabled
   * Detects Gemini by checking for .gemini file in workspace root (project-level only)
   */
  async isEnabled(): Promise<boolean> {
    const geminiWorkspaceFile = path.join(this.workspaceRoot, '.gemini');
    return fs.pathExists(geminiWorkspaceFile);
  }

  /**
   * Update MCP (Model Context Protocol) settings for Gemini CLI
   * Writes MCP server configuration to ~/.gemini/settings.json
   * Converts standardized McpServerConfig to Gemini JSON format
   */
  async updateMcpSettings(settings: McpSettings): Promise<void> {
    this.mcpSettings = { ...this.mcpSettings, ...settings };

    // Gemini CLI uses settings.json in ~/.gemini directory
    const configDir = path.join(os.homedir(), '.gemini');
    const configPath = path.join(configDir, 'settings.json');

    // Ensure config directory exists
    await fs.ensureDir(configDir);

    // Read existing config or create new
    let config: any = {};
    if (await fs.pathExists(configPath)) {
      const content = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(content);
    }

    // Ensure mcpServers key exists
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Convert standardized MCP server configs to Gemini CLI format
    if (settings.servers) {
      for (const [serverName, serverConfig] of Object.entries(settings.servers)) {
        const geminiConfig: any = {
          disabled: serverConfig.disabled ?? false,
        };

        // Add type-specific fields
        if (serverConfig.type === 'stdio') {
          geminiConfig.command = serverConfig.command;
          if (serverConfig.args && serverConfig.args.length > 0) {
            geminiConfig.args = serverConfig.args;
          }
          if (serverConfig.env) {
            geminiConfig.env = serverConfig.env;
          }
        } else if (serverConfig.type === 'http') {
          geminiConfig.httpUrl = serverConfig.url;
        } else if (serverConfig.type === 'sse') {
          geminiConfig.sseUrl = serverConfig.url;
        }

        config.mcpServers[serverName] = geminiConfig;
      }
    }

    // Write config back with pretty formatting
    await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  }

  /**
   * Update prompt configuration for Gemini CLI
   */
  async updatePrompt(config: PromptConfig): Promise<void> {
    this.promptConfig = { ...this.promptConfig, ...config };
  }

  /**
   * Invoke Gemini CLI as an LLM
   * Executes Gemini CLI with headless mode and JSON output format
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
      '--prompt',
      fullPrompt,
      '--output-format',
      'json',
      '--yolo', // Auto-approve tool calls to avoid interactive prompts
    ];

    if (params.model) {
      args.push('--model', params.model);
    }

    // Build environment with API key and custom env vars
    const env = {
      ...process.env,
      ...this.defaultEnv,
    };

    // Execute Gemini CLI
    try {
      const { stdout, exitCode } = await execa(this.geminiPath, args, {
        stdin: 'ignore',
        stdout: 'pipe',
        stderr: 'pipe',
        timeout: params.maxTokens ? params.maxTokens * 100 : this.defaultTimeout,
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer
        env,
        cwd: this.workspaceRoot,
      });

      if (exitCode !== 0) {
        throw new Error(`Gemini CLI process exited with code ${exitCode}`);
      }

      // Parse JSON response
      const jsonResponse: GeminiJsonResponse = JSON.parse(stdout);

      // Check for errors in response
      if (jsonResponse.error) {
        throw new Error(
          `Gemini CLI error: ${jsonResponse.error.message || 'Unknown error'} (${jsonResponse.error.type || 'unknown'})`,
        );
      }

      // Extract response content
      const responseContent = jsonResponse.response || '';
      const model = params.model || this.defaultModel;
      const usage = {
        inputTokens: jsonResponse.stats?.inputTokens || 0,
        outputTokens: jsonResponse.stats?.outputTokens || 0,
      };

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
      // Provide descriptive error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('ETIMEDOUT') || error.message.includes('timed out')) {
          throw new Error(
            `Gemini CLI invocation timed out after ${params.maxTokens ? params.maxTokens * 100 : this.defaultTimeout}ms. Consider increasing the timeout or reducing maxTokens.`,
          );
        }
        if (error.message.includes('ENOENT')) {
          throw new Error(
            `Gemini CLI not found at path: ${this.geminiPath}. Ensure Gemini CLI is installed and the path is correct.`,
          );
        }
        if (error.message.includes('exited with code')) {
          throw new Error(
            `Gemini CLI process failed: ${error.message}. Check Gemini CLI logs for details.`,
          );
        }
        if (error.message.includes('Unexpected token')) {
          throw new Error(
            `Failed to parse Gemini CLI JSON response: ${error.message}. The output may not be in JSON format.`,
          );
        }
        throw new Error(`Failed to invoke Gemini CLI: ${error.message}`);
      }
      throw new Error(`Failed to invoke Gemini CLI: ${String(error)}`);
    }
  }
}
