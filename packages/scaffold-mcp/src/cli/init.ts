import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { icons, messages, ProjectType, print, sections } from '@agiflowai/aicode-utils';
import { confirm, input, select } from '@inquirer/prompts';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import {
  cloneRepository,
  cloneSubdirectory,
  fetchGitHubDirectoryContents,
  findWorkspaceRoot,
  parseGitHubUrl,
} from '../utils';

const execAsync = promisify(exec);

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
  print.header(`\n${icons.rocket} New Project Setup`);
  print.info("No Git repository detected. Let's set up a new project!\n");

  // Validate and use provided project name, or prompt for it
  let projectName: string;

  if (providedName) {
    // Validate provided project name
    const trimmedName = providedName.trim();
    if (!trimmedName) {
      throw new Error('Project name cannot be empty');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
      throw new Error('Project name can only contain letters, numbers, hyphens, and underscores');
    }
    projectName = trimmedName;
    print.info(`Project name: ${projectName}`);
  } else {
    // Prompt for project name
    projectName = await input({
      message: 'Enter your project name:',
      validate: (value) => {
        if (!value.trim()) {
          return 'Project name is required';
        }
        // Validate project name (alphanumeric, hyphens, underscores)
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return 'Project name can only contain letters, numbers, hyphens, and underscores';
        }
        return true;
      },
    });
  }

  // Validate and use provided project type, or prompt for it
  let projectType: ProjectType;

  if (providedProjectType) {
    // Validate provided project type
    if (
      providedProjectType !== ProjectType.MONOLITH &&
      providedProjectType !== ProjectType.MONOREPO
    ) {
      throw new Error(
        `Invalid project type '${providedProjectType}'. Must be '${ProjectType.MONOLITH}' or '${ProjectType.MONOREPO}'`,
      );
    }
    projectType = providedProjectType as ProjectType;
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

  // Prompt for Git repository
  const hasExistingRepo = await confirm({
    message: 'Do you have an existing Git repository you want to use?',
    default: false,
  });

  const projectPath = path.join(process.cwd(), projectName.trim());

  // Check if directory already exists
  if (await fs.pathExists(projectPath)) {
    throw new Error(`Directory '${projectName}' already exists. Please choose a different name.`);
  }

  // Create project directory
  await fs.ensureDir(projectPath);
  print.success(`${icons.check} Created project directory: ${projectPath}`);

  if (hasExistingRepo) {
    // Prompt for repository URL
    const repoUrl = await input({
      message: 'Enter Git repository URL:',
      validate: (value) => {
        if (!value.trim()) {
          return 'Repository URL is required';
        }
        // Basic URL validation
        if (!value.match(/^(https?:\/\/|git@)/)) {
          return 'Please enter a valid Git repository URL';
        }
        return true;
      },
    });

    print.info(`${icons.download} Cloning repository...`);

    try {
      // Parse URL to check if it's a subdirectory
      const parsed = parseGitHubUrl(repoUrl.trim());

      if (parsed.isSubdirectory && parsed.branch && parsed.subdirectory) {
        // Clone subdirectory
        await cloneSubdirectory(parsed.repoUrl, parsed.branch, parsed.subdirectory, projectPath);
      } else {
        // Clone entire repository
        await cloneRepository(parsed.repoUrl, projectPath);
      }

      print.success(`${icons.check} Repository cloned successfully`);
    } catch (error) {
      // Clean up on error
      await fs.remove(projectPath);
      throw new Error(`Failed to clone repository: ${(error as Error).message}`);
    }
  } else {
    // Ask if user wants to initialize a new Git repository
    const initGit = await confirm({
      message: 'Initialize a new Git repository?',
      default: true,
    });

    if (initGit) {
      print.info(`${icons.rocket} Initializing Git repository...`);
      try {
        await execAsync(`git init "${projectPath}"`);
        print.success(`${icons.check} Git repository initialized`);
      } catch (error) {
        messages.warning(`Failed to initialize Git: ${(error as Error).message}`);
      }
    }
  }

  return {
    projectPath,
    projectType,
  };
}

/**
 * Download templates from GitHub repository
 */
async function downloadTemplates(templatesPath: string): Promise<void> {
  try {
    print.info(
      `${icons.download} Fetching templates from ${DEFAULT_TEMPLATE_REPO.owner}/${DEFAULT_TEMPLATE_REPO.repo}...`,
    );

    // Fetch directory listing from GitHub
    const contents = await fetchGitHubDirectoryContents(
      DEFAULT_TEMPLATE_REPO.owner,
      DEFAULT_TEMPLATE_REPO.repo,
      DEFAULT_TEMPLATE_REPO.path,
      DEFAULT_TEMPLATE_REPO.branch,
    );

    // Filter only directories
    const templateDirs = contents.filter((item) => item.type === 'dir');

    if (templateDirs.length === 0) {
      messages.warning('No templates found in repository');
      return;
    }

    print.info(`${icons.folder} Found ${templateDirs.length} template(s)`);

    // Download each template
    for (const template of templateDirs) {
      const targetFolder = path.join(templatesPath, template.name);

      // Skip if already exists
      if (await fs.pathExists(targetFolder)) {
        print.info(`${icons.skip} Skipping ${template.name} (already exists)`);
        continue;
      }

      print.info(`${icons.download} Downloading ${template.name}...`);

      const repoUrl = `https://github.com/${DEFAULT_TEMPLATE_REPO.owner}/${DEFAULT_TEMPLATE_REPO.repo}.git`;

      await cloneSubdirectory(repoUrl, DEFAULT_TEMPLATE_REPO.branch, template.path, targetFolder);

      print.success(`${icons.check} Downloaded ${template.name}`);
    }

    print.success(`\n${icons.check} All templates downloaded successfully!`);
  } catch (error) {
    throw new Error(`Failed to download templates: ${(error as Error).message}`);
  }
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

      const templatesPath = options.path
        ? path.join(workspaceRoot, options.path)
        : path.join(workspaceRoot, 'templates');

      print.info(`\n${icons.rocket} Initializing templates folder at: ${templatesPath}`);

      // Create templates directory
      await fs.ensureDir(templatesPath);

      // Create README.md
      const readme = `# Templates

This folder contains boilerplate templates and scaffolding methods for your projects.

## Templates

Templates are organized by framework/technology and include configuration files (\`scaffold.yaml\`) that define:
- Boilerplates: Full project starter templates
- Features: Code scaffolding methods for adding new features to existing projects

## Adding More Templates

Use the \`add\` command to add templates from remote repositories:

\`\`\`bash
scaffold-mcp add --name my-template --url https://github.com/user/template
\`\`\`

Or add templates from subdirectories:

\`\`\`bash
scaffold-mcp add --name nextjs-template --url https://github.com/user/repo/tree/main/templates/nextjs
\`\`\`

## Creating Custom Templates

Each template should have a \`scaffold.yaml\` configuration file defining:
- \`boilerplate\`: Array of boilerplate configurations
- \`features\`: Array of feature scaffold configurations

Template files use Liquid syntax for variable placeholders: \`{{ variableName }}\`

See existing templates for examples and documentation for more details.
`;

      await fs.writeFile(path.join(templatesPath, 'README.md'), readme);

      print.success(`${icons.check} Templates folder created!`);

      // Download templates if not skipped
      if (options.download !== false) {
        await downloadTemplates(templatesPath);
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
