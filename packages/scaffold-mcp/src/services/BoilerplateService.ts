import * as path from 'node:path';
import { jsonSchemaToZod } from '@composio/json-schema-to-zod';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import type {
  BoilerplateInfo,
  ListBoilerplateResponse,
  ScaffoldYamlConfig,
  UseBoilerplateRequest,
} from '../types/boilerplateTypes';
import type { ScaffoldResult } from '../types/scaffold';
import { FileSystemService } from './FileSystemService';
import { ScaffoldConfigLoader } from './ScaffoldConfigLoader';
import { ScaffoldService } from './ScaffoldService';
import { TemplateService } from './TemplateService';
import { VariableReplacementService } from './VariableReplacementService';

export class BoilerplateService {
  private templatesPath: string;
  private templateService: TemplateService;
  private scaffoldService: ScaffoldService;

  constructor(templatesPath: string) {
    this.templatesPath = templatesPath;
    this.templateService = new TemplateService();

    // Set up ScaffoldService dependencies
    const fileSystemService = new FileSystemService();
    const scaffoldConfigLoader = new ScaffoldConfigLoader(fileSystemService, this.templateService);
    const variableReplacementService = new VariableReplacementService(
      fileSystemService,
      this.templateService,
    );

    this.scaffoldService = new ScaffoldService(
      fileSystemService,
      scaffoldConfigLoader,
      variableReplacementService,
      templatesPath,
    );
  }

  /**
   * Scans all scaffold.yaml files and returns available boilerplates
   */
  async listBoilerplates(): Promise<ListBoilerplateResponse> {
    const boilerplates: BoilerplateInfo[] = [];

    // Dynamically discover all template directories
    const templateDirs = await this.discoverTemplateDirectories();

    for (const templatePath of templateDirs) {
      const scaffoldYamlPath = path.join(this.templatesPath, templatePath, 'scaffold.yaml');

      if (fs.existsSync(scaffoldYamlPath)) {
        try {
          const scaffoldContent = fs.readFileSync(scaffoldYamlPath, 'utf8');
          const scaffoldConfig = yaml.load(scaffoldContent) as ScaffoldYamlConfig;

          // Extract boilerplate configurations
          if (scaffoldConfig.boilerplate) {
            for (const boilerplate of scaffoldConfig.boilerplate) {
              // targetFolder must be specified in scaffold.yaml
              if (!boilerplate.targetFolder) {
                console.warn(
                  `Skipping boilerplate '${boilerplate.name}' in ${templatePath}: ` +
                    `targetFolder is required in scaffold.yaml`,
                );
                continue;
              }

              boilerplates.push({
                name: boilerplate.name,
                description: boilerplate.description,
                instruction: boilerplate.instruction,
                variables_schema: boilerplate.variables_schema,
                template_path: templatePath,
                target_folder: boilerplate.targetFolder,
                includes: boilerplate.includes,
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to load scaffold.yaml for ${templatePath}:`, error);
        }
      }
    }

    return { boilerplates };
  }

  /**
   * Dynamically discovers template directories by finding all directories
   * that contain both package.json and scaffold.yaml files
   */
  private async discoverTemplateDirectories(): Promise<string[]> {
    const templateDirs: string[] = [];

    // Recursively find all directories with package.json
    const findTemplates = (dir: string, baseDir: string = ''): void => {
      if (!fs.existsSync(dir)) {
        return;
      }

      const items = fs.readdirSync(dir);

      // Check if current directory has both package.json (or package.json.liquid) and scaffold.yaml
      const hasPackageJson =
        items.includes('package.json') || items.includes('package.json.liquid');
      const hasScaffoldYaml = items.includes('scaffold.yaml');

      if (hasPackageJson && hasScaffoldYaml) {
        templateDirs.push(baseDir);
      }

      // Recursively search subdirectories
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          const newBaseDir = baseDir ? path.join(baseDir, item) : item;
          findTemplates(itemPath, newBaseDir);
        }
      }
    };

    findTemplates(this.templatesPath);

    return templateDirs;
  }

  /**
   * Executes a specific boilerplate with provided variables
   */
  async useBoilerplate(request: UseBoilerplateRequest): Promise<ScaffoldResult> {
    const { boilerplateName, variables } = request;

    // Find the boilerplate configuration
    const boilerplateList = await this.listBoilerplates();
    const boilerplate = boilerplateList.boilerplates.find((b) => b.name === boilerplateName);

    if (!boilerplate) {
      return {
        success: false,
        message: `Boilerplate '${boilerplateName}' not found. Available boilerplates: ${boilerplateList.boilerplates.map((b) => b.name).join(', ')}`,
      };
    }

    // Validate variables using the boilerplate's schema
    const validationResult = this.validateBoilerplateVariables(boilerplate, variables);
    if (!validationResult.isValid) {
      return {
        success: false,
        message: `Validation failed: ${validationResult.errors.join(', ')}`,
      };
    }

    // Determine package name and folder name from variables
    const packageName = variables.packageName || variables.appName;
    if (!packageName) {
      return {
        success: false,
        message: 'Missing required parameter: packageName or appName',
      };
    }

    // Extract folder name from package name (remove scope if present)
    // e.g., "@agiflowai/test-package" -> "test-package"
    const folderName = packageName.includes('/') ? packageName.split('/')[1] : packageName;

    // Use ScaffoldService to perform the scaffolding
    try {
      const result = await this.scaffoldService.useBoilerplate({
        projectName: folderName,
        packageName: packageName,
        targetFolder: boilerplate.target_folder,
        templateFolder: boilerplate.template_path,
        boilerplateName,
        variables: {
          ...variables,
          // Ensure all template variables are available
          packageName: packageName,
          appName: folderName,
          sourceTemplate: boilerplate.template_path,
        },
      });

      if (!result.success) {
        return result;
      }

      // After scaffolding, ensure project.json has sourceTemplate field
      this.ensureProjectJsonSourceTemplate(
        boilerplate.target_folder,
        folderName,
        boilerplate.template_path,
      );

      return {
        success: result.success,
        message: result.message,
        warnings: result.warnings,
        createdFiles: result.createdFiles,
        existingFiles: result.existingFiles,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to scaffold boilerplate: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Gets a specific boilerplate configuration by name with optional variable rendering
   */
  async getBoilerplate(
    name: string,
    variables?: Record<string, any>,
  ): Promise<BoilerplateInfo | null> {
    const boilerplateList = await this.listBoilerplates();
    const boilerplate = boilerplateList.boilerplates.find((b) => b.name === name);

    if (!boilerplate) {
      return null;
    }

    // If variables are provided, render the instruction with template service
    if (variables && this.templateService.containsTemplateVariables(boilerplate.instruction)) {
      return {
        ...boilerplate,
        instruction: this.templateService.renderString(boilerplate.instruction, variables),
      };
    }

    return boilerplate;
  }

  /**
   * Processes boilerplate instruction with template service
   */
  processBoilerplateInstruction(instruction: string, variables: Record<string, any>): string {
    if (this.templateService.containsTemplateVariables(instruction)) {
      return this.templateService.renderString(instruction, variables);
    }
    return instruction;
  }

  /**
   * Validates boilerplate variables against schema using Zod
   */
  validateBoilerplateVariables(
    boilerplate: BoilerplateInfo,
    variables: Record<string, any>,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Convert JSON schema to Zod schema using @composio/json-schema-to-zod
      const zodSchema = jsonSchemaToZod(boilerplate.variables_schema);

      // Validate the variables
      zodSchema.parse(variables);

      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors = error.errors.map((err) => {
          const path = err.path.length > 0 ? err.path.join('.') : 'root';
          return `${path}: ${err.message}`;
        });
        errors.push(...zodErrors);
      } else {
        errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { isValid: false, errors };
    }
  }

  /**
   * Ensures project.json has sourceTemplate field
   * If project.json exists, updates it; otherwise creates a new one
   */
  private ensureProjectJsonSourceTemplate(
    targetFolder: string,
    projectName: string,
    sourceTemplate: string,
  ): void {
    const projectJsonPath = path.join(targetFolder, projectName, 'project.json');

    try {
      let projectJson: any;

      if (fs.existsSync(projectJsonPath)) {
        // Read existing project.json
        const content = fs.readFileSync(projectJsonPath, 'utf8');
        projectJson = JSON.parse(content);
      } else {
        // Create minimal project.json
        projectJson = {
          name: projectName,
          $schema: '../../node_modules/nx/schemas/project-schema.json',
          sourceRoot: `${targetFolder}/${projectName}`,
          projectType: 'application',
        };
      }

      // Add/update sourceTemplate field
      projectJson.sourceTemplate = sourceTemplate;

      // Write back to file
      fs.writeFileSync(projectJsonPath, `${JSON.stringify(projectJson, null, 2)}\n`, 'utf8');
    } catch (error) {
      console.warn(`Failed to update project.json with sourceTemplate: ${error}`);
    }
  }
}
