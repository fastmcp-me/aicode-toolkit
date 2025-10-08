#!/usr/bin/env node
/**
 * MCP Server Entry Point
 *
 * DESIGN PATTERNS:
 * - CLI pattern with Commander for argument parsing
 * - Command pattern for organizing CLI commands
 * - Transport abstraction for multiple communication methods
 *
 * CODING STANDARDS:
 * - Use async/await for asynchronous operations
 * - Handle errors gracefully with try-catch
 * - Log important events for debugging
 * - Register all commands in main entry point
 *
 * AVOID:
 * - Hardcoding command logic in index.ts (use separate command files)
 * - Missing error handling for command execution
 */
import { Command } from 'commander';
import { mcpServeCommand } from './cli/mcp-serve';
import { addPatternCommand } from './cli/add-pattern';
import { addRuleCommand } from './cli/add-rule';
import { getFileDesignPatternCommand } from './cli/get-file-design-pattern';
import { reviewCodeChangeCommand } from './cli/review-code-change';

/**
 * Main entry point
 */
async function main() {
  const program = new Command();

  program
    .name('architect-mcp')
    .description('MCP server for software architecture design and planning')
    .version('0.1.0');

  // Add all commands
  program.addCommand(mcpServeCommand);
  program.addCommand(addPatternCommand);
  program.addCommand(addRuleCommand);
  program.addCommand(getFileDesignPatternCommand);
  program.addCommand(reviewCodeChangeCommand);

  // Parse arguments
  await program.parseAsync(process.argv);
}

main();
