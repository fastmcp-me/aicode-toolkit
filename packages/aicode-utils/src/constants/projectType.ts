/**
 * Project type constants
 */
export const ProjectType = {
  MONOLITH: 'monolith',
  MONOREPO: 'monorepo',
} as const;

export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

/**
 * Config source constants
 */
export const ConfigSource = {
  PROJECT_JSON: 'project.json',
  TOOLKIT_YAML: 'toolkit.yaml',
} as const;

export type ConfigSource = (typeof ConfigSource)[keyof typeof ConfigSource];
