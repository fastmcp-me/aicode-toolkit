import scaffoldApplicationTemplate from '../instructions/prompts/scaffold-application.md?raw';
import { TemplateService } from '../services/TemplateService';
import type { PromptDefinition, PromptMessage } from './types';

/**
 * Prompt for scaffolding a new application using boilerplate templates
 */
export class ScaffoldApplicationPrompt {
  static readonly PROMPT_NAME = 'scaffold-application';
  private templateService = new TemplateService();

  constructor(private isMonolith = false) {}

  /**
   * Get the prompt definition for MCP
   */
  getDefinition(): PromptDefinition {
    return {
      name: ScaffoldApplicationPrompt.PROMPT_NAME,
      description: 'Scaffold a new application from a boilerplate template',
      arguments: [
        {
          name: 'request',
          description: 'Describe the application you want to create (optional)',
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

    const text = this.templateService.renderString(scaffoldApplicationTemplate, {
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
