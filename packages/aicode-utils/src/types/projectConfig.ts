import type { ConfigSource, ProjectType } from '../constants/projectType';

/**
 * Result of project config resolution
 */
export interface ProjectConfigResult {
  type: ProjectType;
  sourceTemplate: string;
  configSource: ConfigSource;
  workspaceRoot?: string;
}

/**
 * Nx project.json configuration
 */
export interface NxProjectJson {
  name: string;
  $schema?: string;
  sourceRoot?: string;
  projectType?: 'application' | 'library';
  sourceTemplate?: string;
  targets?: Record<string, unknown>;
  tags?: string[];
  [key: string]: unknown; // Allow additional properties
}
