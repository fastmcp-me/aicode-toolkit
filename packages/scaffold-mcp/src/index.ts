#!/usr/bin/env node
import { Command } from 'commander';
import { addCommand } from './cli/add';
import { boilerplateCommand } from './cli/boilerplate';
import { initCommand } from './cli/init';
import { mcpServeCommand } from './cli/mcp-serve';
import { scaffoldCommand } from './cli/scaffold';

/**
 * Main entry point
 */
async function main() {
  const program = new Command();

  program
    .name('scaffold-mcp')
    .description('MCP server for scaffolding applications with boilerplate templates')
    .version('1.0.0');

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
