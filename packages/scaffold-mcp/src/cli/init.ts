import path from 'node:path';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import { icons, logger, sections } from '../utils/console';

/**
 * Init command - initialize templates folder
 */
export const initCommand = new Command('init')
  .description('Initialize templates folder structure')
  .option('--path <path>', 'Path to templates folder', './templates')
  .action(async (options) => {
    try {
      const templatesPath = path.resolve(options.path);

      logger.info(`${icons.rocket} Initializing templates folder at: ${templatesPath}`);

      // Create templates directory structure
      await fs.ensureDir(templatesPath);
      await fs.ensureDir(path.join(templatesPath, 'boilerplates'));
      await fs.ensureDir(path.join(templatesPath, 'scaffolds'));

      // Create README.md
      const readme = `# Templates

This folder contains boilerplate templates and scaffolding methods for your projects.

## Structure

- \`boilerplates/\` - Full project boilerplate templates
- \`scaffolds/\` - Feature scaffolding methods for existing projects

## Adding Templates

Use the \`add\` command to add templates from remote repositories:

\`\`\`bash
scaffold-mcp add --name my-template --url https://github.com/user/template
\`\`\`

## Creating Custom Templates

### Boilerplate Template Structure

Each boilerplate should have:
- \`boilerplate.yaml\` - Configuration file
- Template files with variable placeholders using Liquid syntax (\`{{ variableName }}\`)

### Scaffold Method Structure

Each scaffold method should have:
- \`scaffold.yaml\` - Configuration file
- Template files organized by project type

See documentation for more details on template creation.
`;

      await fs.writeFile(path.join(templatesPath, 'README.md'), readme);

      logger.success(`${icons.check} Templates folder initialized successfully!`);
      logger.header(`\n${icons.folder} Created structure:`);
      logger.indent(`${templatesPath}/`);
      logger.indent(`├── boilerplates/`);
      logger.indent(`├── scaffolds/`);
      logger.indent(`└── README.md`);

      sections.nextSteps([
        `Add templates using: scaffold-mcp add --name <name> --url <url>`,
        `Or manually create templates in ${templatesPath}/`,
      ]);
    } catch (error) {
      logger.error(`${icons.cross} Error initializing templates folder:`, error as Error);
      process.exit(1);
    }
  });
