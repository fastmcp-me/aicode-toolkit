/**
 * CodingAgentService Tests
 *
 * TESTING PATTERNS:
 * - Unit tests with mocked dependencies
 * - Test each method independently
 * - Cover success cases, edge cases, and error handling
 *
 * CODING STANDARDS:
 * - Use descriptive test names (should...)
 * - Arrange-Act-Assert pattern
 * - Mock external dependencies
 * - Test behavior, not implementation
 */

import os from 'node:os';
import path from 'node:path';
import * as fs from 'fs-extra';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CodingAgent, CodingAgentService } from '../../src/services/CodingAgentService';

// Mock dependencies
vi.mock('fs-extra', async () => {
  const mockFs = await import('../__mocks__/fs-extra');
  return mockFs;
});

vi.mock('@agiflowai/coding-agent-bridge', () => ({
  ClaudeCodeService: vi.fn().mockImplementation(() => ({
    isEnabled: vi.fn().mockResolvedValue(true),
    updateMcpSettings: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('CodingAgentService', () => {
  const workspaceRoot = '/test/workspace';
  let service: CodingAgentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CodingAgentService(workspaceRoot);
  });

  describe('getAvailableAgents', () => {
    it('should return list of available agents', () => {
      const agents = CodingAgentService.getAvailableAgents();

      expect(agents).toHaveLength(2);
      expect(agents.map((a) => a.value)).toContain(CodingAgent.CLAUDE_CODE);
      expect(agents.map((a) => a.value)).toContain(CodingAgent.NONE);
    });

    it('should return agents with name and description', () => {
      const agents = CodingAgentService.getAvailableAgents();

      agents.forEach((agent) => {
        expect(agent.name).toBeDefined();
        expect(agent.value).toBeDefined();
        expect(agent.description).toBeDefined();
      });
    });
  });

  describe('setupMCP', () => {
    it('should skip setup for NONE agent', async () => {
      await service.setupMCP(CodingAgent.NONE);

      expect(fs.ensureDir).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should setup MCP for Claude Code', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await expect(service.setupMCP(CodingAgent.CLAUDE_CODE)).resolves.not.toThrow();
    });

    it('should print message for unsupported agents', async () => {
      await expect(service.setupMCP(CodingAgent.CURSOR)).resolves.not.toThrow();
    });
  });

  describe('detectCodingAgent', () => {
    it('should detect Claude Code when indicators exist', async () => {
      const result = await CodingAgentService.detectCodingAgent(workspaceRoot);
      // The mock ClaudeCodeService always returns isEnabled = true
      expect(result).toBe(CodingAgent.CLAUDE_CODE);
    });
  });
});
