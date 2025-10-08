/**
 * AddRuleTool Tests
 *
 * TESTING PATTERNS:
 * - Test tool metadata (name, description, schema)
 * - Test successful execution with valid inputs
 * - Test error handling with invalid inputs
 * - Mock services when testing tools
 *
 * CODING STANDARDS:
 * - Use descriptive test names (should...)
 * - Test input validation
 * - Verify ToolResult structure
 * - Check both success and error paths
 * - Mock external dependencies and services
 */

import { describe, it, expect } from 'vitest';
import { AddRuleTool } from '../../src/tools/AddRuleTool';

describe('AddRuleTool', () => {
  const tool = new AddRuleTool();

  it('should have correct metadata', () => {
    const definition = tool.getDefinition();
    expect(definition.name).toBeDefined();
    expect(definition.description).toBe('Add a new design pattern rule to a template\'s RULES.yaml or global RULES.yaml. Rules define specific coding standards, must-do/must-not-do items, and code examples.');
    expect(definition.inputSchema).toBeDefined();
  });

  it('should execute successfully', async () => {
    const result = await tool.execute({
      pattern: 'test-pattern',
      description: 'Test pattern description',
      is_global: true,
    });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
  });

  it('should handle errors gracefully', async () => {
    // TODO: Add error test cases
  });
});