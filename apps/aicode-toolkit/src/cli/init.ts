import path from 'node:path';
import {
  ProjectType,
  TemplatesManagerService,
  type ToolkitConfig,
  icons,
  messages,
  print,
  sections,
} from '@agiflowai/aicode-utils';
import { confirm, input, select } from '@inquirer/prompts';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import { createActor, fromPromise } from 'xstate';
import { NewProjectService, TemplatesService } from '../services';
import { initMachine, type InitMachineInput } from '../states/init';
import { findWorkspaceRoot } from '../utils';

const DEFAULT_TEMPLATE_REPO = {
  owner: 'AgiFlow',
  repo: 'aicode-toolkit',
  branch: 'main',
  path: 'templates',
};

/**
 * Actor implementations for the init state machine
 * These contain the actual business logic and side effects
 */
const initActors = {
  /**
   * Find workspace root by looking for .git folder
   */
  findWorkspaceRoot: fromPromise(async () => {
    const workspaceRoot = await findWorkspaceRoot();
    if (!workspaceRoot) {
      throw new Error('No workspace found');
    }
    return workspaceRoot;
  }),

  /**
   * Gather project information from user
   */
  gatherProjectInfo: fromPromise(
    async ({ input: actorInput }: { input: { providedName?: string; providedProjectType?: string } }) => {
      const newProjectService = new NewProjectService(actorInput.providedName, actorInput.providedProjectType);

      print.header(`\n${icons.rocket} New Project Setup`);
      print.info("No Git repository detected. Let's set up a new project!\n");

      // Get project name
      let projectName: string;
      const providedNameFromService = newProjectService.getProvidedName();

      if (providedNameFromService) {
        const trimmedName = providedNameFromService.trim();
        const validationResult = newProjectService.validateProjectName(trimmedName);
        if (validationResult !== true) {
          throw new Error(validationResult);
        }
        projectName = trimmedName;
        print.info(`Project name: ${projectName}`);
      } else {
        projectName = await input({
          message: 'Enter your project name:',
          validate: (value: string) => newProjectService.validateProjectName(value),
        });
      }

      // Get project type
      let projectType: ProjectType;
      const providedProjectTypeFromService = newProjectService.getProvidedProjectType();

      if (providedProjectTypeFromService) {
        newProjectService.validateProjectType(providedProjectTypeFromService);
        projectType = providedProjectTypeFromService as ProjectType;
        print.info(`Project type: ${projectType}`);
      } else {
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

      return { projectName, projectType };
    },
  ),

  /**
   * Create project directory
   */
  createProjectDirectory: fromPromise(
    async ({ input: actorInput }: { input: { projectName: string; projectType: ProjectType } }) => {
      const projectPath = path.join(process.cwd(), actorInput.projectName.trim());
      const newProjectService = new NewProjectService(undefined, undefined);

      await newProjectService.createProjectDirectory(projectPath, actorInput.projectName);

      print.info(`\n${icons.folder} Project type: ${actorInput.projectType}`);

      return { projectPath, projectType: actorInput.projectType };
    },
  ),

  /**
   * Handle Git setup (clone or init)
   */
  handleGitSetup: fromPromise(
    async ({ input: actorInput }: { input: { projectPath: string; projectType: ProjectType } }) => {
      const newProjectService = new NewProjectService(undefined, undefined);

      const hasExistingRepo = await confirm({
        message: 'Do you have an existing Git repository you want to use?',
        default: false,
      });

      if (hasExistingRepo) {
        const repoUrl = await input({
          message: 'Enter Git repository URL:',
          validate: (value: string) => newProjectService.validateRepositoryUrl(value),
        });
        await newProjectService.cloneExistingRepository(repoUrl.trim(), actorInput.projectPath);
      } else {
        const initGit = await confirm({
          message: 'Initialize a new Git repository?',
          default: true,
        });

        if (initGit) {
          await newProjectService.initializeGitRepository(actorInput.projectPath);
        }
      }

      return { projectPath: actorInput.projectPath };
    },
  ),

  /**
   * Check if templates folder exists
   */
  checkTemplatesExistence: fromPromise(async ({ input }: { input: { templatesPath: string } }) => {
    return await fs.pathExists(input.templatesPath);
  }),

  /**
   * Prompt user for alternate folder if templates exist
   */
  promptAlternateFolder: fromPromise(
    async ({
      input: actorInput,
    }: {
      input: { templatesPath: string; workspaceRoot: string; projectType?: ProjectType };
    }) => {
      messages.warning(`\n⚠️  Templates folder already exists at: ${actorInput.templatesPath}`);

      const useAlternate = await confirm({
        message: 'Do you want to use a different folder for templates?',
        default: false,
      });

      if (useAlternate) {
        const alternateFolder = await input({
          message: 'Enter alternate folder name for templates:',
          default: 'my-templates',
          validate: (value: string) => {
            if (!value.trim()) {
              return 'Folder name is required';
            }
            if (!/^[a-zA-Z0-9_\-/]+$/.test(value)) {
              return 'Folder name can only contain letters, numbers, hyphens, underscores, and slashes';
            }
            return true;
          },
        });

        const templatesPath = path.join(actorInput.workspaceRoot, alternateFolder.trim());

        return {
          useAlternate: true,
          templatesPath,
          alternateFolder: alternateFolder.trim(),
        };
      }

      print.info(`\n${icons.info} Using existing templates folder`);
      return { useAlternate: false, templatesPath: actorInput.templatesPath };
    },
  ),

  /**
   * Create toolkit.yaml with custom templates path
   */
  createToolkitConfig: fromPromise(
    async ({
      input,
    }: {
      input: {
        customTemplatesPath: string;
        workspaceRoot: string;
        projectType?: ProjectType;
      };
    }) => {
      const toolkitConfig: ToolkitConfig = {
        templatesPath: input.customTemplatesPath,
        projectType: input.projectType,
      };

      print.info(`\n${icons.config} Creating toolkit.yaml with custom templates path...`);
      await TemplatesManagerService.writeToolkitConfig(toolkitConfig, input.workspaceRoot);
      print.success(`${icons.check} toolkit.yaml created`);
    },
  ),

  /**
   * Initialize templates folder structure
   */
  initializeTemplates: fromPromise(async ({ input }: { input: { templatesPath: string } }) => {
    print.info(`\n${icons.rocket} Initializing templates folder at: ${input.templatesPath}`);

    const templatesService = new TemplatesService();
    await templatesService.initializeTemplatesFolder(input.templatesPath);

    print.success(`${icons.check} Templates folder created!`);
  }),

  /**
   * Download templates from repository
   */
  downloadTemplates: fromPromise(async ({ input }: { input: { templatesPath: string } }) => {
    const templatesService = new TemplatesService();
    await templatesService.downloadTemplates(input.templatesPath, DEFAULT_TEMPLATE_REPO);
  }),
};

/**
 * Init command - initialize templates folder structure at workspace root or create new project
 * Uses XState machine with actor implementations for better separation of concerns
 */
export const initCommand = new Command('init')
  .description('Initialize templates folder structure at workspace root or create new project')
  .option('--no-download', 'Skip downloading templates from repository')
  .option('--path <path>', 'Custom path for templates folder (relative to workspace root)')
  .option('--name <name>', 'Project name (for new projects)')
  .option('--project-type <type>', 'Project type: monolith or monorepo (for new projects)')
  .action(async (options) => {
    try {
      // Create and start the actor with input options and actor implementations
      const actor = createActor(
        initMachine.provide({
          actors: initActors,
        }),
        {
          input: {
            options: {
              download: options.download,
              path: options.path,
              name: options.name,
              projectType: options.projectType,
            },
          } as InitMachineInput,
        },
      );

      // Start the actor - it will run through all states automatically
      actor.start();

      // Wait for the machine to reach a final state (completed or failed)
      await new Promise<void>((resolve, reject) => {
        const subscription = actor.subscribe((state) => {
          // Uncomment for debugging state transitions:
          // console.log('Current state:', state.value);

          if (state.matches('completed')) {
            subscription.unsubscribe();
            resolve();
          } else if (state.matches('failed')) {
            subscription.unsubscribe();
            reject(new Error(state.context.error?.message || 'Unknown error'));
          }
        });
      });

      // Get final context for display
      const finalState = actor.getSnapshot();
      const { templatesPath, options: contextOptions } = finalState.context;

      // Display final information
      print.header(`\n${icons.folder} Templates location:`);
      print.indent(templatesPath || 'Unknown');

      const nextSteps = [];
      if (contextOptions.download === false) {
        nextSteps.push('Download templates: aicode init --download');
        nextSteps.push('Add templates manually: aicode add --name <name> --url <url>');
      } else {
        nextSteps.push('List available boilerplates: aicode boilerplate list');
        nextSteps.push('Add more templates: aicode add --name <name> --url <url>');
      }

      sections.nextSteps(nextSteps);
    } catch (error) {
      messages.error(`Error initializing templates folder: ${(error as Error).message}`);
      process.exit(1);
    }
  });
