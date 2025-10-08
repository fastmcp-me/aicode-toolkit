/**
 * ClaudeCodeLLMService
 *
 * DESIGN PATTERNS:
 * - Service pattern for LLM integration
 * - SDK-based API client pattern
 * - Promise-based async/await pattern
 *
 * CODING STANDARDS:
 * - Use @anthropic-ai/sdk for Claude API access
 * - Provide both complete() and ask() methods
 * - Handle errors with proper error messages
 * - Calculate token costs for usage tracking
 *
 * AVOID:
 * - Subprocess management (use SDK instead)
 * - Missing error handling
 * - Hardcoded API keys (use environment variables)
 */

import Anthropic from '@anthropic-ai/sdk';

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
 * Claude SDK LLM Service - Direct API integration using @anthropic-ai/sdk
 */
export class ClaudeCodeLLMService {
  private readonly client: Anthropic;
  private readonly defaultModel: string;
  private readonly defaultMaxTokens: number;

  constructor(options?: {
    apiKey?: string;
    defaultModel?: string;
    defaultMaxTokens?: number;
    defaultTimeout?: number;
    maxRetries?: number;
  }) {
    this.client = new Anthropic({
      apiKey: options?.apiKey || process.env['ANTHROPIC_API_KEY'],
      timeout: options?.defaultTimeout || 60000,
      maxRetries: options?.maxRetries || 3,
    });

    this.defaultModel = options?.defaultModel || 'claude-sonnet-4-5-20250929';
    this.defaultMaxTokens = options?.defaultMaxTokens || 4096;
  }

  /**
   * Send a request to Claude API and get a single response
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const sessionId = request.sessionId || crypto.randomUUID();
    const startTime = Date.now();

    try {
      const message = await this.client.messages.create({
        model: request.model || this.defaultModel,
        max_tokens: request.maxTokens || this.defaultMaxTokens,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        ...(request.systemPrompt && { system: request.systemPrompt }),
        ...(request.temperature !== undefined && { temperature: request.temperature }),
      });

      const duration = Date.now() - startTime;

      // Extract text content
      const content = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('');

      // Calculate approximate cost (prices as of Jan 2025 for Claude Sonnet 4.5)
      // Input: $3.00 per million tokens
      // Output: $15.00 per million tokens
      const inputCost = (message.usage.input_tokens / 1_000_000) * 3.0;
      const outputCost = (message.usage.output_tokens / 1_000_000) * 15.0;
      const cost = inputCost + outputCost;

      return {
        content,
        model: message.model,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          totalTokens: message.usage.input_tokens + message.usage.output_tokens,
          cacheCreationTokens: message.usage.cache_creation_input_tokens ?? undefined,
          cacheReadTokens: message.usage.cache_read_input_tokens ?? undefined,
        },
        metadata: {
          sessionId,
          duration,
          cost,
          finishReason: message.stop_reason,
        },
      };
    } catch (error) {
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Simplified method for quick completions
   */
  async ask(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await this.complete({ prompt, systemPrompt });
    return response.content;
  }

  /**
   * Stream a response from Claude API
   */
  async *completeStream(request: LLMRequest): AsyncGenerator<string> {
    const stream = await this.client.messages.create({
      model: request.model || this.defaultModel,
      max_tokens: request.maxTokens || this.defaultMaxTokens,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
      ...(request.systemPrompt && { system: request.systemPrompt }),
      ...(request.temperature !== undefined && { temperature: request.temperature }),
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}
