import { describe, expect, it } from 'vitest';
import { ScaffoldApplicationPrompt } from '../../src/prompts/ScaffoldApplicationPrompt';

describe('ScaffoldApplicationPrompt', () => {
  let prompt: ScaffoldApplicationPrompt;

  beforeEach(() => {
    prompt = new ScaffoldApplicationPrompt();
  });

  describe('getDefinition', () => {
    it('should return prompt definition', () => {
      const definition = prompt.getDefinition();

      expect(definition.name).toBe('scaffold-application');
      expect(definition.description).toBeTruthy();
      expect(definition.arguments).toBeDefined();
    });

    it('should have optional request argument', () => {
      const definition = prompt.getDefinition();

      expect(definition.arguments).toHaveLength(1);
      expect(definition.arguments?.[0].name).toBe('request');
      expect(definition.arguments?.[0].required).toBe(false);
    });
  });

  describe('getMessages', () => {
    it('should return messages array', () => {
      const messages = prompt.getMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content.type).toBe('text');
    });

    it('should include user request when provided', () => {
      const messages = prompt.getMessages({ request: 'Create a Next.js dashboard app' });

      expect(messages[0].content.text).toContain('Create a Next.js dashboard app');
    });

    it('should work without user request', () => {
      const messages = prompt.getMessages();

      expect(messages[0].content.text).toBeTruthy();
    });

    it('should include workflow instructions', () => {
      const messages = prompt.getMessages();

      expect(messages[0].content.text).toContain('list-boilerplates');
      expect(messages[0].content.text).toContain('use-boilerplate');
    });

    it('should include guidelines for variables', () => {
      const messages = prompt.getMessages();

      expect(messages[0].content.text).toContain('variables_schema');
      expect(messages[0].content.text).toContain('kebab-case');
    });

    it('should include example workflow', () => {
      const messages = prompt.getMessages();

      expect(messages[0].content.text).toContain('Example');
      expect(messages[0].content.text).toContain('boilerplateName');
    });
  });
});
