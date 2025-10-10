# Edit File with Design Pattern Check

**IMPORTANT: You MUST follow this exact workflow. Do NOT skip any steps.**

## Intelligent Pattern Filtering

This workflow uses **AI-powered pattern filtering** via the `aicode-develop` plugin. When you call `get-file-design-pattern`, the tool:

1. Reads the file content
2. Uses Claude Code CLI to analyze which patterns are actually relevant
3. Returns only the patterns that apply to this specific file

This means you get **precise, context-aware guidance** instead of seeing all possible patterns.

## Workflow

### Step 1: Get Design Patterns (REQUIRED)
Before making ANY edits, you MUST check the file's design patterns and coding rules:

```
Use the MCP tool: get-file-design-pattern
```

**What happens:**
- Tool analyzes the file content using AI
- Filters patterns to show only relevant ones
- Returns must-do, should-do, and must-not-do rules
- Provides code examples

**Display to user:**
- Show the relevant design patterns found
- Highlight must-do and must-not-do rules
- Explain why these patterns apply

### Step 2: Plan Your Edit
Based on the design patterns:
- Identify which patterns apply to your changes
- Plan how to follow the must-do rules
- Plan how to avoid must-not-do violations
- Consider the should-do best practices

**Ask the user:** "I found these design patterns. Should I proceed with the edit following these guidelines?"

### Step 3: Make the Edit
Only after Step 1 and 2, make your changes:
- Follow the design patterns shown
- Adhere to must-do rules
- Avoid must-not-do violations
- Apply should-do best practices

### Step 4: Review Changes (REQUIRED)
After making edits, you MUST review your changes:

```
Use the MCP tool: review-code-change
```

**What to check:**
- Must-not-do violations (CRITICAL)
- Must-do missing (REQUIRED patterns not followed)
- Should-do suggestions (improvements)

### Step 5: Fix Violations
If the review finds violations:
- Fix all must-not-do violations (CRITICAL)
- Add missing must-do patterns (REQUIRED)
- Consider should-do suggestions

**Repeat Step 4 after fixes** until no critical violations remain.

## Example Workflow

**User:** "Edit src/app/products/page.tsx to add a loading state"

**You (Step 1 - Get Patterns):**
```
Using get-file-design-pattern for src/app/products/page.tsx...

Found design patterns:
- Next.js App Router Pattern
- React Server Components Pattern

Must-do rules:
✓ Use async functions for server components
✓ Handle loading states with Suspense boundaries
✓ Use named exports for page metadata

Must-not-do rules:
✗ Do not use client-side state in server components
✗ Do not import client components without 'use client'
```

**You (Step 2 - Plan):**
"I found the design patterns. For adding a loading state, I should:
1. Create a loading.tsx file (Next.js convention)
2. Use Suspense boundary for streaming
3. Keep the page as a server component

Should I proceed with this approach?"

**User:** "Yes, proceed"

**You (Step 3 - Edit):**
[Makes the edit following the patterns]

**You (Step 4 - Review):**
```
Using review-code-change for src/app/products/loading.tsx...

✓ No violations found
✓ All must-do rules followed
✓ Suggestion: Consider adding skeleton loading UI
```

**You (Step 5 - Report):**
"Edit complete! The changes follow all design patterns and rules. Would you like me to implement the suggested skeleton loading UI?"

## Rules for This Command

1. **NEVER skip Step 1** - Always check design patterns first
2. **ALWAYS wait for user confirmation** after showing patterns
3. **NEVER skip Step 4** - Always review changes after editing
4. **FIX all critical violations** before considering the edit complete
5. **INFORM the user** of any violations found and how you fixed them

## When to Use This Command

Use this command when:
- Editing existing files in a project with design patterns
- Working on established codebases
- Need to ensure consistency with team standards
- Want to avoid introducing architectural debt

## What This Command Does

This command enforces a quality-first workflow:
1. ✅ Prevents pattern violations before they happen
2. ✅ Ensures changes follow established architecture
3. ✅ Catches violations immediately after editing
4. ✅ Maintains code quality and consistency
5. ✅ Documents why changes were made a certain way

## Integration with Plugins

This command works with the **aicode-develop** plugin which includes:
- AI-powered pattern filtering (via `get-file-design-pattern`)
- Feature scaffolding (via `use-scaffold-method`)

For code review after editing, also install **aicode-review**:
```bash
/plugin install aicode-develop@aicode-toolkit
/plugin install aicode-review@aicode-toolkit
```

## AI-Powered Intelligence

The pattern filtering is intelligent because:
- Analyzes your actual file content (not just file path)
- Understands code structure and intent
- Filters out irrelevant patterns
- Shows only applicable rules

This reduces noise and gives you precise, actionable guidance for your specific file.
