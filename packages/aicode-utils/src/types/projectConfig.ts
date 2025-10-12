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
