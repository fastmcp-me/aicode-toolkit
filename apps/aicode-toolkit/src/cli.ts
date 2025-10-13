#!/usr/bin/env node
import { Command } from 'commander';
import packageJson from '../package.json' assert { type: 'json' };
import { addCommand } from './commands/add';
import { initCommand } from './commands/init';

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
    .version(packageJson.version);

  // Add all commands
  program.addCommand(initCommand);
  program.addCommand(addCommand);

  // Parse arguments
  await program.parseAsync(process.argv);
}

main();
