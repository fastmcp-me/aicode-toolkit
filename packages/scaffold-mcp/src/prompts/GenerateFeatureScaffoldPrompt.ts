import type { PromptDefinition, PromptMessage } from './types';

/**
 * Prompt for generating feature scaffolds
 */
export class GenerateFeatureScaffoldPrompt {
  static readonly PROMPT_NAME = 'generate-feature-scaffold';

  /**
   * Get the prompt definition for MCP
   */
  getDefinition(): PromptDefinition {
    return {
      name: GenerateFeatureScaffoldPrompt.PROMPT_NAME,
      description: 'Generate a new feature scaffold configuration',
      arguments: [
        {
          name: 'request',
          description: 'Describe the feature scaffold you want to create',
          required: false,
        },
      ],
    };
  }

  /**
   * Get the prompt messages
   */
  getMessages(args?: { request?: string }): PromptMessage[] {
    const userRequest = args?.request || '';

    return [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `You are helping create a new feature scaffold configuration using the scaffold-mcp MCP tools.

${userRequest ? `User request: ${userRequest}\n` : ''}
Your task:

1. **Gather Information**: Ask for any missing details:
   - Template name (e.g., "nextjs-15", "react-vite")
   - Feature name (prefixed with "scaffold-", e.g., "scaffold-nextjs-page")
   - Feature type (page, component, service, etc.)
   - Variables needed
   - Files to include

2. **Use MCP Tools** in order:
   - \`generate-feature-scaffold\` - Creates the feature configuration
   - \`generate-boilerplate-file\` - Creates each template file
   - \`list-scaffolding-methods\` - Verify it appears
   - \`use-scaffold-method\` - Test the feature

Important:
- Feature names: prefix with "scaffold-"
- Conditional includes: use "file.tsx?withLayout=true"
- Template syntax: use {{ variableName }}

**Description Field Guidelines (CRITICAL)**:
The description should explain what the feature scaffold generates (2-3 sentences):
- Sentence 1: What type of code it generates (component, page, service, etc.)
- Sentence 2: Key features or capabilities included
- Sentence 3: Primary use cases or when to use it

Example:
"Generate a new service class for TypeScript libraries following best practices. Creates a service class with interface, implementation, and unit tests. Perfect for creating reusable service modules with dependency injection patterns."

**Instruction Field Guidelines (CRITICAL)**:
The instruction should provide specific guidance for using the generated feature:

1. **Pattern explanation**: Describe the architectural pattern used
2. **File organization**: Where files should be placed
3. **Naming conventions**: How to name things (PascalCase, camelCase, etc.)
4. **Usage guidelines**: How to use the generated code
5. **Testing approach**: How to test the feature

Example structure:
"[Feature type] follow a [pattern name] pattern with [key characteristics].
[Explanation of how it works and integrates with the project].
Place [files] in [directory].
For [features with X], define [Y] in [Z] for better separation of concerns.
[Feature names] should be [case style] and [suffix/prefix rules].
Write comprehensive [tests/docs] for all [public methods/exports]."

Keep it concise but informative - focus on the patterns and conventions that AI needs to understand to work with the generated code effectively.

Template File Content Guidelines:
- Keep content MINIMAL and business-agnostic
- Focus on structure and patterns, not business logic
- Use placeholder/generic examples only
- Include essential boilerplate code only
- Let AI fill in specific logic later
- Add clear headers with design patterns and coding standards`,
        },
      },
    ];
  }
}
