#!/usr/bin/env node
import { Command } from 'commander';
import { addCommand } from './cli/add';
import { initCommand } from './cli/init';

/**
 * Main entry point
 */
async function main() {
  const program = new Command();

  program
    .name('aicode')
    .description(
      'AI-powered code toolkit CLI for scaffolding, architecture management, and development workflows',
    )
    .version('0.6.0');

  // Add all commands
  program.addCommand(initCommand);
  program.addCommand(addCommand);

  // Parse arguments
  await program.parseAsync(process.argv);
}

main();
