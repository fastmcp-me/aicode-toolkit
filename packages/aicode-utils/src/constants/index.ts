/**
 * Constants Barrel Export
 *
 * DESIGN PATTERNS:
 * - Barrel pattern: Re-export all constants from a single entry point
 * - Clean imports: Consumers import from '@package/constants' instead of individual files
 *
 * CODING STANDARDS:
 * - Export all constant definitions
 * - Use named exports (no default exports)
 * - Keep alphabetically sorted for maintainability
 *
 * AVOID:
 * - Exporting mutable values (use const or readonly)
 * - Mixing constants with functions or classes
 */

export * from './projectType';
