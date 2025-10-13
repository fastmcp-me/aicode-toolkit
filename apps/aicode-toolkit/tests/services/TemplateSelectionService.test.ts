/**
 * TemplateSelectionService Tests
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
import { ProjectType } from '@agiflowai/aicode-utils';
import * as fs from 'fs-extra';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateSelectionService } from '../../src/services/TemplateSelectionService';

// Mock dependencies
vi.mock('fs-extra', async () => {
  const mockFs = await import('../__mocks__/fs-extra');
  return mockFs;
});
vi.mock('../../src/utils/git');

const { cloneSubdirectory, fetchGitHubDirectoryContents } = await import('../../src/utils/git');

describe('TemplateSelectionService', () => {
  let service: TemplateSelectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TemplateSelectionService();
  });

  describe('constructor', () => {
    it('should create tmp directory path with timestamp', () => {
      const tmpDir = service.getTmpDir();
      expect(tmpDir).toContain(os.tmpdir());
      expect(tmpDir).toContain('aicode-templates-');
    });
  });

  describe('downloadTemplatesToTmp', () => {
    const repoConfig = {
      owner: 'AgiFlow',
      repo: 'aicode-toolkit',
      branch: 'main',
      path: 'templates',
    };

    it('should download templates to tmp directory', async () => {
      const mockContents = [
        { name: 'nextjs-15', type: 'dir', path: 'templates/nextjs-15' },
        { name: 'typescript-mcp', type: 'dir', path: 'templates/typescript-mcp' },
        { name: 'README.md', type: 'file', path: 'templates/README.md' },
      ];

      vi.mocked(fetchGitHubDirectoryContents).mockResolvedValue(mockContents as any);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(cloneSubdirectory).mockResolvedValue(undefined);

      const result = await service.downloadTemplatesToTmp(repoConfig);

      expect(result).toBe(service.getTmpDir());
      expect(fetchGitHubDirectoryContents).toHaveBeenCalledWith(
        'AgiFlow',
        'aicode-toolkit',
        'templates',
        'main',
      );
      // Should only clone directories (not files)
      expect(cloneSubdirectory).toHaveBeenCalledTimes(2);
    });

    it('should throw error if no templates found', async () => {
      vi.mocked(fetchGitHubDirectoryContents).mockResolvedValue([]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);

      await expect(service.downloadTemplatesToTmp(repoConfig)).rejects.toThrow(
        'No templates found in repository',
      );
    });

    it('should cleanup on download error', async () => {
      vi.mocked(fetchGitHubDirectoryContents).mockRejectedValue(new Error('Network error'));
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.remove).mockResolvedValue(undefined);

      await expect(service.downloadTemplatesToTmp(repoConfig)).rejects.toThrow(
        'Failed to download templates',
      );
    });
  });

  describe('listTemplates', () => {
    it('should list templates with descriptions', async () => {
      const mockEntries = [
        { name: 'nextjs-15', isDirectory: () => true },
        { name: 'typescript-mcp', isDirectory: () => true },
        { name: 'README.md', isDirectory: () => false },
      ];

      vi.mocked(fs.readdir).mockResolvedValue(mockEntries as any);
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const templates = await service.listTemplates();

      expect(templates).toHaveLength(2);
      expect(templates[0].name).toBe('nextjs-15');
      expect(templates[1].name).toBe('typescript-mcp');
    });

    it('should read descriptions from scaffold.yaml', async () => {
      const mockEntries = [{ name: 'nextjs-15', isDirectory: () => true }];

      vi.mocked(fs.readdir).mockResolvedValue(mockEntries as any);
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue('description: Next.js 15 template');

      const templates = await service.listTemplates();

      expect(templates[0].description).toBe('Next.js 15 template');
    });
  });

  describe('copyTemplates', () => {
    const destinationPath = '/workspace/templates';

    it('should copy selected templates for monorepo', async () => {
      const templateNames = ['nextjs-15', 'typescript-mcp'];

      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      // Source exists (true), destination doesn't exist (false)
      vi.mocked(fs.pathExists)
        .mockResolvedValueOnce(true) // nextjs-15 source exists
        .mockResolvedValueOnce(false) // nextjs-15 destination doesn't exist
        .mockResolvedValueOnce(true) // typescript-mcp source exists
        .mockResolvedValueOnce(false); // typescript-mcp destination doesn't exist
      vi.mocked(fs.copy).mockResolvedValue(undefined);

      await service.copyTemplates(templateNames, destinationPath, ProjectType.MONOREPO);

      expect(fs.copy).toHaveBeenCalledTimes(2);
    });

    it('should allow single template for monolith', async () => {
      const templateNames = ['nextjs-15'];

      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.copy).mockResolvedValue(undefined);

      await expect(
        service.copyTemplates(templateNames, destinationPath, ProjectType.MONOLITH),
      ).resolves.not.toThrow();
    });

    it('should reject multiple templates for monolith', async () => {
      const templateNames = ['nextjs-15', 'typescript-mcp'];

      await expect(
        service.copyTemplates(templateNames, destinationPath, ProjectType.MONOLITH),
      ).rejects.toThrow('Monolith projects can only use a single template');
    });

    it('should skip templates that already exist', async () => {
      const templateNames = ['nextjs-15'];
      const tmpDir = service.getTmpDir();

      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.pathExists)
        .mockResolvedValueOnce(true) // Source exists
        .mockResolvedValueOnce(true); // Destination already exists

      await service.copyTemplates(templateNames, destinationPath, ProjectType.MONOLITH);

      expect(fs.copy).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove tmp directory if exists', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.remove).mockResolvedValue(undefined);

      await service.cleanup();

      expect(fs.remove).toHaveBeenCalledWith(service.getTmpDir());
    });

    it('should not throw if tmp directory does not exist', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      await expect(service.cleanup()).resolves.not.toThrow();
    });

    it('should not throw if cleanup fails', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.remove).mockRejectedValue(new Error('Permission denied'));

      await expect(service.cleanup()).resolves.not.toThrow();
    });
  });
});
