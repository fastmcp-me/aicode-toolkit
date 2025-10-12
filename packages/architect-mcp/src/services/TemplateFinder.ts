/**
 * TemplateFinder
 *
 * DESIGN PATTERNS:
 * - Service pattern for business logic encapsulation
 * - Single responsibility principle
 * - Caching for performance optimization
 *
 * CODING STANDARDS:
 * - Use async/await for asynchronous operations
 * - Throw descriptive errors for error cases
 * - Keep methods focused and well-named
 * - Document complex logic with comments
 *
 * AVOID:
 * - Mixing concerns (keep focused on single domain)
 * - Direct tool implementation (services should be tool-agnostic)
 */

import { TemplatesManagerService, ProjectFinderService } from '@agiflowai/aicode-utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { TemplateMapping } from '../types';

export class TemplateFinder {
  private workspaceRoot: string;
  private projectFinder: ProjectFinderService;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || process.cwd();
    this.projectFinder = new ProjectFinderService(this.workspaceRoot);
  }

  /**
   * Find the template associated with a given file path
   */
  async findTemplateForFile(filePath: string): Promise<TemplateMapping | null> {
    // Normalize the file path
    const normalizedPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workspaceRoot, filePath);

    // Find the project containing this file
    const project = await this.projectFinder.findProjectForFile(normalizedPath);

    if (!project || !project.sourceTemplate) {
      return null;
    }

    // Get templates root
    const templatesRoot = await TemplatesManagerService.findTemplatesPath(this.workspaceRoot);

    // Map to template path - try to find architect.yaml
    const templatePath = path.join(templatesRoot, project.sourceTemplate);

    try {
      // Check if the architect.yaml file exists in the template directory
      await fs.access(path.join(templatePath, 'architect.yaml'));
    } catch {
      // Template not found, but that's okay - not all projects have templates
      return null;
    }

    return {
      projectPath: project.root,
      templatePath,
      projectName: project.name,
      sourceTemplate: project.sourceTemplate,
    };
  }

  /**
   * Clear the project cache
   */
  clearCache(): void {
    this.projectFinder.clearCache();
  }
}
