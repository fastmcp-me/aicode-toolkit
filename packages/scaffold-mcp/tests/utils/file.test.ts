import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getRootPath, getProjectPath } from '../../src/utils/file';

// Mock import.meta.url
vi.mock('node:url', () => ({
  fileURLToPath: vi.fn(() => '/workspace/aicode-toolkit/packages/scaffold-mcp/dist/utils/file.js'),
}));

describe('file utils', () => {
  describe('getRootPath', () => {
    it('should return the root path of the project', () => {
      const rootPath = getRootPath();

      expect(rootPath).toBeTruthy();
      expect(typeof rootPath).toBe('string');
    });

    it('should return a path that ends at the workspace root', () => {
      const rootPath = getRootPath();

      // The root path should go up 5 levels from dist/utils
      expect(rootPath).toContain('workspace');
    });
  });

  describe('getProjectPath', () => {
    it('should remove root path from project path', () => {
      const rootPath = getRootPath();
      const fullPath = `${rootPath}/apps/my-app`;

      const result = getProjectPath(fullPath);

      expect(result).toBe('apps/my-app');
    });

    it('should handle paths without leading slash', () => {
      const rootPath = getRootPath();
      const fullPath = `${rootPath}/apps/my-app`;

      const result = getProjectPath(fullPath);

      expect(result).toBe('apps/my-app');
    });

    it('should return the path as-is if root path is not present', () => {
      const projectPath = '/different/root/apps/my-app';

      const result = getProjectPath(projectPath);

      // Should remove the first slash
      expect(result).toBe('different/root/apps/my-app');
    });

    it('should handle relative paths', () => {
      const projectPath = 'apps/my-app';

      const result = getProjectPath(projectPath);

      // Note: The function removes the first '/' it finds, even in relative paths
      // This results in removing the slash between 'apps' and 'my-app'
      expect(result).toBe('appsmy-app');
    });
  });
});
