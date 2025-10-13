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

import * as fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CodingAgent, CodingAgentService } from '../../src/services/CodingAgentService';

// Mock dependencies
vi.mock('fs-extra', async () => {
  const mockFs = await import('../__mocks__/fs-extra');
  return mockFs;
});

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

      expect(agents).toHaveLength(5);
      expect(agents.map((a) => a.value)).toContain(CodingAgent.CLAUDE_CODE);
      expect(agents.map((a) => a.value)).toContain(CodingAgent.CURSOR);
      expect(agents.map((a) => a.value)).toContain(CodingAgent.GEMINI_CLI);
      expect(agents.map((a) => a.value)).toContain(CodingAgent.CLINE);
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

    it('should create new config if it does not exist', async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await service.setupMCP(CodingAgent.CLAUDE_CODE);

      expect(fs.ensureDir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const config = JSON.parse(writeCall[1] as string);

      expect(config.mcpServers).toBeDefined();
      expect(config.mcpServers['scaffold-mcp']).toBeDefined();
      expect(config.mcpServers['architect-mcp']).toBeDefined();
    });

    it('should update existing config', async () => {
      const existingConfig = {
        mcpServers: {
          'existing-server': {
            command: 'node',
            args: ['server.js'],
          },
        },
      };

      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingConfig));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await service.setupMCP(CodingAgent.CLAUDE_CODE);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const config = JSON.parse(writeCall[1] as string);

      expect(config.mcpServers['existing-server']).toBeDefined();
      expect(config.mcpServers['scaffold-mcp']).toBeDefined();
      expect(config.mcpServers['architect-mcp']).toBeDefined();
    });

    it('should not overwrite existing MCP servers', async () => {
      const existingConfig = {
        mcpServers: {
          'scaffold-mcp': {
            command: 'custom-command',
            args: ['custom-arg'],
          },
        },
      };

      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingConfig));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await service.setupMCP(CodingAgent.CLAUDE_CODE);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const config = JSON.parse(writeCall[1] as string);

      // Should keep existing custom config
      expect(config.mcpServers['scaffold-mcp'].command).toBe('custom-command');
    });

    it('should set TEMPLATES_PATH environment variable', async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await service.setupMCP(CodingAgent.CLAUDE_CODE);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const config = JSON.parse(writeCall[1] as string);

      expect(config.mcpServers['scaffold-mcp'].env.TEMPLATES_PATH).toContain('templates');
      expect(config.mcpServers['architect-mcp'].env.TEMPLATES_PATH).toContain('templates');
    });

    it('should handle different agents with correct config paths', async () => {
      const agents = [
        CodingAgent.CLAUDE_CODE,
        CodingAgent.CURSOR,
        CodingAgent.GEMINI_CLI,
        CodingAgent.CLINE,
      ];

      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      for (const agent of agents) {
        vi.clearAllMocks();
        await service.setupMCP(agent);

        expect(fs.ensureDir).toHaveBeenCalled();
        expect(fs.writeFile).toHaveBeenCalled();
      }
    });
  });

  describe('isConfigured', () => {
    it('should return false for NONE agent', async () => {
      const result = await service.isConfigured(CodingAgent.NONE);
      expect(result).toBe(false);
    });

    it('should return true if config file exists', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);

      const result = await service.isConfigured(CodingAgent.CLAUDE_CODE);

      expect(result).toBe(true);
    });

    it('should return false if config file does not exist', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const result = await service.isConfigured(CodingAgent.CLAUDE_CODE);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      vi.mocked(fs.pathExists).mockRejectedValue(new Error('Permission denied'));

      const result = await service.isConfigured(CodingAgent.CLAUDE_CODE);

      expect(result).toBe(false);
    });
  });
});
