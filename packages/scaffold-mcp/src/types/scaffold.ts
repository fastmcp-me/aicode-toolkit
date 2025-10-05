export interface BoilerplateOptions {
  projectName: string;
  packageName: string;
  targetFolder: string;
  templateFolder: string;
  boilerplateName: string;
  variables?: Record<string, any>;
}

export interface FeatureOptions {
  projectPath: string;
  templateFolder: string;
  featureName: string;
  variables?: Record<string, any>;
}

export interface ArchitectConfig {
  [key: string]: {
    name: string;
    description: string;
    variables_schema: {
      type: string;
      properties: Record<string, any>;
      required: string[];
      additionalProperties: boolean;
    };
    includes: string[];
    generator?: string;
  };
}

export interface ParsedInclude {
  sourcePath: string;
  targetPath: string;
  conditions?: Record<string, string>;
}

export interface ScaffoldResult {
  success: boolean;
  message: string;
  warnings?: string[];
  createdFiles?: string[];
  existingFiles?: string[];
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  missingFiles: string[];
}

export interface GeneratorContext {
  variables: Record<string, any>;
  config: ArchitectConfig[string];
  targetPath: string;
  templatePath: string;
  fileSystem: import('./interfaces').IFileSystemService;
  scaffoldConfigLoader: import('./interfaces').IScaffoldConfigLoader;
  variableReplacer: import('./interfaces').IVariableReplacementService;
}

export type GeneratorFunction = (context: GeneratorContext) => Promise<ScaffoldResult>;
