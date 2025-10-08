import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScaffoldProcessingService } from '../../src/services/ScaffoldProcessingService';
import type { IFileSystemService, IVariableReplacementService } from '../../src/types';

describe('ScaffoldProcessingService', () => {
  let service: ScaffoldProcessingService;
  let mockFileSystem: IFileSystemService;
  let mockVariableReplacer: IVariableReplacementService;

  beforeEach(() => {
    // Create mock implementations
    mockFileSystem = {
      pathExists: vi.fn(),
      readFile: vi.fn(),
      readJson: vi.fn(),
      writeFile: vi.fn(),
      ensureDir: vi.fn(),
      copy: vi.fn(),
      readdir: vi.fn(),
      stat: vi.fn(),
    };

    mockVariableReplacer = {
      processFilesForVariableReplacement: vi.fn(),
      replaceVariablesInFile: vi.fn(),
      isBinaryFile: vi.fn(),
    };

    service = new ScaffoldProcessingService(mockFileSystem, mockVariableReplacer);
  });

  describe('processTargetForVariableReplacement', () => {
    it('should process directory recursively', async () => {
      const targetPath = '/test/dir';
      const variables = { name: 'test' };

      vi.mocked(mockFileSystem.stat).mockResolvedValue({
        isDirectory: () => true,
        isFile: () => false,
      });

      await service.processTargetForVariableReplacement(targetPath, variables);

      expect(mockFileSystem.stat).toHaveBeenCalledWith(targetPath);
      expect(mockVariableReplacer.processFilesForVariableReplacement).toHaveBeenCalledWith(
        targetPath,
        variables,
      );
    });

    it('should process single file', async () => {
      const targetPath = '/test/file.ts';
      const variables = { name: 'test' };

      vi.mocked(mockFileSystem.stat).mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      });

      await service.processTargetForVariableReplacement(targetPath, variables);

      expect(mockFileSystem.stat).toHaveBeenCalledWith(targetPath);
      expect(mockVariableReplacer.replaceVariablesInFile).toHaveBeenCalledWith(
        targetPath,
        variables,
      );
    });
  });

  describe('trackCreatedFiles', () => {
    it('should track single file', async () => {
      const targetPath = '/test/file.ts';
      const createdFiles: string[] = [];

      vi.mocked(mockFileSystem.stat).mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      });

      await service.trackCreatedFiles(targetPath, createdFiles);

      expect(createdFiles).toContain(targetPath);
    });

    it('should track directory files recursively', async () => {
      const targetPath = '/test/dir';
      const createdFiles: string[] = [];

      vi.mocked(mockFileSystem.stat)
        .mockResolvedValueOnce({
          isDirectory: () => true,
          isFile: () => false,
        })
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        })
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        });

      vi.mocked(mockFileSystem.readdir).mockResolvedValue(['file1.ts', 'file2.ts']);

      await service.trackCreatedFiles(targetPath, createdFiles);

      expect(mockFileSystem.readdir).toHaveBeenCalledWith(targetPath);
      expect(createdFiles).toHaveLength(2);
    });
  });

  describe('trackExistingFiles', () => {
    it('should track single existing file', async () => {
      const targetPath = '/test/existing.ts';
      const existingFiles: string[] = [];

      vi.mocked(mockFileSystem.stat).mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      });

      await service.trackExistingFiles(targetPath, existingFiles);

      expect(existingFiles).toContain(targetPath);
    });

    it('should track existing directory files recursively', async () => {
      const targetPath = '/test/dir';
      const existingFiles: string[] = [];

      vi.mocked(mockFileSystem.stat)
        .mockResolvedValueOnce({
          isDirectory: () => true,
          isFile: () => false,
        })
        .mockResolvedValueOnce({
          isDirectory: () => false,
          isFile: () => true,
        });

      vi.mocked(mockFileSystem.readdir).mockResolvedValue(['existing.ts']);

      await service.trackExistingFiles(targetPath, existingFiles);

      expect(existingFiles).toHaveLength(1);
    });
  });

  describe('copyAndProcess', () => {
    it('should copy, process, and track new file', async () => {
      const sourcePath = '/source/file.ts';
      const targetPath = '/target/file.ts';
      const variables = { name: 'test' };
      const createdFiles: string[] = [];

      vi.mocked(mockFileSystem.pathExists).mockResolvedValue(false);
      vi.mocked(mockFileSystem.stat).mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      });

      await service.copyAndProcess(sourcePath, targetPath, variables, createdFiles);

      expect(mockFileSystem.ensureDir).toHaveBeenCalled();
      expect(mockFileSystem.copy).toHaveBeenCalledWith(sourcePath, targetPath);
      expect(mockVariableReplacer.replaceVariablesInFile).toHaveBeenCalledWith(
        targetPath,
        variables,
      );
      expect(createdFiles).toContain(targetPath);
    });

    it('should skip existing file and track as existing', async () => {
      const sourcePath = '/source/file.ts';
      const targetPath = '/target/file.ts';
      const variables = { name: 'test' };
      const createdFiles: string[] = [];
      const existingFiles: string[] = [];

      vi.mocked(mockFileSystem.pathExists).mockResolvedValue(true);
      vi.mocked(mockFileSystem.stat).mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      });

      await service.copyAndProcess(sourcePath, targetPath, variables, createdFiles, existingFiles);

      expect(mockFileSystem.copy).not.toHaveBeenCalled();
      expect(existingFiles).toContain(targetPath);
      expect(createdFiles).toHaveLength(0);
    });

    it('should overwrite existing file when existingFiles is not provided', async () => {
      const sourcePath = '/source/file.ts';
      const targetPath = '/target/file.ts';
      const variables = { name: 'test' };
      const createdFiles: string[] = [];

      vi.mocked(mockFileSystem.pathExists).mockResolvedValue(true);
      vi.mocked(mockFileSystem.stat).mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      });

      await service.copyAndProcess(sourcePath, targetPath, variables, createdFiles);

      expect(mockFileSystem.copy).toHaveBeenCalledWith(sourcePath, targetPath);
      expect(createdFiles).toContain(targetPath);
    });
  });
});
