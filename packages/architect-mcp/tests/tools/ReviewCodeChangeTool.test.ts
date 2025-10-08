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

  it('should return result for non-existent file', async () => {
    // Non-existent files should return a result (not throw)
    const result = await tool.execute({ file_path: '/tmp/non-existent-test-file.ts' });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
  });

  it('should return result for file outside project', async () => {
    // Files outside any project should return "No project found"
    const result = await tool.execute({ file_path: '/tmp/test.ts' });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(JSON.stringify(result.content)).toContain('No project found');
  });
});
