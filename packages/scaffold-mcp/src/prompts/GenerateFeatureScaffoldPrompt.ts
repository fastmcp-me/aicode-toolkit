import generateFeatureScaffoldTemplate from '../instructions/prompts/generate-feature-scaffold.md?raw';
import { TemplateService } from '../services/TemplateService';
import type { PromptDefinition, PromptMessage } from './types';

/**
 * Prompt for generating feature scaffolds
 */
export class GenerateFeatureScaffoldPrompt {
  static readonly PROMPT_NAME = 'generate-feature-scaffold';
  private templateService = new TemplateService();

  constructor(private isMonolith = false) {}

  /**
   * Get the prompt definition for MCP
   */
  getDefinition(): PromptDefinition {
    return {
      name: GenerateFeatureScaffoldPrompt.PROMPT_NAME,
      description: 'Generate a new feature scaffold configuration',
      arguments: [
        {
          name: 'request',
          description: 'Describe the feature scaffold you want to create',
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

    const text = this.templateService.renderString(generateFeatureScaffoldTemplate, {
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
