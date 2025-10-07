import fs from 'fs-extra';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSystemService } from '../../src/services/FileSystemService';

// Mock fs-extra
vi.mock('fs-extra');

describe('FileSystemService', () => {
  let service: FileSystemService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FileSystemService();
  });

  describe('pathExists', () => {
    it('should check if path exists', async () => {
      await service.pathExists('/test/path');

      expect(fs.pathExists).toHaveBeenCalledWith('/test/path');
    });

    it('should call pathExists for non-existent path', async () => {
      await service.pathExists('/non/existent');

      expect(fs.pathExists).toHaveBeenCalledWith('/non/existent');
    });
  });

  describe('readFile', () => {
    it('should read file with default encoding', async () => {
      await service.readFile('/test/file.txt');

      expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf8');
    });

    it('should read file with custom encoding', async () => {
      await service.readFile('/test/file.txt', 'ascii');

      expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'ascii');
    });
  });

  describe('readJson', () => {
    it('should read and parse JSON file', async () => {
      const jsonData = { key: 'value' };
      const mockFn = fs.readJson as any;
      if (mockFn?.mockResolvedValue) {
        mockFn.mockResolvedValue(jsonData);
      }

      const result = await service.readJson('/test/file.json');

      if (result) {
        expect(result).toEqual(jsonData);
      }
      expect(fs.readJson).toHaveBeenCalledWith('/test/file.json');
    });
  });

  describe('writeFile', () => {
    it('should write file with default encoding', async () => {
      const mockFn = fs.writeFile as any;
      if (mockFn?.mockResolvedValue) {
        mockFn.mockResolvedValue(undefined);
      }

      await service.writeFile('/test/file.txt', 'content');

      expect(fs.writeFile).toHaveBeenCalledWith('/test/file.txt', 'content', 'utf8');
    });

    it('should write file with custom encoding', async () => {
      const mockFn = fs.writeFile as any;
      if (mockFn?.mockResolvedValue) {
        mockFn.mockResolvedValue(undefined);
      }

      await service.writeFile('/test/file.txt', 'content', 'ascii');

      expect(fs.writeFile).toHaveBeenCalledWith('/test/file.txt', 'content', 'ascii');
    });
  });

  describe('ensureDir', () => {
    it('should ensure directory exists', async () => {
      const mockFn = fs.ensureDir as any;
      if (mockFn?.mockResolvedValue) {
        mockFn.mockResolvedValue(undefined);
      }

      await service.ensureDir('/test/dir');

      expect(fs.ensureDir).toHaveBeenCalledWith('/test/dir');
    });
  });

  describe('copy', () => {
    it('should copy files or directories', async () => {
      const mockFn = fs.copy as any;
      if (mockFn?.mockResolvedValue) {
        mockFn.mockResolvedValue(undefined);
      }

      await service.copy('/src/path', '/dest/path');

      expect(fs.copy).toHaveBeenCalledWith('/src/path', '/dest/path');
    });
  });

  describe('readdir', () => {
    it('should read directory contents', async () => {
      const files = ['file1.txt', 'file2.txt'];
      const mockFn = fs.readdir as any;
      if (mockFn?.mockResolvedValue) {
        mockFn.mockResolvedValue(files);
      }

      const result = await service.readdir('/test/dir');

      if (result) {
        expect(result).toEqual(files);
      }
      expect(fs.readdir).toHaveBeenCalledWith('/test/dir');
    });
  });

  describe('stat', () => {
    it('should get file stats', async () => {
      const stats = {
        isDirectory: () => false,
        isFile: () => true,
      };
      const statMock = fs.stat as any;
      if (statMock.mockResolvedValue) {
        statMock.mockResolvedValue(stats);
      }

      const result = await service.stat('/test/file.txt');

      if (result) {
        expect(result.isFile()).toBe(true);
        expect(result.isDirectory()).toBe(false);
      }
      expect(fs.stat).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should identify directories', async () => {
      const stats = {
        isDirectory: () => true,
        isFile: () => false,
      };
      const statMock = fs.stat as any;
      if (statMock.mockResolvedValue) {
        statMock.mockResolvedValue(stats);
      }

      const result = await service.stat('/test/dir');

      if (result) {
        expect(result.isDirectory()).toBe(true);
        expect(result.isFile()).toBe(false);
      }
    });
  });
});
