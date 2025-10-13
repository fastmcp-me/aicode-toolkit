#!/usr/bin/env node
import { Command } from 'commander';
import packageJson from '../package.json' assert { type: 'json' };
import { addCommand } from './commands/add';
import { boilerplateCommand } from './commands/boilerplate';
import { initCommand } from './commands/init';
import { mcpServeCommand } from './commands/mcp-serve';
import { scaffoldCommand } from './commands/scaffold';

/**
 * Main entry point
 */
async function main() {
  const program = new Command();

  program
    .name('scaffold-mcp')
    .description('MCP server for scaffolding applications with boilerplate templates')
    .version(packageJson.version);

  // Add all commands
  program.addCommand(mcpServeCommand);
  program.addCommand(boilerplateCommand);
  program.addCommand(scaffoldCommand);
  program.addCommand(initCommand);
  program.addCommand(addCommand);

  // Parse arguments
  await program.parseAsync(process.argv);
}

main();
