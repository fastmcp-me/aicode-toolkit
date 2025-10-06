import path from 'node:path';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import {
  icons,
  logger,
  messages,
  sections,
  cloneSubdirectory,
  fetchGitHubDirectoryContents,
} from '../utils';

/**
 * Find the workspace root by searching upwards for .git folder
 */
async function findWorkspaceRoot(startPath: string = process.cwd()): Promise<string> {
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

const DEFAULT_TEMPLATE_REPO = {
  owner: 'AgiFlow',
  repo: 'aicode-toolkit',
  branch: 'main',
  path: 'templates',
};

/**
 * Download templates from GitHub repository
 */
async function downloadTemplates(templatesPath: string): Promise<void> {
  try {
    logger.info(
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

    logger.info(`${icons.folder} Found ${templateDirs.length} template(s)`);

    // Download each template
    for (const template of templateDirs) {
      const targetFolder = path.join(templatesPath, template.name);

      // Skip if already exists
      if (await fs.pathExists(targetFolder)) {
        logger.info(`${icons.skip} Skipping ${template.name} (already exists)`);
        continue;
      }

      logger.info(`${icons.download} Downloading ${template.name}...`);

      const repoUrl = `https://github.com/${DEFAULT_TEMPLATE_REPO.owner}/${DEFAULT_TEMPLATE_REPO.repo}.git`;

      await cloneSubdirectory(repoUrl, DEFAULT_TEMPLATE_REPO.branch, template.path, targetFolder);

      logger.success(`${icons.check} Downloaded ${template.name}`);
    }

    logger.success(`\n${icons.check} All templates downloaded successfully!`);
  } catch (error) {
    throw new Error(`Failed to download templates: ${(error as Error).message}`);
  }
}

/**
 * Init command - initialize templates folder
 */
export const initCommand = new Command('init')
  .description('Initialize templates folder structure at workspace root')
  .option('--no-download', 'Skip downloading templates from repository')
  .option('--path <path>', 'Custom path for templates folder (relative to workspace root)')
  .action(async (options) => {
    try {
      const workspaceRoot = await findWorkspaceRoot();
      const templatesPath = options.path
        ? path.join(workspaceRoot, options.path)
        : path.join(workspaceRoot, 'templates');

      logger.info(`${icons.rocket} Initializing templates folder at: ${templatesPath}`);

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

      logger.success(`${icons.check} Templates folder created!`);

      // Download templates if not skipped
      if (options.download !== false) {
        await downloadTemplates(templatesPath);
      } else {
        logger.info(`${icons.skip} Skipping template download (use --download to enable)`);
      }

      logger.header(`\n${icons.folder} Templates location:`);
      logger.indent(templatesPath);

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
