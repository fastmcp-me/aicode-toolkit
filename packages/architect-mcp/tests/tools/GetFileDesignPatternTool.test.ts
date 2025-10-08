/**
 * GetFileDesignPatternTool Tests
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
import { GetFileDesignPatternTool } from '../../src/tools/GetFileDesignPatternTool';

describe('GetFileDesignPatternTool', () => {
  const tool = new GetFileDesignPatternTool();

  it('should have correct metadata', () => {
    const definition = tool.getDefinition();

    expect(definition.name).toBeDefined();
    expect(definition.name).toBe(GetFileDesignPatternTool.TOOL_NAME);
    expect(definition.description).toContain('design pattern');
    expect(definition.inputSchema).toBeDefined();
  });

  it('should execute successfully with valid file path', async () => {
    const result = await tool.execute({ file_path: __filename });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.isError).toBeFalsy();
  });

  it('should handle errors gracefully', async () => {
    // Test with non-existent file
    const result = await tool.execute({ file_path: '/non/existent/path.ts' });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    // Should not throw, but may return error result
  });
});
