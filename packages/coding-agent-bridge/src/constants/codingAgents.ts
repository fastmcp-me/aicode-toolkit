/**
 * CodingAgents Constants
 *
 * DESIGN PATTERNS:
 * - Strongly-typed constant exports for compile-time safety
 * - Organized by logical grouping using const objects
 * - Immutable by default (as const assertions)
 * - Clear documentation with JSDoc comments
 * - Re-exported through barrel export for clean imports
 *
 * CODING STANDARDS:
 * - Primitive constants: UPPER_SNAKE_CASE
 * - Object constants: PascalCase with 'as const'
 * - Always include JSDoc with purpose and usage
 * - Export individual constants or grouped objects
 * - Use type inference over explicit types when possible
 * - Keep related constants grouped together
 *
 * AVOID:
 * - Mutable exports (let, var)
 * - Magic numbers without explanation
 * - Mixing unrelated constants
 * - Missing documentation
 * - Exporting raw values without context
 */

/**
 * Supported coding agent identifiers
 * @example
 * ```ts
 * import { CLAUDE_CODE, CODEX, GEMINI_CLI, CURSOR, GITHUB_COPILOT, CLINE, NONE } from '@agiflowai/coding-agent-bridge/constants';
 * console.log(CLAUDE_CODE); // 'claude-code'
 * ```
 */
export const CLAUDE_CODE = 'claude-code';
export const CODEX = 'codex';
export const CURSOR = 'cursor';
export const GEMINI_CLI = 'gemini-cli';
export const GITHUB_COPILOT = 'github-copilot';
export const CLINE = 'cline';
export const NONE = 'none';

/**
 * Type-safe configuration of all supported coding agents
 * Maps agent identifiers to their display names and metadata
 * @example
 * ```ts
 * import { SupportedCodingAgents } from '@agiflowai/coding-agent-bridge/constants';
 * const agent = SupportedCodingAgents[CLAUDE_CODE];
 * console.log(agent.displayName); // 'Claude Code'
 * ```
 */
export const SupportedCodingAgents = {
  [CLAUDE_CODE]: {
    id: CLAUDE_CODE,
    displayName: 'Claude Code',
    description: 'Anthropic Claude Code - AI coding assistant with direct codebase access',
  },
  [CODEX]: {
    id: CODEX,
    displayName: 'Codex',
    description: 'OpenAI Codex - AI system for translating natural language to code',
  },
  [CURSOR]: {
    id: CURSOR,
    displayName: 'Cursor',
    description: 'Cursor - AI-first code editor with intelligent code completion',
  },
  [GEMINI_CLI]: {
    id: GEMINI_CLI,
    displayName: 'Gemini CLI',
    description: 'Google Gemini CLI - Command-line interface for Gemini coding capabilities',
  },
  [GITHUB_COPILOT]: {
    id: GITHUB_COPILOT,
    displayName: 'GitHub Copilot',
    description: 'GitHub Copilot - AI pair programmer with repository context understanding',
  },
  [CLINE]: {
    id: CLINE,
    displayName: 'Cline',
    description: 'Cline - CLI-based AI coding assistant',
  },
  [NONE]: {
    id: NONE,
    displayName: 'Other',
    description: 'Other coding agent or skip MCP configuration',
  },
} as const;

/**
 * Union type of all supported coding agent identifiers
 */
export type CodingAgentId =
  | typeof CLAUDE_CODE
  | typeof CODEX
  | typeof CURSOR
  | typeof GEMINI_CLI
  | typeof GITHUB_COPILOT
  | typeof CLINE
  | typeof NONE;

/**
 * Inferred type from the SupportedCodingAgents configuration
 */
export type SupportedCodingAgentsType = typeof SupportedCodingAgents;

/**
 * Type for individual coding agent configuration
 */
export type CodingAgentConfig = SupportedCodingAgentsType[keyof SupportedCodingAgentsType];
