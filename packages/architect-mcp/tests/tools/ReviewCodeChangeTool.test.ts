/**
 * ReviewCodeChangeTool Tests
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
import { ReviewCodeChangeTool } from '../../src/tools/ReviewCodeChangeTool';

describe('ReviewCodeChangeTool', () => {
  const tool = new ReviewCodeChangeTool();

  it('should have correct metadata', () => {
    const definition = tool.getDefinition();

    expect(definition.name).toBeDefined();
    expect(definition.name).toBe(ReviewCodeChangeTool.TOOL_NAME);
    expect(definition.description).toContain('Review code');
    expect(definition.inputSchema).toBeDefined();
  });

  it('should execute successfully with valid file path', async () => {
    const result = await tool.execute({ file_path: __filename });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    // Review may return no rules found, which is not an error
  });

  it('should handle errors gracefully', async () => {
    // Test with non-existent file
    const result = await tool.execute({ file_path: '/non/existent/path.ts' });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
  });
});
