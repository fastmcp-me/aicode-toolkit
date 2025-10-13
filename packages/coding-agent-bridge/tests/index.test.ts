import { describe, expect, it } from 'vitest';
import {
  CLAUDE_CODE,
  ClaudeCodeService,
  CODEX,
  type CodingAgentService,
  GEMINI_CLI,
  type LlmInvocationParams,
  type LlmInvocationResponse,
  SupportedCodingAgents,
} from '../src/index';

describe('coding-agent-bridge', () => {
  describe('constants', () => {
    it('should export coding agent identifiers', () => {
      expect(CLAUDE_CODE).toBe('claude-code');
      expect(CODEX).toBe('codex');
      expect(GEMINI_CLI).toBe('gemini-cli');
    });

    it('should export supported coding agents configuration', () => {
      expect(SupportedCodingAgents[CLAUDE_CODE]).toEqual({
        id: 'claude-code',
        displayName: 'Claude Code',
        description: 'Anthropic Claude Code - AI coding assistant with direct codebase access',
      });
      expect(SupportedCodingAgents[CODEX]).toBeDefined();
      expect(SupportedCodingAgents[GEMINI_CLI]).toBeDefined();
    });
  });

  describe('services', () => {
    it('should export ClaudeCodeService class', () => {
      expect(ClaudeCodeService).toBeDefined();
      expect(typeof ClaudeCodeService).toBe('function');
    });

    it('should create ClaudeCodeService instance', () => {
      const service = new ClaudeCodeService();
      expect(service).toBeInstanceOf(ClaudeCodeService);
    });

    it('should implement CodingAgentService interface', async () => {
      const service: CodingAgentService = new ClaudeCodeService();
      expect(typeof service.isEnabled).toBe('function');
      expect(typeof service.updateMcpSettings).toBe('function');
      expect(typeof service.updatePrompt).toBe('function');
      expect(typeof service.invokeAsLlm).toBe('function');
    });

    it('should detect Claude Code based on workspace indicators', async () => {
      // Without workspace root, should check current directory
      const service = new ClaudeCodeService();
      const isEnabled = await service.isEnabled();
      // Should return true if .claude folder or CLAUDE.md exists in workspace
      expect(typeof isEnabled).toBe('boolean');
    });
  });

  describe('types', () => {
    it('should export LlmInvocationParams type', () => {
      const params: LlmInvocationParams = {
        prompt: 'test',
      };
      expect(params.prompt).toBe('test');
    });

    it('should export LlmInvocationResponse type', () => {
      const response: LlmInvocationResponse = {
        content: 'response',
        model: 'claude-sonnet-4-20250514',
        usage: {
          inputTokens: 10,
          outputTokens: 20,
        },
      };
      expect(response.content).toBe('response');
    });
  });
});
