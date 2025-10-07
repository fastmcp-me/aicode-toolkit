import path from 'node:path';
import { TemplatesManagerService } from '@agiflowai/aicode-utils';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import { FileSystemService } from '../services/FileSystemService';
import { ScaffoldingMethodsService } from '../services/ScaffoldingMethodsService';
import { icons, messages, print } from '../utils';

/**
 * Scaffold CLI command
 */
export const scaffoldCommand = new Command('scaffold').description(
  'Add features to existing projects',
);

// List command
scaffoldCommand
  .command('list <projectPath>')
  .description('List available scaffolding methods for a project')
  .action(async (projectPath) => {
    try {
      const absolutePath = path.resolve(projectPath);

      if (!fs.existsSync(path.join(absolutePath, 'project.json'))) {
        messages.error(`No project.json found in ${absolutePath}`);
        messages.hint('Make sure you are in a valid project directory');
        process.exit(1);
      }

      const templatesDir = await TemplatesManagerService.findTemplatesPath();
      const fileSystemService = new FileSystemService();
      const scaffoldingMethodsService = new ScaffoldingMethodsService(
        fileSystemService,
        templatesDir,
      );
      const result = await scaffoldingMethodsService.listScaffoldingMethods(absolutePath);
      const methods = result.methods;

      if (methods.length === 0) {
        messages.warning('No scaffolding methods available for this project.');
        return;
      }

      print.header(`\n${icons.wrench} Available Scaffolding Methods for ${projectPath}:\n`);

      for (const method of methods) {
        print.highlight(`  ${method.name}`);
        print.debug(
          `    ${method.instruction || method.description || 'No description available'}`,
        );

        if (method.variables_schema.required && method.variables_schema.required.length > 0) {
          print.debug(`    Required: ${method.variables_schema.required.join(', ')}`);
        }
        print.newline();
      }
    } catch (error) {
      messages.error('Error listing scaffolding methods:', error as Error);
      process.exit(1);
    }
  });

// Add command
scaffoldCommand
  .command('add <featureName>')
  .description('Add a feature to an existing project')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .option('-v, --vars <json>', 'JSON string containing variables for the feature')
  .option('--verbose', 'Enable verbose logging')
  .action(async (featureName, options) => {
    try {
      const projectPath = path.resolve(options.project);

      if (!fs.existsSync(path.join(projectPath, 'project.json'))) {
        messages.error(`No project.json found in ${projectPath}`);
        messages.hint('Make sure you are in a valid project directory');
        process.exit(1);
      }

      // Parse variables
      let variables = {};
      if (options.vars) {
        try {
          variables = JSON.parse(options.vars);
        } catch (error) {
          messages.error('Error parsing variables JSON:', error as Error);
          messages.hint(
            'Example: --vars \'{"componentName": "UserProfile", "description": "User profile component"}\'',
          );
          process.exit(1);
        }
      }

      const templatesDir = await TemplatesManagerService.findTemplatesPath();
      const fileSystemService = new FileSystemService();
      const scaffoldingMethodsService = new ScaffoldingMethodsService(
        fileSystemService,
        templatesDir,
      );

      // Get scaffold method info
      const listResult = await scaffoldingMethodsService.listScaffoldingMethods(projectPath);
      const methods = listResult.methods;
      const method = methods.find((m) => m.name === featureName);

      if (!method) {
        messages.error(`Scaffold method '${featureName}' not found.`);
        print.warning(`Available methods: ${methods.map((m) => m.name).join(', ')}`);
        print.debug(
          `Run 'scaffold-mcp scaffold list ${options.project}' to see all available methods`,
        );
        process.exit(1);
      }

      // Check for required variables
      const required =
        typeof method.variables_schema === 'object' &&
        method.variables_schema !== null &&
        'required' in method.variables_schema
          ? (method.variables_schema.required as string[])
          : [];
      const missing = required.filter(
        (key: string) => !(variables as Record<string, unknown>)[key],
      );

      if (missing.length > 0) {
        messages.error(`❌ Missing required variables: ${missing.join(', ')}`);
        messages.hint(`💡 Use --vars with a JSON object containing: ${missing.join(', ')}`);

        const exampleVars: Record<string, any> = {};
        for (const key of required) {
          if (key.includes('Name')) {
            exampleVars[key] = 'MyFeature';
          } else if (key === 'description') {
            exampleVars[key] = 'Feature description';
          } else {
            exampleVars[key] = `<${key}>`;
          }
        }
        print.debug(
          `Example: scaffold-mcp scaffold add ${featureName} --project ${options.project} --vars '${JSON.stringify(exampleVars)}'`,
        );
        process.exit(1);
      }

      if (options.verbose) {
        print.info(`🔧 Feature: ${featureName}`);
        print.info(`📊 Variables: ${JSON.stringify(variables, null, 2)}`);
        print.info(`📁 Project Path: ${projectPath}`);
      }

      print.info(`🚀 Adding '${featureName}' to project...`);

      const result = await scaffoldingMethodsService.useScaffoldMethod({
        projectPath,
        scaffold_feature_name: featureName,
        variables,
      });

      if (result.success) {
        messages.success('✅ Feature added successfully!');
        console.log(result.message);

        if (result.createdFiles && result.createdFiles.length > 0) {
          print.header('\n📁 Created files:');
          result.createdFiles.forEach((file) => print.debug(`   - ${file}`));
        }

        if (result.warnings && result.warnings.length > 0) {
          messages.warning('\n⚠️  Warnings:');
          result.warnings.forEach((warning) => print.debug(`   - ${warning}`));
        }

        print.header('\n📋 Next steps:');
        print.debug('   - Review the generated files');
        print.debug('   - Update imports if necessary');
        print.debug('   - Run tests to ensure everything works');
      } else {
        messages.error(`❌ Failed to add feature: ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      messages.error(`❌ Error adding feature: ${(error as Error).message}`);
      if (options.verbose) {
        console.error('Stack trace:', (error as Error).stack);
      }
      process.exit(1);
    }
  });

// Info command
scaffoldCommand
  .command('info <featureName>')
  .description('Show detailed information about a scaffold method')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .action(async (featureName, options) => {
    try {
      const projectPath = path.resolve(options.project);

      if (!fs.existsSync(path.join(projectPath, 'project.json'))) {
        messages.error(`❌ No project.json found in ${projectPath}`);
        process.exit(1);
      }

      const templatesDir = await TemplatesManagerService.findTemplatesPath();
      const fileSystemService = new FileSystemService();
      const scaffoldingMethodsService = new ScaffoldingMethodsService(
        fileSystemService,
        templatesDir,
      );
      const result = await scaffoldingMethodsService.listScaffoldingMethods(projectPath);
      const methods = result.methods;
      const method = methods.find((m) => m.name === featureName);

      if (!method) {
        messages.error(`❌ Scaffold method '${featureName}' not found.`);
        process.exit(1);
      }

      print.header(`\n🔧 Scaffold Method: ${method.name}\n`);
      print.debug(`Description: ${method.description}`);

      print.header('\n📝 Variables Schema:');
      console.log(JSON.stringify(method.variables_schema, null, 2));

      const includes = 'includes' in method ? (method.includes as string[]) : [];
      if (includes && includes.length > 0) {
        print.header('\n📁 Files to be created:');
        includes.forEach((include: string) => {
          const parts = include.split('>>');
          if (parts.length === 2) {
            print.debug(`  - ${parts[1].trim()}`);
          } else {
            print.debug(`  - ${include}`);
          }
        });
      }
    } catch (error) {
      messages.error(`❌ Error getting scaffold info: ${(error as Error).message}`);
      process.exit(1);
    }
  });
