/**
 * projectTypeDetector Utilities Tests
 *
 * TESTING PATTERNS:
 * - Unit tests for each exported function
 * - Test pure function behavior (same input = same output)
 * - Test edge cases, boundary conditions, and invalid inputs
 * - Mock file system for deterministic testing
 *
 * CODING STANDARDS:
 * - Use Vitest testing framework
 * - Group related tests with describe blocks
 * - Clear test names: 'should [expected behavior] when [condition]'
 * - Test both happy paths and error scenarios
 * - Use data-driven tests for multiple input scenarios
 *
 * AVOID:
 * - Testing implementation details (test behavior, not internals)
 * - Shared state between tests
 */

import * as fs from 'fs-extra';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectType } from '../../src/constants';
import { detectProjectType, isMonolith, isMonorepo } from '../../src/utils/projectTypeDetector';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  pathExists: vi.fn(),
  readFile: vi.fn(),
  readJson: vi.fn(),
}));

describe('projectTypeDetector', () => {
  const mockWorkspaceRoot = '/test/workspace';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('detectProjectType', () => {
    it('should detect monorepo from nx.json', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'nx.json');
      });

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBe(ProjectType.MONOREPO);
      expect(result.indicators).toContain('nx.json found');
    });

    it('should detect monorepo from lerna.json', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'lerna.json');
      });

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBe(ProjectType.MONOREPO);
      expect(result.indicators).toContain('lerna.json found');
    });

    it('should detect monorepo from pnpm-workspace.yaml', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'pnpm-workspace.yaml');
      });

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBe(ProjectType.MONOREPO);
      expect(result.indicators).toContain('pnpm-workspace.yaml found');
    });

    it('should detect monorepo from turbo.json', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'turbo.json');
      });

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBe(ProjectType.MONOREPO);
      expect(result.indicators).toContain('turbo.json found');
    });

    it('should detect monorepo from rush.json', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'rush.json');
      });

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBe(ProjectType.MONOREPO);
      expect(result.indicators).toContain('rush.json found');
    });

    it('should detect monorepo from package.json with workspaces', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'package.json');
      });
      vi.mocked(fs.readJson).mockResolvedValue({
        workspaces: ['packages/*', 'apps/*'],
      });

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBe(ProjectType.MONOREPO);
      expect(result.indicators).toContain('package.json with workspaces found');
    });

    it('should return undefined when no indicators found', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBeUndefined();
      expect(result.indicators).toContain('No monorepo indicators found');
    });

    it('should prioritize toolkit.yaml over other indicators', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return (
          filePath === path.join(mockWorkspaceRoot, 'toolkit.yaml') ||
          filePath === path.join(mockWorkspaceRoot, 'nx.json')
        );
      });
      vi.mocked(fs.readFile).mockResolvedValue(
        `projectType: ${ProjectType.MONOLITH}`,
      );

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBe(ProjectType.MONOLITH);
      expect(result.indicators[0]).toContain('toolkit.yaml');
    });

    it('should handle toolkit.yaml read errors gracefully', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return (
          filePath === path.join(mockWorkspaceRoot, 'toolkit.yaml') ||
          filePath === path.join(mockWorkspaceRoot, 'nx.json')
        );
      });
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read error'));

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBe(ProjectType.MONOREPO);
      expect(result.indicators).toContain('nx.json found');
    });

    it('should handle package.json read errors gracefully', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'package.json');
      });
      vi.mocked(fs.readJson).mockRejectedValue(new Error('Parse error'));

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBeUndefined();
      expect(result.indicators).toContain('No monorepo indicators found');
    });

    it('should parse toolkit.yaml as YAML (not JSON)', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'toolkit.yaml');
      });
      // Provide actual YAML content with YAML-specific syntax (comments, no quotes on keys)
      vi.mocked(fs.readFile).mockResolvedValue(`
# Toolkit configuration
projectType: monolith
sourceTemplate: nextjs-15
      `);

      const result = await detectProjectType(mockWorkspaceRoot);

      expect(result.projectType).toBe(ProjectType.MONOLITH);
      expect(result.indicators[0]).toContain('toolkit.yaml specifies monolith');
    });
  });

  describe('isMonorepo', () => {
    it('should return true when monorepo detected', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'nx.json');
      });

      const result = await isMonorepo(mockWorkspaceRoot);

      expect(result).toBe(true);
    });

    it('should return false when no monorepo indicators', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const result = await isMonorepo(mockWorkspaceRoot);

      expect(result).toBe(false);
    });
  });

  describe('isMonolith', () => {
    it('should return true when toolkit.yaml specifies monolith', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'toolkit.yaml');
      });
      vi.mocked(fs.readFile).mockResolvedValue(
        `projectType: ${ProjectType.MONOLITH}`,
      );

      const result = await isMonolith(mockWorkspaceRoot);

      expect(result).toBe(true);
    });

    it('should return false when monorepo detected', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (filePath: string) => {
        return filePath === path.join(mockWorkspaceRoot, 'nx.json');
      });

      const result = await isMonolith(mockWorkspaceRoot);

      expect(result).toBe(false);
    });
  });
});
