import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create virtual FS before importing anything
const virtualFS = new Map<string, { content: string; isDirectory: boolean }>();

const resetVirtualFS = () => {
  virtualFS.clear();
};

const setVirtualFile = (path: string, content: string, isDirectory = false) => {
  virtualFS.set(path, { content, isDirectory });
};

// Mock fs-extra with hoisted mock factory
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(async (path: string) => virtualFS.has(path)),
    pathExistsSync: vi.fn((path: string) => virtualFS.has(path)),
    readFile: vi.fn(async (path: string) => {
      const file = virtualFS.get(path);
      if (!file || file.isDirectory) throw new Error(`ENOENT: no such file, open '${path}'`);
      return file.content;
    }),
    readFileSync: vi.fn((path: string) => {
      const file = virtualFS.get(path);
      if (!file || file.isDirectory) throw new Error(`ENOENT: no such file, open '${path}'`);
      return file.content;
    }),
    stat: vi.fn(async (path: string) => {
      const file = virtualFS.get(path);
      if (!file) throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
      return {
        isDirectory: () => file.isDirectory,
        isFile: () => !file.isDirectory,
      };
    }),
  },
  pathExists: vi.fn(async (path: string) => virtualFS.has(path)),
  pathExistsSync: vi.fn((path: string) => virtualFS.has(path)),
  readFile: vi.fn(async (path: string) => {
    const file = virtualFS.get(path);
    if (!file || file.isDirectory) throw new Error(`ENOENT: no such file, open '${path}'`);
    return file.content;
  }),
  readFileSync: vi.fn((path: string) => {
    const file = virtualFS.get(path);
    if (!file || file.isDirectory) throw new Error(`ENOENT: no such file, open '${path}'`);
    return file.content;
  }),
  stat: vi.fn(async (path: string) => {
    const file = virtualFS.get(path);
    if (!file) throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
    return {
      isDirectory: () => file.isDirectory,
      isFile: () => !file.isDirectory,
    };
  }),
}));

vi.mock('js-yaml', () => ({
  load: vi.fn((content: string) => {
    const match = content.match(/templatesPath:\s*(.+)/);
    if (match) {
      return { templatesPath: match[1].trim() };
    }
    return {};
  }),
}));

import { TemplatesManager } from '../../src/services/TemplatesManager';

describe('TemplatesManager', () => {
  beforeEach(() => {
    resetVirtualFS();
    vi.clearAllMocks();
  });

  describe('findTemplatesPath', () => {
    it('should find templates in workspace root when toolkit.yaml exists', async () => {
      setVirtualFile('/test/workspace/.git', '', true);
      setVirtualFile('/test/workspace/toolkit.yaml', 'templatesPath: custom-templates');
      setVirtualFile('/test/workspace/custom-templates', '', true);

      const result = await TemplatesManager.findTemplatesPath('/test/workspace/project');

      expect(result).toContain('custom-templates');
    });

    it('should use default templates folder when toolkit.yaml does not exist', async () => {
      setVirtualFile('/test/workspace/.git', '', true);
      setVirtualFile('/test/workspace/templates', '', true);

      const result = await TemplatesManager.findTemplatesPath('/test/workspace');

      expect(result).toContain('templates');
    });

    it('should throw error when templates folder does not exist', async () => {
      setVirtualFile('/test/workspace/.git', '', true);

      await expect(TemplatesManager.findTemplatesPath('/test/workspace')).rejects.toThrow(
        'Templates folder not found',
      );
    });

    it('should handle absolute paths in toolkit.yaml', async () => {
      setVirtualFile('/test/workspace/.git', '', true);
      setVirtualFile('/test/workspace/toolkit.yaml', 'templatesPath: /absolute/templates');
      setVirtualFile('/absolute/templates', '', true);

      const result = await TemplatesManager.findTemplatesPath('/test/workspace');

      expect(result).toBe('/absolute/templates');
    });
  });

  describe('findTemplatesPathSync', () => {
    it('should find templates synchronously', () => {
      setVirtualFile('/test/workspace/.git', '', true);
      setVirtualFile('/test/workspace/toolkit.yaml', 'templatesPath: custom-templates');
      setVirtualFile('/test/workspace/custom-templates', '', true);

      const result = TemplatesManager.findTemplatesPathSync('/test/workspace/project');

      expect(result).toContain('custom-templates');
    });

    it('should use default templates folder when toolkit.yaml does not exist', () => {
      setVirtualFile('/test/workspace/.git', '', true);
      setVirtualFile('/test/workspace/templates', '', true);

      const result = TemplatesManager.findTemplatesPathSync('/test/workspace');

      expect(result).toContain('templates');
    });
  });

  describe('isInitialized', () => {
    it('should return true when templates directory exists', async () => {
      setVirtualFile('/test/templates', '', true);

      const result = await TemplatesManager.isInitialized('/test/templates');

      expect(result).toBe(true);
    });

    it('should return false when templates path does not exist', async () => {
      const result = await TemplatesManager.isInitialized('/test/templates');

      expect(result).toBe(false);
    });

    it('should return false when path exists but is not a directory', async () => {
      setVirtualFile('/test/templates', 'file content', false);

      const result = await TemplatesManager.isInitialized('/test/templates');

      expect(result).toBe(false);
    });
  });

  describe('static getters', () => {
    it('should return scaffold config file name', () => {
      expect(TemplatesManager.getConfigFileName()).toBe('scaffold.yaml');
    });

    it('should return templates folder name', () => {
      expect(TemplatesManager.getTemplatesFolderName()).toBe('templates');
    });
  });
});
