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

import {
  TemplatesManagerService,
  ProjectConfigResolver,
  ProjectFinderService,
  ProjectType,
} from '@agiflowai/aicode-utils';
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
   * Supports both monolith (toolkit.yaml) and monorepo (project.json) configurations
   */
  async findTemplateForFile(filePath: string): Promise<TemplateMapping | null> {
    // Normalize the file path
    const normalizedPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.workspaceRoot, filePath);

    try {
      // Use ProjectConfigResolver to support both monolith and monorepo
      const projectConfig = await ProjectConfigResolver.resolveProjectConfig(normalizedPath);

      if (!projectConfig || !projectConfig.sourceTemplate) {
        return null;
      }

      // Determine project path based on project type
      let projectPath: string;
      if (projectConfig.type === ProjectType.MONOLITH) {
        // For monolith: use workspace root
        projectPath = projectConfig.workspaceRoot || this.workspaceRoot;
      } else {
        // For monorepo: use ProjectFinderService to find project.json directory
        const project = await this.projectFinder.findProjectForFile(normalizedPath);
        projectPath = project?.root || path.dirname(normalizedPath);
      }

      // Get templates root
      const templatesRoot = await TemplatesManagerService.findTemplatesPath(this.workspaceRoot);

      // Map to template path - try to find architect.yaml
      const templatePath = path.join(templatesRoot, projectConfig.sourceTemplate);

      try {
        // Check if the architect.yaml file exists in the template directory
        await fs.access(path.join(templatePath, 'architect.yaml'));
      } catch {
        // Template not found, but that's okay - not all projects have templates
        return null;
      }

      return {
        projectPath,
        templatePath,
        projectName: path.basename(projectPath),
        sourceTemplate: projectConfig.sourceTemplate,
      };
    } catch {
      // Project config not found or error occurred
      return null;
    }
  }

  /**
   * Clear the project cache
   */
  clearCache(): void {
    this.projectFinder.clearCache();
  }
}
