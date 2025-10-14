import generateBoilerplateTemplate from '../instructions/prompts/generate-boilerplate.md?raw';
import { TemplateService } from '../services/TemplateService';
import type { PromptDefinition, PromptMessage } from './types';

/**
 * Prompt for generating boilerplates
 */
export class GenerateBoilerplatePrompt {
  static readonly PROMPT_NAME = 'generate-boilerplate';
  private templateService = new TemplateService();

  constructor(private isMonolith = false) {}

  /**
   * Get the prompt definition for MCP
   */
  getDefinition(): PromptDefinition {
    return {
      name: GenerateBoilerplatePrompt.PROMPT_NAME,
      description: 'Generate a new boilerplate template configuration',
      arguments: [
        {
          name: 'request',
          description: 'Describe the boilerplate template you want to create',
          required: false,
        },
      ],
    };
  }

  /**
   * Get the prompt messages
   */
  getMessages(args?: { request?: string }): PromptMessage[] {
    const request = args?.request || '';

    const text = this.templateService.renderString(generateBoilerplateTemplate, {
      request,
      isMonolith: this.isMonolith,
    });

    return [
      {
        role: 'user',
        content: {
          type: 'text',
          text,
        },
      },
    ];
  }
}
