import { TemplatesManagerService } from '@agiflowai/aicode-utils';
import { Command } from 'commander';
import { BoilerplateService } from '../services/BoilerplateService';
import { icons, messages, print, sections } from '../utils';

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
      const templatesDir = await TemplatesManagerService.findTemplatesPath();
      const boilerplateService = new BoilerplateService(templatesDir);
      const { boilerplates } = await boilerplateService.listBoilerplates();

      if (boilerplates.length === 0) {
        messages.warning('No boilerplate templates found.');
        return;
      }

      print.header(`\n${icons.package} Available Boilerplate Templates:\n`);

      for (const bp of boilerplates) {
        print.highlight(`  ${bp.name}`);
        print.debug(`    ${bp.description}`);
        print.debug(`    Target: ${bp.target_folder}`);

        const required =
          typeof bp.variables_schema === 'object' &&
          bp.variables_schema !== null &&
          'required' in bp.variables_schema
            ? (bp.variables_schema.required as string[])
            : [];
        if (required && required.length > 0) {
          print.debug(`    Required: ${required.join(', ')}`);
        }
        print.newline();
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
  .option(
    '-m, --monolith',
    'Create as monolith project at workspace root with toolkit.yaml (default: false, creates as monorepo with project.json)',
  )
  .option(
    '-t, --target-folder <path>',
    'Override target folder (defaults to boilerplate targetFolder for monorepo, workspace root for monolith)',
  )
  .option('--verbose', 'Enable verbose logging')
  .action(async (boilerplateName, options) => {
    try {
      const templatesDir = await TemplatesManagerService.findTemplatesPath();
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
        print.warning(`Available boilerplates: ${boilerplates.map((b) => b.name).join(', ')}`);
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
        print.debug(
          `Example: scaffold-mcp boilerplate create ${boilerplateName} --vars '${JSON.stringify(exampleVars)}'`,
        );
        process.exit(1);
      }

      if (options.verbose) {
        print.info(`${icons.wrench} Boilerplate: ${boilerplateName}`);
        print.info(`${icons.chart} Variables: ${JSON.stringify(variables, null, 2)}`);
      }

      messages.loading(`Creating project from boilerplate '${boilerplateName}'...`);

      const result = await boilerplateService.useBoilerplate({
        boilerplateName,
        variables,
        monolith: options.monolith,
        targetFolderOverride: options.targetFolder,
      });

      if (result.success) {
        messages.success('Project created successfully!');
        print.info(result.message);

        if (result.createdFiles && result.createdFiles.length > 0) {
          sections.createdFiles(result.createdFiles);
        }

        const projectName =
          (variables as Record<string, unknown>).appName ||
          (variables as Record<string, unknown>).packageName;
        if (projectName) {
          // Determine the correct path based on monolith flag
          const targetFolder =
            options.targetFolder || (options.monolith ? '.' : boilerplate.target_folder);
          const projectPath = options.monolith ? '.' : `${targetFolder}/${projectName}`;

          const steps =
            projectPath === '.'
              ? ['pnpm install', 'pnpm dev']
              : [`cd ${projectPath}`, 'pnpm install', 'pnpm dev'];

          sections.nextSteps(steps);
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
      const templatesDir = await TemplatesManagerService.findTemplatesPath();
      const boilerplateService = new BoilerplateService(templatesDir);
      const bp = await boilerplateService.getBoilerplate(boilerplateName);

      if (!bp) {
        messages.error(`Boilerplate '${boilerplateName}' not found.`);
        process.exit(1);
      }

      print.header(`\n${icons.package} Boilerplate: ${bp.name}\n`);
      print.debug(`Description: ${bp.description}`);
      print.debug(`Template Path: ${bp.template_path}`);
      print.debug(`Target Folder: ${bp.target_folder}`);

      print.header(`\n${icons.config} Variables Schema:`);
      console.log(JSON.stringify(bp.variables_schema, null, 2));

      if (bp.includes && bp.includes.length > 0) {
        sections.list(`${icons.folder} Included Files:`, bp.includes);
      }
    } catch (error) {
      messages.error('Error getting boilerplate info:', error as Error);
      process.exit(1);
    }
  });
