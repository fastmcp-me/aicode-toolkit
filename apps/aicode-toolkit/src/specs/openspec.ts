/**
 * OpenSpec Bridge Implementation
 *
 * DESIGN PATTERNS:
 * - Bridge pattern implementation for OpenSpec
 * - Singleton pattern for OpenSpec configuration
 *
 * CODING STANDARDS:
 * - Implement ISpecBridge interface
 * - Use async/await for I/O operations
 * - Handle errors with descriptive messages
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execa } from 'execa';
import { Liquid } from 'liquidjs';
import type { EnabledMcps, ISpecBridge } from './types';
import openspecTemplate from '../instructions/specs/openspec.md?raw';

/**
 * OpenSpec configuration
 */
const OPENSPEC_CONFIG = {
  folderName: 'openspec',
  packageName: '@fission-ai/openspec',
  name: 'OpenSpec',
  description: 'Spec-driven development for AI coding assistants',
} as const;

/**
 * Bridge implementation for OpenSpec
 *
 * Provides integration with OpenSpec spec tool through a standardized interface.
 */
export class OpenSpecBridge implements ISpecBridge {
  /**
   * Check if OpenSpec is enabled/installed in the workspace
   *
   * @param workspaceRoot - Absolute path to the workspace root directory
   * @returns Promise resolving to true if OpenSpec folder exists, false otherwise
   */
  async isEnabled(workspaceRoot: string): Promise<boolean> {
    try {
      const openspecPath = path.join(workspaceRoot, OPENSPEC_CONFIG.folderName);
      await fs.access(openspecPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize OpenSpec in the workspace
   *
   * Runs `npx @fission-ai/openspec init` interactively, allowing the user
   * to configure OpenSpec during setup.
   *
   * @param workspaceRoot - Absolute path to the workspace root directory
   * @throws Error if initialization fails
   */
  async initialize(workspaceRoot: string): Promise<void> {
    try {
      // Use npx with stdio: 'inherit' to allow interactive init
      await execa('npx', [OPENSPEC_CONFIG.packageName, 'init'], {
        cwd: workspaceRoot,
        stdio: 'inherit',
      });
    } catch (error) {
      throw new Error(`Failed to initialize ${OPENSPEC_CONFIG.name}: ${(error as Error).message}`);
    }
  }

  /**
   * Generate agent instruction prompt for OpenSpec with MCP integration
   *
   * Creates a comprehensive instruction prompt that guides AI agents to use
   * spec-driven development workflow with OpenSpec, leveraging enabled MCP servers.
   *
   * @param enabledMcps - Configuration of which MCP servers are enabled
   * @returns Promise resolving to the instruction prompt string
   */
  async updateInstruction(enabledMcps: EnabledMcps): Promise<string> {
    const liquid = new Liquid();
    const rendered = await liquid.parseAndRender(openspecTemplate, enabledMcps);
    return rendered.trim();
  }
}
