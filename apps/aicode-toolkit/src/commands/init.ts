import path from 'node:path';
import {
  ProjectType,
  print,
  TemplatesManagerService,
  type ToolkitConfig,
} from '@agiflowai/aicode-utils';
import { confirm, input, select } from '@inquirer/prompts';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import { createActor, fromPromise } from 'xstate';
import { MCP_CONFIG_FILES, MCP_SERVER_INFO, MCPServer } from '../constants';
import {
  type CodingAgent,
  CodingAgentService,
  NewProjectService,
  TemplateSelectionService,
  TemplatesService,
} from '../services';
import { type InitMachineInput, initMachine } from '../states/init-machine';
import { displayBanner, findWorkspaceRoot } from '../utils';

const DEFAULT_TEMPLATE_REPO = {
  owner: 'AgiFlow',
  repo: 'aicode-toolkit',
  branch: 'main',
  path: 'templates',
};

/**
 * Actor implementations for the init V2 state machine
 */
const initActors = {
  /**
   * Display welcome banner
   */
  displayBanner: fromPromise(async () => {
    displayBanner();
  }),

  /**
   * Check if workspace exists by looking for .git folder
   */
  checkWorkspaceExists: fromPromise(async () => {
    const workspaceRoot = await findWorkspaceRoot();
    if (workspaceRoot) {
      print.info(`Found workspace at: ${workspaceRoot}`);
      return { exists: true, workspaceRoot };
    }
    return { exists: false };
  }),

  /**
   * Detect project type (monorepo vs monolith)
   */
  detectProjectType: fromPromise(async ({ input }: { input: { workspaceRoot: string } }) => {
    print.info('\nDetecting project type...');

    // Check for monorepo indicators
    const nxJsonPath = path.join(input.workspaceRoot, 'nx.json');
    const lernaJsonPath = path.join(input.workspaceRoot, 'lerna.json');
    const pnpmWorkspacePath = path.join(input.workspaceRoot, 'pnpm-workspace.yaml');
    const turboJsonPath = path.join(input.workspaceRoot, 'turbo.json');

    const indicators: string[] = [];
    let projectType: ProjectType | undefined;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // High confidence indicators
    if (await fs.pathExists(nxJsonPath)) {
      indicators.push('nx.json found');
      projectType = ProjectType.MONOREPO;
      confidence = 'high';
    }

    if (await fs.pathExists(lernaJsonPath)) {
      indicators.push('lerna.json found');
      projectType = ProjectType.MONOREPO;
      confidence = 'high';
    }

    if (await fs.pathExists(pnpmWorkspacePath)) {
      indicators.push('pnpm-workspace.yaml found');
      projectType = ProjectType.MONOREPO;
      confidence = 'high';
    }

    if (await fs.pathExists(turboJsonPath)) {
      indicators.push('turbo.json found');
      projectType = ProjectType.MONOREPO;
      confidence = 'high';
    }

    // Check package.json for workspaces
    const packageJsonPath = path.join(input.workspaceRoot, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      if (packageJson.workspaces) {
        indicators.push('package.json with workspaces found');
        projectType = ProjectType.MONOREPO;
        if (confidence !== 'high') confidence = 'medium';
      }
    }

    // Check toolkit.yaml
    const toolkitYamlPath = path.join(input.workspaceRoot, 'toolkit.yaml');
    if (await fs.pathExists(toolkitYamlPath)) {
      const toolkitConfig = await TemplatesManagerService.readToolkitConfig(input.workspaceRoot);
      if (toolkitConfig?.projectType) {
        indicators.push(`toolkit.yaml specifies ${toolkitConfig.projectType}`);
        projectType = toolkitConfig.projectType as ProjectType;
        confidence = 'high';
      }
    }

    // Default to monolith if nothing found
    if (!projectType) {
      projectType = ProjectType.MONOLITH;
      indicators.push('No monorepo indicators found, assuming monolith');
      confidence = 'low';
    }

    if (confidence === 'high') {
      print.success(`Detected ${projectType} project (high confidence)`);
    }

    return { projectType, confidence, indicators };
  }),

  /**
   * Prompt user to select project type
   */
  promptProjectType: fromPromise(
    async ({
      input: actorInput,
    }: {
      input: { providedProjectType?: string; detectionIndicators?: string[] };
    }) => {
      // If provided via CLI, use it
      if (actorInput.providedProjectType) {
        const projectType = actorInput.providedProjectType as ProjectType;
        print.info(`Project type: ${projectType}`);
        return projectType;
      }

      // Show detection hints if available
      if (actorInput.detectionIndicators && actorInput.detectionIndicators.length > 0) {
        print.info('\nDetection results:');
        for (const indicator of actorInput.detectionIndicators) {
          print.indent(`• ${indicator}`);
        }
        print.newline();
      }

      return await select({
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
    },
  ),

  /**
   * Prompt for project name
   */
  promptProjectName: fromPromise(
    async ({ input: actorInput }: { input: { providedName?: string } }) => {
      const newProjectService = new NewProjectService(actorInput.providedName, undefined);
      const providedName = newProjectService.getProvidedName();

      if (providedName) {
        const trimmedName = providedName.trim();
        const validationResult = newProjectService.validateProjectName(trimmedName);
        if (validationResult !== true) {
          throw new Error(validationResult);
        }
        print.info(`Project name: ${trimmedName}`);
        return trimmedName;
      }

      return await input({
        message: 'Enter your project name:',
        validate: (value: string) => newProjectService.validateProjectName(value),
      });
    },
  ),

  /**
   * Create project directory
   */
  createProjectDirectory: fromPromise(
    async ({ input: actorInput }: { input: { projectName: string } }) => {
      const projectPath = path.join(process.cwd(), actorInput.projectName.trim());
      const newProjectService = new NewProjectService(undefined, undefined);

      await newProjectService.createProjectDirectory(projectPath, actorInput.projectName);

      return { projectPath };
    },
  ),

  /**
   * Setup Git repository (clone or init)
   */
  promptGitSetup: fromPromise(async ({ input: actorInput }: { input: { projectPath: string } }) => {
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
  }),

  /**
   * Prompt user to select MCP servers
   */
  promptMcpSelection: fromPromise(async () => {
    const checkbox = await import('@inquirer/prompts').then((m) => m.checkbox);

    const choices = Object.values(MCPServer).map((server) => ({
      name: MCP_SERVER_INFO[server].name,
      value: server,
      description: MCP_SERVER_INFO[server].description,
      checked: true, // Both selected by default
    }));

    const selected = await checkbox({
      message: 'Select MCP servers to configure:',
      choices,
      validate: (answer) => {
        if (answer.length === 0) {
          return 'Please select at least one MCP server';
        }
        return true;
      },
    });

    return selected as MCPServer[];
  }),

  /**
   * Download templates to tmp folder
   */
  downloadTemplates: fromPromise(async () => {
    const templateSelectionService = new TemplateSelectionService();
    const tmpPath = await templateSelectionService.downloadTemplatesToTmp(DEFAULT_TEMPLATE_REPO);
    return tmpPath;
  }),

  /**
   * List templates
   */
  listTemplates: fromPromise(async ({ input }: { input: { tmpTemplatesPath: string } }) => {
    const templateSelectionService = new TemplateSelectionService();
    const templates = await templateSelectionService.listTemplates();

    print.header('\nAvailable templates:');
    for (const template of templates) {
      print.item(`${template.name}${template.description ? ` - ${template.description}` : ''}`);
    }

    return templates;
  }),

  /**
   * Prompt user to select templates
   */
  promptTemplateSelection: fromPromise(
    async ({
      input: actorInput,
    }: {
      input: { tmpTemplatesPath: string; projectType: ProjectType };
    }) => {
      const templateSelectionService = new TemplateSelectionService();
      const templates = await templateSelectionService.listTemplates();

      if (templates.length === 0) {
        throw new Error('No templates available');
      }

      // For monolith, only allow single selection
      if (actorInput.projectType === ProjectType.MONOLITH) {
        const choices = templates.map((t) => ({
          name: t.name,
          value: t.name,
          description: t.description,
        }));

        const selected = await select({
          message: 'Select template (monolith allows only one):',
          choices,
        });

        return [selected];
      }

      // For monorepo, allow multiple selections
      const checkbox = await import('@inquirer/prompts').then((m) => m.checkbox);
      const choices = templates.map((t) => ({
        name: t.name,
        value: t.name,
        description: t.description,
      }));

      const selected = await checkbox({
        message: 'Select templates (use space to select, enter to confirm):',
        choices,
      });

      if (selected.length === 0) {
        throw new Error('Please select at least one template');
      }

      return selected;
    },
  ),

  /**
   * Copy templates to workspace
   */
  copyTemplates: fromPromise(
    async ({
      input: actorInput,
    }: {
      input: {
        tmpTemplatesPath: string;
        workspaceRoot: string;
        selectedTemplates: string[];
        projectType: ProjectType;
        selectedMcpServers?: MCPServer[];
      };
    }) => {
      const templateSelectionService = new TemplateSelectionService();
      const templatesPath = path.join(actorInput.workspaceRoot, 'templates');

      await templateSelectionService.copyTemplates(
        actorInput.selectedTemplates,
        templatesPath,
        actorInput.projectType,
        actorInput.selectedMcpServers,
      );

      return templatesPath;
    },
  ),

  /**
   * Create configuration (toolkit.yaml for monolith)
   */
  createConfig: fromPromise(
    async ({
      input: actorInput,
    }: {
      input: { workspaceRoot: string; projectType: ProjectType; selectedTemplates: string[] };
    }) => {
      // Only create toolkit.yaml for monolith
      if (actorInput.projectType === ProjectType.MONOLITH) {
        const toolkitConfig: ToolkitConfig = {
          version: '1.0',
          templatesPath: 'templates',
          projectType: 'monolith',
          sourceTemplate: actorInput.selectedTemplates[0], // Monolith has only one template
        };

        print.info('\nCreating toolkit.yaml...');
        await TemplatesManagerService.writeToolkitConfig(toolkitConfig, actorInput.workspaceRoot);
        print.success('toolkit.yaml created');
      }
    },
  ),

  /**
   * Prompt for coding agent selection
   */
  promptCodingAgent: fromPromise(async () => {
    const agents = CodingAgentService.getAvailableAgents();

    const selected = await select({
      message: 'Select coding agent for MCP configuration:',
      choices: agents.map((agent) => ({
        name: agent.name,
        value: agent.value,
        description: agent.description,
      })),
    });

    return selected;
  }),

  /**
   * Configure MCP for coding agent
   */
  configureMCP: fromPromise(
    async ({
      input: actorInput,
    }: {
      input: { workspaceRoot: string; codingAgent: CodingAgent };
    }) => {
      const codingAgentService = new CodingAgentService(actorInput.workspaceRoot);
      await codingAgentService.setupMCP(actorInput.codingAgent);
    },
  ),

  /**
   * Cleanup temporary files
   */
  cleanup: fromPromise(async ({ input }: { input: { tmpTemplatesPath?: string } }) => {
    if (input.tmpTemplatesPath) {
      const templateSelectionService = new TemplateSelectionService();
      await templateSelectionService.cleanup();
    }
  }),
};

/**
 * Init command - improved V2 implementation
 */
export const initCommand = new Command('init')
  .description('Initialize project with templates and MCP configuration')
  .option('--name <name>', 'Project name (for new projects)')
  .option('--project-type <type>', 'Project type: monolith or monorepo (for new projects)')
  .option('--skip-templates', 'Skip template download and selection')
  .option('--skip-mcp', 'Skip MCP configuration')
  .action(async (options) => {
    try {
      // Create and start the actor
      const actor = createActor(
        initMachine.provide({
          actors: initActors,
        }),
        {
          input: {
            options: {
              name: options.name,
              projectType: options.projectType,
              skipTemplates: options.skipTemplates || false,
              skipMcp: options.skipMcp || false,
            },
          } as InitMachineInput,
        },
      );

      // Start the actor
      actor.start();

      // Wait for completion
      await new Promise<void>((resolve, reject) => {
        const subscription = actor.subscribe((state) => {
          // Uncomment for debugging:
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
      const { templatesPath, projectType } = finalState.context;

      // Display final information
      print.header('\nSetup Complete!');
      if (templatesPath) {
        print.info(`Templates location: ${templatesPath}`);
      }
      if (projectType) {
        print.info(`Project type: ${projectType}`);
      }

      // Display congratulations message with gradient
      const gradient = await import('gradient-string');
      print.newline();
      console.log(
        gradient.default.pastel.multiline('🎉 Congratulations! Your project is ready to go!'),
      );
      print.newline();
    } catch (error) {
      print.error(`\nError: ${(error as Error).message}`);
      process.exit(1);
    }
  });
