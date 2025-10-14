import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UseBoilerplateTool } from '../../src/tools/UseBoilerplateTool';

// Mock the service
vi.mock('../../src/services/BoilerplateService');

describe('UseBoilerplateTool', () => {
  let tool: UseBoilerplateTool;
  const templatesPath = '/test/templates';

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new UseBoilerplateTool(templatesPath);
  });

  describe('getDefinition', () => {
    it('should return tool definition with correct schema', () => {
      const definition = tool.getDefinition();

      expect(definition.name).toBe('use-boilerplate');
      expect(definition.description).toBeTruthy();
      expect(definition.inputSchema.type).toBe('object');
      expect(definition.inputSchema.required).toContain('boilerplateName');
      expect(definition.inputSchema.required).toContain('variables');
    });

    it('should include variables object in schema', () => {
      const definition = tool.getDefinition();

      expect(definition.inputSchema.properties.boilerplateName).toBeDefined();
      expect(definition.inputSchema.properties.variables).toBeDefined();
      expect(definition.inputSchema.properties.variables.type).toBe('object');
    });
  });

  describe('execute', () => {
    it('should execute successfully with valid arguments', async () => {
      const args = {
        boilerplateName: 'scaffold-nextjs-app',
        variables: {
          appName: 'my-app',
          description: 'My test app',
        },
      };

      const spy = vi.spyOn(tool.boilerplateService, 'useBoilerplate');
      spy.mockResolvedValue({
        success: true,
        message: 'Successfully scaffolded boilerplate at /path/to/project',
        projectPath: '/path/to/project',
      });

      const result = await tool.execute(args);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Successfully scaffolded');
      expect(spy).toHaveBeenCalledWith({
        boilerplateName: 'scaffold-nextjs-app',
        variables: { appName: 'my-app', description: 'My test app' },
        targetFolderOverride: undefined,
        monolith: false,
      });
    });

    it('should handle service errors gracefully', async () => {
      const args = {
        boilerplateName: 'scaffold-test-app',
        variables: { appName: 'test' },
      };

      const spy = vi.spyOn(tool.boilerplateService, 'useBoilerplate');
      spy.mockRejectedValue(new Error('Boilerplate not found'));

      const result = await tool.execute(args);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Boilerplate not found');
    });
  });
});
