import type { JsonSchema } from '@composio/json-schema-to-zod';

export interface BoilerplateConfig {
  name: string;
  description: string;
  instruction: string;
  variables_schema: JsonSchema;
  includes: string[];
  targetFolder: string;
}

export interface FeatureConfig {
  name: string;
  generator: string;
  instruction: string;
  variables_schema: JsonSchema;
  includes: string[];
}

export interface ScaffoldYamlConfig {
  boilerplate?: BoilerplateConfig[];
  feature?: FeatureConfig[];
}

export interface BoilerplateInfo {
  name: string;
  description: string;
  instruction: string;
  variables_schema: JsonSchema;
  template_path: string;
  target_folder: string;
  includes: string[];
}

export interface UseBoilerplateRequest {
  boilerplateName: string;
  variables: Record<string, any>;
  monolith?: boolean; // If true, create at workspace root with toolkit.yaml
  targetFolderOverride?: string; // Optional override for target folder
}

export interface ListBoilerplateResponse {
  boilerplates: BoilerplateInfo[];
}
