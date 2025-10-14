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
import { print } from '@agiflowai/aicode-utils';
import { execa } from 'execa';
import type { EnabledMcps, ISpecBridge } from './types';

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
    const { scaffoldMcp, architectMcp, projectType } = enabledMcps;
    const sections: string[] = [];

    // Header - always included
    sections.push(`# Spec-Driven Development with OpenSpec

When working on this project, follow the OpenSpec spec-driven development workflow${scaffoldMcp || architectMcp ? ' integrated with MCP tools' : ''}.

## Overview
OpenSpec helps align humans and AI on what to build before writing code.${scaffoldMcp || architectMcp ? ' Use MCP tools to enhance planning, code quality, and implementation.' : ''}`);

    let stepNumber = 1;

    // Add scaffold-mcp section if enabled
    if (scaffoldMcp) {
      const pathMappingSection = projectType
        ? `

**Path Mapping (${projectType === 'monolith' ? 'Monolith' : 'Monorepo'} Project):**

${
  projectType === 'monolith'
    ? `*This is a monolith project:*
- Single project at workspace root
- Config file: \`toolkit.yaml\` at root
- All code in workspace root (src/, lib/, etc.)
- When scaffolding: Use \`monolith: true\` parameter
- When using scaffold methods: \`projectPath\` = workspace root

Example: For workspace at \`/path/to/project\`:
- Project config: \`/path/to/project/toolkit.yaml\`
- Source code: \`/path/to/project/src/\`
- OpenSpec: \`/path/to/project/openspec/\``
    : `*This is a monorepo project:*
- Multiple projects in subdirectories
- Config file: \`project.json\` in each project
- Projects in apps/, packages/, libs/, etc.
- When scaffolding: Omit \`monolith\` parameter (defaults to false)
- When using scaffold methods: \`projectPath\` = path to specific project

Example: For workspace at \`/path/to/workspace\`:
- App config: \`/path/to/workspace/apps/my-app/project.json\`
- App source: \`/path/to/workspace/apps/my-app/src/\`
- OpenSpec: \`/path/to/workspace/openspec/\` (workspace-level)`
}`
        : '';

      sections.push(`

## ${stepNumber}. Create Proposals with scaffold-mcp

When implementing new features or changes, use scaffold-mcp MCP tools:

**For new projects/features:**
1. Use \`list-boilerplates\` MCP tool to see available templates
2. Use \`use-boilerplate\` MCP tool to scaffold new projects${projectType ? (projectType === 'monolith' ? ' (set `monolith: true`)' : ' (omit `monolith` parameter)') : ''}
3. Create OpenSpec proposal: "Create an OpenSpec proposal for [feature description]"

**For adding features to existing code:**
1. Use \`list-scaffolding-methods\` MCP tool with projectPath to see available features${projectType ? (projectType === 'monolith' ? ' (`projectPath` = workspace root)' : ' (`projectPath` = project directory with project.json)') : ''}
2. Use \`use-scaffold-method\` MCP tool to generate boilerplate code
3. Create OpenSpec proposal to capture the specs
${pathMappingSection}

AI will scaffold: openspec/changes/[feature-name]/ with proposal.md, tasks.md, and spec deltas`);
      stepNumber++;
    }

    // Add architect-mcp section if enabled
    if (architectMcp) {
      sections.push(`

## ${stepNumber}. Review & Validate with architect-mcp

Before and after editing files, use architect-mcp MCP tools:

**Before editing:**
- Use \`get-file-design-pattern\` MCP tool to understand:
  - Applicable design patterns from architect.yaml
  - Coding rules from RULES.yaml (must_do, should_do, must_not_do)
  - Code examples showing the patterns

**After editing:**
- Use \`review-code-change\` MCP tool to check for:
  - Must not do violations (critical issues)
  - Must do missing (required patterns not followed)
  - Should do suggestions (best practices)

**Validate OpenSpec specs:**
- Use \`openspec validate [feature-name]\` to check spec formatting
- Iterate with AI until specs are agreed upon`);
      stepNumber++;
    }

    // Implementation section - adapt based on enabled MCPs
    const implementationSteps: string[] = [
      '1. Ask AI to implement: "Apply the OpenSpec change [feature-name]"',
    ];

    if (architectMcp) {
      implementationSteps.push(
        '2. **Before each file edit**: Use `get-file-design-pattern` to understand patterns',
        '3. AI implements tasks from tasks.md following design patterns',
        '4. **After each file edit**: Use `review-code-change` to verify compliance',
        '5. Fix any violations before proceeding',
      );
    } else {
      implementationSteps.push('2. AI implements tasks from tasks.md following the agreed specs');
    }

    sections.push(`

## ${stepNumber}. Implement${architectMcp ? ' with MCP-Guided Development' : ''}

During implementation:
${implementationSteps.join('\n')}`);
    stepNumber++;

    // Archive section
    sections.push(`

## ${stepNumber}. Archive Completed Changes

After successful implementation:
- "Archive the OpenSpec change [feature-name]"
- This merges approved spec updates into openspec/specs/`);

    // MCP Tools Reference - only if MCPs are enabled
    if (scaffoldMcp || architectMcp) {
      sections.push(`

## MCP Tools Reference`);

      if (scaffoldMcp) {
        sections.push(`

### scaffold-mcp
- \`list-boilerplates\` - List available project templates
- \`use-boilerplate\` - Create new project from template
- \`list-scaffolding-methods\` - List features for existing project
- \`use-scaffold-method\` - Add feature to existing project`);
      }

      if (architectMcp) {
        sections.push(`

### architect-mcp
- \`get-file-design-pattern\` - Get design patterns for file
- \`review-code-change\` - Review code for violations`);
      }
    }

    // OpenSpec CLI commands - always included
    sections.push(`

### OpenSpec CLI
- \`openspec list\` - View active changes
- \`openspec show [change]\` - Display change details
- \`openspec validate [change]\` - Check spec formatting
- \`openspec archive [change]\` - Archive completed change`);

    // Workflow Summary - adapt based on enabled MCPs
    const workflowSteps: string[] = [];

    if (scaffoldMcp) {
      workflowSteps.push(
        '1. **Plan**: Use scaffold-mcp to generate boilerplate + OpenSpec proposal for specs',
      );
    } else {
      workflowSteps.push('1. **Plan**: Create OpenSpec proposal with specs');
    }

    if (architectMcp) {
      workflowSteps.push('2. **Design**: Use architect-mcp to understand patterns before editing');
    }

    workflowSteps.push(
      `${workflowSteps.length + 1}. **Implement**: Follow specs${architectMcp ? ' and patterns' : ''}`,
    );

    if (architectMcp) {
      workflowSteps.push(
        `${workflowSteps.length + 1}. **Review**: Use architect-mcp to validate code quality`,
      );
    }

    workflowSteps.push(
      `${workflowSteps.length + 1}. **Archive**: Merge specs into source of truth`,
    );

    sections.push(`

## Workflow Summary

${workflowSteps.join('\n')}

For more details, refer to @/openspec/AGENTS.md when working with OpenSpec.`);

    return sections.join('\n').trim();
  }
}
