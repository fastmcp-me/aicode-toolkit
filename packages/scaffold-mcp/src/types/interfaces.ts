import type {
  ArchitectConfig,
  BoilerplateOptions,
  FeatureOptions,
  ParsedInclude,
  ScaffoldResult,
  TemplateValidationResult,
} from './scaffold';

/**
 * Interface for file system operations
 */
export interface IFileSystemService {
  pathExists(path: string): Promise<boolean>;
  readFile(path: string, encoding?: BufferEncoding): Promise<string>;
  readJson(path: string): Promise<any>;
  writeFile(path: string, content: string, encoding?: BufferEncoding): Promise<void>;
  ensureDir(path: string): Promise<void>;
  copy(src: string, dest: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;
}

/**
 * Interface for template rendering
 */
export interface ITemplateService {
  renderString(template: string, variables: Record<string, any>): string;
  containsTemplateVariables(content: string): boolean;
}

// Legacy type alias for backwards compatibility
export type INunjucksService = ITemplateService;

/**
 * Interface for scaffold config loading operations
 */
export interface IScaffoldConfigLoader {
  parseArchitectConfig(templatePath: string): Promise<ArchitectConfig | null>;
  parseIncludeEntry(includeEntry: string, variables: Record<string, any>): ParsedInclude;
  replaceVariablesInPath(pathStr: string, variables: Record<string, any>): string;
  shouldIncludeFile(
    conditions: Record<string, string> | undefined,
    variables: Record<string, any>,
  ): boolean;
  validateTemplate(templatePath: string, scaffoldType: string): Promise<TemplateValidationResult>;
}

/**
 * Interface for variable replacement in files
 */
export interface IVariableReplacementService {
  processFilesForVariableReplacement(
    dirPath: string,
    variables: Record<string, any>,
  ): Promise<void>;
  replaceVariablesInFile(filePath: string, variables: Record<string, any>): Promise<void>;
  isBinaryFile(filePath: string): boolean;
}

/**
 * Main scaffold service interface
 */
export interface IScaffoldService {
  useBoilerplate(options: BoilerplateOptions): Promise<ScaffoldResult>;
  useFeature(options: FeatureOptions): Promise<ScaffoldResult>;
}

// Legacy type alias for backwards compatibility
export type ITemplateParserService = IScaffoldConfigLoader;
