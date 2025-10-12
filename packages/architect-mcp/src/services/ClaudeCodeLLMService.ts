import { execa } from 'execa';
import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';

/**
 * Standard LLM request interface
 */
export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  sessionId?: string;
}

/**
 * Standard LLM response interface
 */
export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
  };
  metadata: {
    sessionId: string;
    duration: number;
    cost: number;
    finishReason: string | null;
  };
}

/**
 * Internal message types for parsing stream-json output
 */
interface ClaudeStreamMessage {
  type: 'system' | 'assistant' | 'user' | 'result';
  message?: {
    id?: string;
    model?: string;
    content?: Array<{
      type: 'text' | 'tool_use';
      text?: string;
    }>;
    stop_reason?: string | null;
    usage?: {
      input_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
      output_tokens: number;
    };
  };
  model?: string;
  session_id?: string;
  duration_ms?: number;
  total_cost_usd?: number;
  usage?: any;
}

const claudeCodeBuiltinTools = [
  'Task',
  'Bash',
  'Glob',
  'Grep',
  'LS',
  'exit_plan_mode',
  'Read',
  'Edit',
  'MultiEdit',
  'Write',
  'NotebookRead',
  'NotebookEdit',
  'WebFetch',
  'TodoRead',
  'TodoWrite',
  'WebSearch',
].join(',');

/**
 * Claude Code LLM Service - Provides a standard LLM interface using Claude Code CLI
 */
export class ClaudeCodeLLMService {
  private readonly claudePath: string;
  private readonly defaultTimeout: number;
  private readonly defaultModel: string;
  private readonly defaultEnv: Record<string, string>;

  constructor(options?: {
    claudePath?: string;
    defaultTimeout?: number;
    defaultModel?: string;
    defaultEnv?: Record<string, string>;
  }) {
    this.claudePath = options?.claudePath || 'claude';
    this.defaultTimeout = options?.defaultTimeout || 60000; // 1 minute default
    this.defaultModel = options?.defaultModel || 'claude-sonnet-4-20250514';
    this.defaultEnv = options?.defaultEnv || {
      DISABLE_TELEMETRY: '1',
      DISABLE_AUTOUPDATER: '1',
      IS_SANDBOX: '1',
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    };
  }

  /**
   * Send a request to Claude Code and get a single response
   * Similar to standard LLM APIs like OpenAI's chat completion
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const sessionId = request.sessionId || uuidv4();
    const startTime = Date.now();

    // Build command arguments - single turn only
    // Note: stream-json requires --verbose flag
    const args = [
      '--max-turns',
      '0',
      '--output-format',
      'stream-json',
      '--verbose',
      '--session-id',
      sessionId,
    ];

    args.push('--disallowedTools', claudeCodeBuiltinTools);

    if (request.model) {
      args.push('--model', request.model);
    }

    if (request.systemPrompt) {
      args.push('--system-prompt', request.systemPrompt);
    }

    // Execute Claude CLI
    const child = execa(this.claudePath, args, {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: this.defaultTimeout,
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      env: {
        ...process.env,
        ...this.defaultEnv,
        ...(request.maxTokens && {
          CLAUDE_CODE_MAX_OUTPUT_TOKENS: request.maxTokens.toString(),
        }),
      },
    });

    // Write prompt to stdin and close it
    child.stdin!.write(request.prompt);
    child.stdin!.end();

    // Create readline interface for streaming output
    const rl = readline.createInterface({
      input: child.stdout!,
    });

    // Collect response data
    let responseContent = '';
    let model = request.model || this.defaultModel;
    const usage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
    };
    let cost = 0;
    let finishReason: string | null = null;
    let partialData = '';

    try {
      // Process streaming output
      for await (const line of rl) {
        if (!line.trim()) continue;

        let message: ClaudeStreamMessage;
        try {
          message = JSON.parse(line);
        } catch {
          // Handle partial JSON
          partialData += line;
          try {
            message = JSON.parse(partialData);
            partialData = '';
          } catch {
            continue;
          }
        }

        // Process different message types
        if (message.type === 'system' && message.model) {
          model = message.model;
        } else if (message.type === 'assistant' && message.message) {
          // Extract text content from assistant messages
          const textContent =
            message.message.content
              ?.filter((c) => c.type === 'text')
              .map((c) => c.text)
              .filter(Boolean)
              .join('') || '';

          responseContent += textContent;

          // Update usage stats
          if (message.message.usage) {
            usage.inputTokens = message.message.usage.input_tokens || 0;
            usage.outputTokens = message.message.usage.output_tokens || 0;
            usage.cacheCreationTokens = message.message.usage.cache_creation_input_tokens || 0;
            usage.cacheReadTokens = message.message.usage.cache_read_input_tokens || 0;
            usage.totalTokens = usage.inputTokens + usage.outputTokens;
          }

          if (message.message.stop_reason) {
            finishReason = message.message.stop_reason;
          }
        } else if (message.type === 'result') {
          // Final result with cost and duration info
          cost = message.total_cost_usd || 0;

          // Update final usage if available
          if (message.usage) {
            usage.inputTokens = message.usage.input_tokens || usage.inputTokens;
            usage.outputTokens = message.usage.output_tokens || usage.outputTokens;
            usage.cacheCreationTokens =
              message.usage.cache_creation_input_tokens || usage.cacheCreationTokens;
            usage.cacheReadTokens = message.usage.cache_read_input_tokens || usage.cacheReadTokens;
            usage.totalTokens = usage.inputTokens + usage.outputTokens;
          }
        }
      }

      // Wait for process to complete
      const { exitCode } = await child;
      if (exitCode !== 0) {
        throw new Error(`Claude Code process exited with code ${exitCode}`);
      }

      const duration = Date.now() - startTime;

      // Return standard LLM response
      return {
        content: responseContent.trim(),
        model,
        usage,
        metadata: {
          sessionId,
          duration,
          cost,
          finishReason,
        },
      };
    } catch (error) {
      // Clean up on error
      rl.close();
      if (!child.killed) {
        child.kill();
      }
      throw error;
    } finally {
      rl.close();
    }
  }

  /**
   * Simplified method for quick completions
   */
  async ask(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await this.complete({ prompt, systemPrompt });
    return response.content;
  }
}
