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

export interface IVariableReplacementService {
  processFilesForVariableReplacement(
    dirPath: string,
    variables: Record<string, any>,
  ): Promise<void>;
  replaceVariablesInFile(filePath: string, variables: Record<string, any>): Promise<void>;
  isBinaryFile(filePath: string): boolean;
}

export interface GeneratorContext {
  variables: Record<string, any>;
  config: any;
  targetPath: string;
  templatePath: string;
  fileSystem: IFileSystemService;
  scaffoldConfigLoader: any;
  variableReplacer: IVariableReplacementService;
  // Utility classes and functions passed to avoid import issues
  ScaffoldProcessingService: any; // Constructor for ScaffoldProcessingService
  getRootPath: () => string;
  getProjectPath: (projectPath: string) => string;
}

export type GeneratorFunction = (context: GeneratorContext) => Promise<ScaffoldResult>;
