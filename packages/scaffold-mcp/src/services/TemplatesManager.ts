import path from 'node:path';
import * as fs from 'fs-extra';

export class TemplatesManager {
  private static SCAFFOLD_CONFIG_FILE = 'scaffold.yaml';
  private static TEMPLATES_FOLDER = 'templates';
  private static TOOLKIT_CONFIG_FILE = 'toolkit.yaml';

  /**
   * Find the templates directory by searching upwards from the starting path.
   *
   * Algorithm:
   * 1. Start from the provided path (default: current working directory)
   * 2. Search upwards to find the workspace root (where .git exists or filesystem root)
   * 3. Check if toolkit.yaml exists at workspace root
   *    - If yes, read templatesPath from toolkit.yaml
   *    - If no, default to 'templates' folder in workspace root
   * 4. Verify the templates directory exists
   *
   * @param startPath - The path to start searching from (defaults to process.cwd())
   * @returns The absolute path to the templates directory
   * @throws Error if templates directory is not found
   */
  static async findTemplatesPath(startPath: string = process.cwd()): Promise<string> {
    // First, find the workspace root
    const workspaceRoot = await TemplatesManager.findWorkspaceRoot(startPath);

    // Check if toolkit.yaml exists
    const toolkitConfigPath = path.join(workspaceRoot, TemplatesManager.TOOLKIT_CONFIG_FILE);

    if (await fs.pathExists(toolkitConfigPath)) {
      // Read toolkit.yaml to get templatesPath
      const yaml = await import('js-yaml');
      const content = await fs.readFile(toolkitConfigPath, 'utf-8');
      const config = yaml.load(content) as any;

      if (config?.templatesPath) {
        const templatesPath = path.isAbsolute(config.templatesPath)
          ? config.templatesPath
          : path.join(workspaceRoot, config.templatesPath);

        if (await fs.pathExists(templatesPath)) {
          return templatesPath;
        } else {
          throw new Error(
            `Templates path specified in toolkit.yaml does not exist: ${templatesPath}`,
          );
        }
      }
    }

    // Default to templates folder in workspace root
    const templatesPath = path.join(workspaceRoot, TemplatesManager.TEMPLATES_FOLDER);

    if (await fs.pathExists(templatesPath)) {
      return templatesPath;
    }

    throw new Error(
      `Templates folder not found at ${templatesPath}.\n` +
        `Either create a 'templates' folder or specify templatesPath in toolkit.yaml`,
    );
  }

  /**
   * Find the workspace root by searching upwards for .git folder
   */
  private static async findWorkspaceRoot(startPath: string): Promise<string> {
    let currentPath = path.resolve(startPath);
    const rootPath = path.parse(currentPath).root;

    while (true) {
      // Check if .git folder exists (repository root)
      const gitPath = path.join(currentPath, '.git');
      if (await fs.pathExists(gitPath)) {
        return currentPath;
      }

      // Check if we've reached the filesystem root
      if (currentPath === rootPath) {
        // No .git found, return current working directory as workspace root
        return process.cwd();
      }

      // Move up to parent directory
      currentPath = path.dirname(currentPath);
    }
  }

  /**
   * Get the templates path synchronously.
   * Use this when you need immediate access and are sure templates exist.
   *
   * @param startPath - The path to start searching from (defaults to process.cwd())
   * @returns The absolute path to the templates directory
   * @throws Error if templates directory is not found
   */
  static findTemplatesPathSync(startPath: string = process.cwd()): string {
    // First, find the workspace root
    const workspaceRoot = TemplatesManager.findWorkspaceRootSync(startPath);

    // Check if toolkit.yaml exists
    const toolkitConfigPath = path.join(workspaceRoot, TemplatesManager.TOOLKIT_CONFIG_FILE);

    if (fs.pathExistsSync(toolkitConfigPath)) {
      // Read toolkit.yaml to get templatesPath
      const yaml = require('js-yaml');
      const content = fs.readFileSync(toolkitConfigPath, 'utf-8');
      const config = yaml.load(content) as any;

      if (config?.templatesPath) {
        const templatesPath = path.isAbsolute(config.templatesPath)
          ? config.templatesPath
          : path.join(workspaceRoot, config.templatesPath);

        if (fs.pathExistsSync(templatesPath)) {
          return templatesPath;
        } else {
          throw new Error(
            `Templates path specified in toolkit.yaml does not exist: ${templatesPath}`,
          );
        }
      }
    }

    // Default to templates folder in workspace root
    const templatesPath = path.join(workspaceRoot, TemplatesManager.TEMPLATES_FOLDER);

    if (fs.pathExistsSync(templatesPath)) {
      return templatesPath;
    }

    throw new Error(
      `Templates folder not found at ${templatesPath}.\n` +
        `Either create a 'templates' folder or specify templatesPath in toolkit.yaml`,
    );
  }

  /**
   * Find the workspace root synchronously by searching upwards for .git folder
   */
  private static findWorkspaceRootSync(startPath: string): string {
    let currentPath = path.resolve(startPath);
    const rootPath = path.parse(currentPath).root;

    while (true) {
      // Check if .git folder exists (repository root)
      const gitPath = path.join(currentPath, '.git');
      if (fs.pathExistsSync(gitPath)) {
        return currentPath;
      }

      // Check if we've reached the filesystem root
      if (currentPath === rootPath) {
        // No .git found, return current working directory as workspace root
        return process.cwd();
      }

      // Move up to parent directory
      currentPath = path.dirname(currentPath);
    }
  }

  /**
   * Check if templates are initialized at the given path
   *
   * @param templatesPath - Path to check for templates
   * @returns true if templates folder exists and is a directory
   */
  static async isInitialized(templatesPath: string): Promise<boolean> {
    if (!(await fs.pathExists(templatesPath))) {
      return false;
    }
    const stat = await fs.stat(templatesPath);
    return stat.isDirectory();
  }

  /**
   * Get the scaffold config file name
   */
  static getConfigFileName(): string {
    return TemplatesManager.SCAFFOLD_CONFIG_FILE;
  }

  /**
   * Get the templates folder name
   */
  static getTemplatesFolderName(): string {
    return TemplatesManager.TEMPLATES_FOLDER;
  }
}
