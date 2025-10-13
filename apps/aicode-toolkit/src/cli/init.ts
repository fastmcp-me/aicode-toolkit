import path from 'node:path';
import {
  icons,
  messages,
  ProjectType,
  print,
  sections,
  TemplatesManagerService,
  type ToolkitConfig,
} from '@agiflowai/aicode-utils';
import { confirm, input, select } from '@inquirer/prompts';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import { NewProjectService, TemplatesService } from '../services';
import { findWorkspaceRoot } from '../utils';

const DEFAULT_TEMPLATE_REPO = {
  owner: 'AgiFlow',
  repo: 'aicode-toolkit',
  branch: 'main',
  path: 'templates',
};

/**
 * Interactive setup for new projects
 * Prompts user for project details when no .git folder is found
 * @param providedName - Optional project name from CLI argument
 * @param providedProjectType - Optional project type from CLI argument
 */
async function setupNewProject(
  providedName?: string,
  providedProjectType?: string,
): Promise<{
  projectPath: string;
  projectType: ProjectType;
}> {
  const newProjectService = new NewProjectService(providedName, providedProjectType);

  print.header(`\n${icons.rocket} New Project Setup`);
  print.info("No Git repository detected. Let's set up a new project!\n");

  // Validate and use provided project name, or prompt for it
  let projectName: string;

  const providedNameFromService = newProjectService.getProvidedName();

  if (providedNameFromService) {
    // Validate provided project name
    const trimmedName = providedNameFromService.trim();
    const validationResult = newProjectService.validateProjectName(trimmedName);
    if (validationResult !== true) {
      throw new Error(validationResult);
    }
    projectName = trimmedName;
    print.info(`Project name: ${projectName}`);
  } else {
    // Prompt for project name
    projectName = await input({
      message: 'Enter your project name:',
      validate: (value) => newProjectService.validateProjectName(value),
    });
  }

  // Validate and use provided project type, or prompt for it
  let projectType: ProjectType;

  const providedProjectTypeFromService = newProjectService.getProvidedProjectType();

  if (providedProjectTypeFromService) {
    // Validate provided project type
    newProjectService.validateProjectType(providedProjectTypeFromService);
    projectType = providedProjectTypeFromService as ProjectType;
    print.info(`Project type: ${projectType}`);
  } else {
    // Prompt for project type
    projectType = await select({
      message: 'Select project type:',
      choices: [
        {
          name: 'Monolith - Single application structure',
          value: ProjectType.MONOLITH,
          description: 'Traditional single-application project structure',
        },
        {
          name: 'Monorepo - Multiple packages/apps in one repository',
          value: ProjectType.MONOREPO,
          description: 'Multiple packages managed together (uses workspaces)',
        },
      ],
    });
  }

  const projectPath = path.join(process.cwd(), projectName.trim());

  // Create project directory using service
  await newProjectService.createProjectDirectory(projectPath, projectName);

  // Prompt for Git repository
  const hasExistingRepo = await confirm({
    message: 'Do you have an existing Git repository you want to use?',
    default: false,
  });

  if (hasExistingRepo) {
    // Prompt for repository URL
    const repoUrl = await input({
      message: 'Enter Git repository URL:',
      validate: (value) => newProjectService.validateRepositoryUrl(value),
    });

    // Clone repository using service
    await newProjectService.cloneExistingRepository(repoUrl.trim(), projectPath);
  } else {
    // Ask if user wants to initialize a new Git repository
    const initGit = await confirm({
      message: 'Initialize a new Git repository?',
      default: true,
    });

    if (initGit) {
      // Initialize git repository using service
      await newProjectService.initializeGitRepository(projectPath);
    }
  }

  return {
    projectPath,
    projectType,
  };
}

/**
 * Init command - initialize templates folder
 */
export const initCommand = new Command('init')
  .description('Initialize templates folder structure at workspace root or create new project')
  .option('--no-download', 'Skip downloading templates from repository')
  .option('--path <path>', 'Custom path for templates folder (relative to workspace root)')
  .option('--name <name>', 'Project name (for new projects)')
  .option('--project-type <type>', 'Project type: monolith or monorepo (for new projects)')
  .action(async (options) => {
    try {
      let workspaceRoot = await findWorkspaceRoot();
      let projectType: ProjectType | undefined;

      // If no workspace root found, run interactive setup for new project
      if (!workspaceRoot) {
        const projectSetup = await setupNewProject(options.name, options.projectType);
        workspaceRoot = projectSetup.projectPath;
        projectType = projectSetup.projectType;

        print.info(`\n${icons.folder} Project type: ${projectType}`);
      }

      let templatesPath = options.path
        ? path.join(workspaceRoot, options.path)
        : path.join(workspaceRoot, 'templates');

      // Check if templates folder already exists
      if (await fs.pathExists(templatesPath)) {
        messages.warning(`\n⚠️  Templates folder already exists at: ${templatesPath}`);

        const useAlternate = await confirm({
          message: 'Do you want to use a different folder for templates?',
          default: false,
        });

        if (useAlternate) {
          const alternateFolder = await input({
            message: 'Enter alternate folder name for templates:',
            default: 'my-templates',
            validate: (value) => {
              if (!value.trim()) {
                return 'Folder name is required';
              }
              // Validate folder name (alphanumeric, hyphens, underscores, forward slashes for paths)
              if (!/^[a-zA-Z0-9_\-/]+$/.test(value)) {
                return 'Folder name can only contain letters, numbers, hyphens, underscores, and slashes';
              }
              return true;
            },
          });

          // Update templates path to the alternate folder
          templatesPath = path.join(workspaceRoot, alternateFolder.trim());

          // Create toolkit.yaml with the custom templates path
          const toolkitConfig: ToolkitConfig = {
            templatesPath: alternateFolder.trim(),
            projectType,
          };

          print.info(`\n${icons.config} Creating toolkit.yaml with custom templates path...`);
          await TemplatesManagerService.writeToolkitConfig(toolkitConfig, workspaceRoot);
          print.success(`${icons.check} toolkit.yaml created`);
        } else {
          print.info(`\n${icons.info} Using existing templates folder`);
        }
      }

      print.info(`\n${icons.rocket} Initializing templates folder at: ${templatesPath}`);

      // Initialize templates folder using service
      const templatesService = new TemplatesService();
      await templatesService.initializeTemplatesFolder(templatesPath);

      print.success(`${icons.check} Templates folder created!`);

      // Download templates if not skipped
      if (options.download !== false) {
        await templatesService.downloadTemplates(templatesPath, DEFAULT_TEMPLATE_REPO);
      } else {
        print.info(`${icons.skip} Skipping template download (use --download to enable)`);
      }

      print.header(`\n${icons.folder} Templates location:`);
      print.indent(templatesPath);

      const nextSteps = [];
      if (options.download === false) {
        nextSteps.push(`Download templates: scaffold-mcp init --download`);
        nextSteps.push(`Add templates manually: scaffold-mcp add --name <name> --url <url>`);
      } else {
        nextSteps.push(`List available boilerplates: scaffold-mcp boilerplate list`);
        nextSteps.push(`Add more templates: scaffold-mcp add --name <name> --url <url>`);
      }

      sections.nextSteps(nextSteps);
    } catch (error) {
      messages.error(`Error initializing templates folder: ${(error as Error).message}`);
      process.exit(1);
    }
  });
