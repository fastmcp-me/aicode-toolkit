import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import { icons, logger, messages, sections } from '../utils/console';

const execAsync = promisify(exec);

/**
 * Add command - add a template to templates folder
 */
export const addCommand = new Command('add')
  .description('Add a template to templates folder')
  .requiredOption('--name <name>', 'Template name')
  .requiredOption('--url <url>', 'URL of the template repository to download')
  .option('--path <path>', 'Path to templates folder', './templates')
  .option('--type <type>', 'Template type: boilerplate or scaffold', 'boilerplate')
  .action(async (options) => {
    try {
      const templatesPath = path.resolve(options.path);
      const templateType = options.type.toLowerCase();
      const templateName = options.name;
      const templateUrl = options.url;

      // Validate type
      if (templateType !== 'boilerplate' && templateType !== 'scaffold') {
        messages.error('Invalid template type. Use: boilerplate or scaffold');
        process.exit(1);
      }

      // Ensure templates folder exists
      const targetFolder = path.join(templatesPath, `${templateType}s`, templateName);

      if (await fs.pathExists(targetFolder)) {
        messages.error(`Template '${templateName}' already exists at ${targetFolder}`);
        process.exit(1);
      }

      logger.info(
        `${icons.download} Downloading template '${templateName}' from ${templateUrl}...`,
      );

      await fs.ensureDir(path.dirname(targetFolder));

      // Clone the repository
      try {
        await execAsync(`git clone ${templateUrl} "${targetFolder}"`);

        // Remove .git folder
        const gitFolder = path.join(targetFolder, '.git');
        if (await fs.pathExists(gitFolder)) {
          await fs.remove(gitFolder);
        }

        messages.success(`Template '${templateName}' added successfully!`);
        logger.header(`\n${icons.folder} Template location:`);
        logger.indent(targetFolder);

        // Check for configuration file
        const configFiles = [
          path.join(targetFolder, 'boilerplate.yaml'),
          path.join(targetFolder, 'scaffold.yaml'),
        ];

        let hasConfig = false;
        for (const configFile of configFiles) {
          if (await fs.pathExists(configFile)) {
            logger.header(`\n${icons.config} Configuration file found:`);
            logger.indent(path.basename(configFile));
            hasConfig = true;
            break;
          }
        }

        if (!hasConfig) {
          messages.warning(
            'Warning: No configuration file found (boilerplate.yaml or scaffold.yaml)',
          );
          logger.indent('You may need to create one manually.');
        }

        sections.nextSteps([
          `Review the template in ${targetFolder}`,
          `Test it with: scaffold-mcp ${templateType} list`,
        ]);
      } catch (error) {
        // If git clone fails, try to give helpful error messages
        if (
          (error as Error).message.includes('not found') ||
          (error as Error).message.includes('command not found')
        ) {
          messages.error('git command not found. Please install git first.');
        } else if ((error as Error).message.includes('Authentication failed')) {
          messages.error('Authentication failed. Make sure you have access to the repository.');
        } else if ((error as Error).message.includes('Repository not found')) {
          messages.error('Repository not found. Check the URL and try again.');
        } else {
          messages.error('Failed to clone repository:', error as Error);
        }
        process.exit(1);
      }
    } catch (error) {
      messages.error('Error adding template:', error as Error);
      process.exit(1);
    }
  });
