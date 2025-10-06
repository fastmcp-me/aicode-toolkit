import { Command } from 'commander';
import { BoilerplateService } from '../services/BoilerplateService';
import { TemplatesManager } from '../services/TemplatesManager';
import { icons, logger, messages, sections } from '../utils';

// Get the templates directory
const templatesDir = TemplatesManager.findTemplatesPathSync();

/**
 * Boilerplate CLI command
 */
export const boilerplateCommand = new Command('boilerplate').description(
  'Manage boilerplate templates',
);

// List command
boilerplateCommand
  .command('list')
  .description('List all available boilerplate templates')
  .action(async () => {
    try {
      const boilerplateService = new BoilerplateService(templatesDir);
      const { boilerplates } = await boilerplateService.listBoilerplates();

      if (boilerplates.length === 0) {
        messages.warning('No boilerplate templates found.');
        return;
      }

      logger.header(`\n${icons.package} Available Boilerplate Templates:\n`);

      for (const bp of boilerplates) {
        logger.highlight(`  ${bp.name}`);
        logger.debug(`    ${bp.description}`);
        logger.debug(`    Target: ${bp.target_folder}`);

        const required =
          typeof bp.variables_schema === 'object' &&
          bp.variables_schema !== null &&
          'required' in bp.variables_schema
            ? (bp.variables_schema.required as string[])
            : [];
        if (required && required.length > 0) {
          logger.debug(`    Required: ${required.join(', ')}`);
        }
        logger.newline();
      }
    } catch (error) {
      messages.error('Error listing boilerplates:', error as Error);
      process.exit(1);
    }
  });

// Create command
boilerplateCommand
  .command('create <boilerplateName>')
  .description('Create a new project from a boilerplate template')
  .option('-v, --vars <json>', 'JSON string containing variables for the boilerplate')
  .option('--verbose', 'Enable verbose logging')
  .action(async (boilerplateName, options) => {
    try {
      const boilerplateService = new BoilerplateService(templatesDir);

      // Parse variables if provided
      let variables = {};
      if (options.vars) {
        try {
          variables = JSON.parse(options.vars);
        } catch (error) {
          messages.error('Error parsing variables JSON:', error as Error);
          messages.hint(
            'Example: --vars \'{"appName": "my-app", "description": "My application"}\'',
          );
          process.exit(1);
        }
      }

      // Get boilerplate info
      const boilerplate = await boilerplateService.getBoilerplate(boilerplateName);
      if (!boilerplate) {
        const { boilerplates } = await boilerplateService.listBoilerplates();
        messages.error(`Boilerplate '${boilerplateName}' not found.`);
        logger.warning(`Available boilerplates: ${boilerplates.map((b) => b.name).join(', ')}`);
        process.exit(1);
      }

      // Check for required variables
      const required =
        typeof boilerplate.variables_schema === 'object' &&
        boilerplate.variables_schema !== null &&
        'required' in boilerplate.variables_schema
          ? (boilerplate.variables_schema.required as string[])
          : [];
      const missing = required.filter(
        (key: string) => !(variables as Record<string, unknown>)[key],
      );

      if (missing.length > 0) {
        messages.error(`Missing required variables: ${missing.join(', ')}`);
        messages.hint(`Use --vars with a JSON object containing: ${missing.join(', ')}`);

        const exampleVars: Record<string, any> = {};
        for (const key of required) {
          if (key === 'appName' || key === 'packageName') {
            exampleVars[key] = 'my-app';
          } else if (key === 'description') {
            exampleVars[key] = 'My application description';
          } else {
            exampleVars[key] = `<${key}>`;
          }
        }
        logger.debug(
          `Example: scaffold-mcp boilerplate create ${boilerplateName} --vars '${JSON.stringify(exampleVars)}'`,
        );
        process.exit(1);
      }

      if (options.verbose) {
        logger.info(`${icons.wrench} Boilerplate: ${boilerplateName}`);
        logger.info(`${icons.chart} Variables: ${JSON.stringify(variables, null, 2)}`);
      }

      messages.loading(`Creating project from boilerplate '${boilerplateName}'...`);

      const result = await boilerplateService.useBoilerplate({
        boilerplateName,
        variables,
      });

      if (result.success) {
        messages.success('Project created successfully!');
        logger.info(result.message);

        if (result.createdFiles && result.createdFiles.length > 0) {
          sections.createdFiles(result.createdFiles);
        }

        const projectName =
          (variables as Record<string, unknown>).appName ||
          (variables as Record<string, unknown>).packageName;
        if (projectName) {
          sections.nextSteps([
            `cd ${boilerplate.target_folder}/${projectName}`,
            'pnpm install',
            'pnpm dev',
          ]);
        }
      } else {
        messages.error(`Failed to create project: ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      messages.error('Error creating project:', error as Error);
      if (options.verbose) {
        console.error('Stack trace:', (error as Error).stack);
      }
      process.exit(1);
    }
  });

// Info command
boilerplateCommand
  .command('info <boilerplateName>')
  .description('Show detailed information about a boilerplate template')
  .action(async (boilerplateName) => {
    try {
      const boilerplateService = new BoilerplateService(templatesDir);
      const bp = await boilerplateService.getBoilerplate(boilerplateName);

      if (!bp) {
        messages.error(`Boilerplate '${boilerplateName}' not found.`);
        process.exit(1);
      }

      logger.header(`\n${icons.package} Boilerplate: ${bp.name}\n`);
      logger.debug(`Description: ${bp.description}`);
      logger.debug(`Template Path: ${bp.template_path}`);
      logger.debug(`Target Folder: ${bp.target_folder}`);

      logger.header(`\n${icons.config} Variables Schema:`);
      console.log(JSON.stringify(bp.variables_schema, null, 2));

      if (bp.includes && bp.includes.length > 0) {
        sections.list(`${icons.folder} Included Files:`, bp.includes);
      }
    } catch (error) {
      messages.error('Error getting boilerplate info:', error as Error);
      process.exit(1);
    }
  });
