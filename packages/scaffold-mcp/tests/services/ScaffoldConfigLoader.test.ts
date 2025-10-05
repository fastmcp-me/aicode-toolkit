import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScaffoldConfigLoader } from '../../src/services/ScaffoldConfigLoader';
import { createMockFileSystemService, createMockTemplateService } from '../__mocks__';

describe('ScaffoldConfigLoader', () => {
  let loader: ScaffoldConfigLoader;
  let mockFileSystem: ReturnType<typeof createMockFileSystemService>;
  let mockTemplate: ReturnType<typeof createMockTemplateService>;

  beforeEach(() => {
    mockFileSystem = createMockFileSystemService();
    mockTemplate = createMockTemplateService();
    loader = new ScaffoldConfigLoader(mockFileSystem, mockTemplate);
  });

  describe('parseIncludeEntry', () => {
    it('should parse basic file path', () => {
      const result = loader.parseIncludeEntry('src/index.ts', {});

      expect(result.sourcePath).toBe('src/index.ts');
      expect(result.targetPath).toBe('src/index.ts');
      expect(result.conditions).toEqual({});
    });

    it('should parse conditional includes', () => {
      const result = loader.parseIncludeEntry('layout.tsx?withLayout=true', { withLayout: true });

      expect(result.sourcePath).toBe('layout.tsx');
      expect(result.conditions).toEqual({ withLayout: 'true' });
    });

    it('should parse multiple conditions', () => {
      const result = loader.parseIncludeEntry('test.tsx?withTests=true&withDocs=false', {});

      expect(result.conditions).toEqual({
        withTests: 'true',
        withDocs: 'false',
      });
    });

    it('should parse arrow syntax for path mapping', () => {
      const result = loader.parseIncludeEntry('template.tsx->src/app/page.tsx', {});

      expect(result.sourcePath).toBe('template.tsx');
      expect(result.targetPath).toBe('src/app/page.tsx');
    });

    it('should combine arrow syntax with conditions', () => {
      const result = loader.parseIncludeEntry('template.tsx->{{ path }}/page.tsx?withPage=true', {
        path: 'custom',
      });

      expect(result.sourcePath).toBe('template.tsx');
      expect(result.conditions).toEqual({ withPage: 'true' });
    });
  });

  describe('shouldIncludeFile', () => {
    it('should return true when no conditions', () => {
      const result = loader.shouldIncludeFile(undefined, {});

      expect(result).toBe(true);
    });

    it('should return true when boolean condition matches', () => {
      const result = loader.shouldIncludeFile({ withLayout: 'true' }, { withLayout: true });

      expect(result).toBe(true);
    });

    it('should return false when boolean condition does not match', () => {
      const result = loader.shouldIncludeFile({ withLayout: 'true' }, { withLayout: false });

      expect(result).toBe(false);
    });

    it('should return true when string condition matches', () => {
      const result = loader.shouldIncludeFile({ type: 'component' }, { type: 'component' });

      expect(result).toBe(true);
    });

    it('should return false when string condition does not match', () => {
      const result = loader.shouldIncludeFile({ type: 'component' }, { type: 'page' });

      expect(result).toBe(false);
    });

    it('should handle multiple conditions', () => {
      const result = loader.shouldIncludeFile(
        { withTests: 'true', type: 'service' },
        { withTests: true, type: 'service' },
      );

      expect(result).toBe(true);
    });
  });

  describe('replaceVariablesInPath', () => {
    it('should replace variables in path', () => {
      mockTemplate.renderString.mockReturnValue('src/app/dashboard/page.tsx');

      const _result = loader.replaceVariablesInPath('src/app/{{ pagePath }}/page.tsx', {
        pagePath: 'dashboard',
      });

      expect(mockTemplate.renderString).toHaveBeenCalled();
    });
  });

  describe('validateTemplate', () => {
    it('should return valid for existing template with all files', async () => {
      mockFileSystem.pathExists.mockResolvedValue(true);

      // Mock parseArchitectConfig to return a valid config
      const parseArchitectConfigSpy = vi.spyOn(loader as any, 'parseArchitectConfig');
      parseArchitectConfigSpy.mockResolvedValue({
        boilerplate: {
          name: 'test',
          includes: ['package.json', 'src/index.ts'],
        },
      });

      const result = await loader.validateTemplate('/templates/test', 'boilerplate');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for non-existent template', async () => {
      mockFileSystem.pathExists.mockResolvedValue(false);

      const result = await loader.validateTemplate('/nonexistent', 'boilerplate');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing template files', async () => {
      mockFileSystem.pathExists
        .mockResolvedValueOnce(true) // Template dir exists
        .mockResolvedValueOnce(false) // First file missing
        .mockResolvedValueOnce(false); // .liquid version also missing

      // Mock parseArchitectConfig to return a config with a missing file
      const parseArchitectConfigSpy = vi.spyOn(loader as any, 'parseArchitectConfig');
      parseArchitectConfigSpy.mockResolvedValue({
        boilerplate: {
          name: 'test',
          includes: ['missing-file.ts'],
        },
      });

      const result = await loader.validateTemplate('/templates/test', 'boilerplate');

      expect(result.isValid).toBe(false);
      expect(result.missingFiles.length).toBeGreaterThan(0);
    });
  });
});
