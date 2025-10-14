/**
 * Spec Bridge Types
 *
 * DESIGN PATTERNS:
 * - Interface pattern for spec tool abstraction
 * - Bridge pattern to decouple spec tools from application logic
 *
 * CODING STANDARDS:
 * - Use PascalCase for interfaces
 * - Document all public interfaces with JSDoc
 * - Use async methods for I/O operations
 */

/**
 * Enabled MCP servers configuration
 */
export interface EnabledMcps {
  /** Whether scaffold-mcp is enabled */
  scaffoldMcp: boolean;
  /** Whether architect-mcp is enabled */
  architectMcp: boolean;
  /** Optional project type (monolith or monorepo) for context-aware instructions */
  projectType?: 'monolith' | 'monorepo';
}

/**
 * Interface for spec tool bridge implementations
 *
 * This interface allows the application to work with different spec tools
 * (e.g., OpenSpec, other future spec tools) without tight coupling.
 */
export interface ISpecBridge {
  /**
   * Check if the spec tool is enabled/installed in the workspace
   *
   * @param workspaceRoot - Absolute path to the workspace root directory
   * @returns Promise resolving to true if spec tool is installed, false otherwise
   */
  isEnabled(workspaceRoot: string): Promise<boolean>;

  /**
   * Initialize the spec tool in the workspace
   *
   * This method should run the spec tool's initialization command interactively,
   * allowing the user to configure the tool during setup.
   *
   * @param workspaceRoot - Absolute path to the workspace root directory
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails
   */
  initialize(workspaceRoot: string): Promise<void>;

  /**
   * Generate agent instruction prompt for the spec tool
   *
   * This method generates a prompt/instruction that should be appended to the
   * coding agent's configuration file to enable spec-driven development workflow.
   *
   * @param enabledMcps - Configuration of which MCP servers are enabled
   * @returns Promise resolving to the instruction prompt string to append to agent config
   */
  updateInstruction(enabledMcps: EnabledMcps): Promise<string>;
}
