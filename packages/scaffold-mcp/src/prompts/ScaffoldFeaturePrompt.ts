import scaffoldFeatureTemplate from '../instructions/prompts/scaffold-feature.md?raw';
import { TemplateService } from '../services/TemplateService';
import type { PromptDefinition, PromptMessage } from './types';

/**
 * Prompt for scaffolding a new feature in an existing project
 */
export class ScaffoldFeaturePrompt {
  static readonly PROMPT_NAME = 'scaffold-feature';
  private templateService = new TemplateService();

  constructor(private isMonolith = false) {}

  /**
   * Get the prompt definition for MCP
   */
  getDefinition(): PromptDefinition {
    return {
      name: ScaffoldFeaturePrompt.PROMPT_NAME,
      description: 'Scaffold a new feature (page, component, service, etc.) in an existing project',
      arguments: [
        {
          name: 'request',
          description: 'Describe the feature you want to add (optional)',
          required: false,
        },
        {
          name: 'projectPath',
          description: 'Path to the project (e.g., "apps/my-app") - optional if can be inferred',
          required: false,
        },
      ],
    };
  }

  /**
   * Get the prompt messages
   */
  getMessages(args?: { request?: string; projectPath?: string }): PromptMessage[] {
    const request = args?.request || '';
    const projectPath = args?.projectPath || '';

    const text = this.templateService.renderString(scaffoldFeatureTemplate, {
      request,
      projectPath,
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
