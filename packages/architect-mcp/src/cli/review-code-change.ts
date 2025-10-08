/**
 * Review Code Change Command
 *
 * DESIGN PATTERNS:
 * - Command pattern with Commander for CLI argument parsing
 * - Async/await pattern for asynchronous operations
 * - Error handling pattern with try-catch and proper exit codes
 *
 * CODING STANDARDS:
 * - Use async action handlers for asynchronous operations
 * - Provide clear option descriptions and default values
 * - Handle errors gracefully with process.exit()
 * - Log progress and errors to console
 * - Use Commander's .option() and .argument() for inputs
 *
 * AVOID:
 * - Synchronous blocking operations in action handlers
 * - Missing error handling (always use try-catch)
 * - Hardcoded values (use options or environment variables)
 * - Not exiting with appropriate exit codes on errors
 */

import { Command } from 'commander';
import { ReviewCodeChangeTool } from '../tools/ReviewCodeChangeTool';

interface ReviewCodeChangeOptions {
  verbose?: boolean;
  json?: boolean;
}

/**
 * Review code changes against template-specific and global rules to identify violations
 */
export const reviewCodeChangeCommand = new Command('review-code-change')
  .description('Review code changes against template-specific and global rules to identify violations')
  .argument('<file-path>', 'Path to the file to review')
  .option('-v, --verbose', 'Enable verbose output', false)
  .option('-j, --json', 'Output as JSON', false)
  .action(async (filePath: string, options: ReviewCodeChangeOptions) => {
    try {
      if (options.verbose) {
        console.log('Reviewing file:', filePath);
      }

      // Create tool instance
      const tool = new ReviewCodeChangeTool();

      // Execute the tool
      const result = await tool.execute({
        file_path: filePath,
      });

      // Parse and display result
      if (result.isError) {
        const errorData = JSON.parse(result.content[0].text as string);
        console.error('❌ Error:', errorData.error || errorData);
        process.exit(1);
      }

      const data = JSON.parse(result.content[0].text as string);

      if (options.json) {
        // Output raw JSON
        console.log(JSON.stringify(data, null, 2));
      } else {
        // Pretty print the results
        console.log(`\n## ${data.file_path}`);

        if (data.project_name) {
          console.log(`Project: ${data.project_name}`);
        }

        if (data.source_template) {
          console.log(`Template: ${data.source_template}`);
        }

        if (data.matched_rules) {
          console.log('\n### Matched Rule Pattern\n');
          console.log(`**${data.matched_rules.pattern}**`);
          console.log(data.matched_rules.description);
          console.log('');
        }

        // Display severity
        const severityEmoji: Record<string, string> = {
          LOW: '🟢',
          MEDIUM: '🟡',
          HIGH: '🔴',
        };
        console.log(`### Review Result: ${severityEmoji[data.severity] || '⚪'} ${data.severity}\n`);

        // Display feedback
        if (data.review_feedback) {
          console.log(data.review_feedback);
          console.log('');
        }

        // Display issues found
        if (data.issues_found && data.issues_found.length > 0) {
          console.log('### Issues Found\n');

          const groupedIssues: Record<string, any[]> = {
            must_not_do: [],
            must_do: [],
            should_do: [],
          };

          for (const issue of data.issues_found) {
            if (groupedIssues[issue.type]) {
              groupedIssues[issue.type].push(issue);
            }
          }

          if (groupedIssues.must_not_do.length > 0) {
            console.log('**❌ Must Not Do Violations:**\n');
            for (const issue of groupedIssues.must_not_do) {
              console.log(`- ${issue.rule}`);
              if (issue.violation) {
                console.log(`  Violation: ${issue.violation}`);
              }
            }
            console.log('');
          }

          if (groupedIssues.must_do.length > 0) {
            console.log('**⚠️ Must Do Missing:**\n');
            for (const issue of groupedIssues.must_do) {
              console.log(`- ${issue.rule}`);
              if (issue.violation) {
                console.log(`  Note: ${issue.violation}`);
              }
            }
            console.log('');
          }

          if (groupedIssues.should_do.length > 0) {
            console.log('**💡 Should Do Suggestions:**\n');
            for (const issue of groupedIssues.should_do) {
              console.log(`- ${issue.rule}`);
              if (issue.violation) {
                console.log(`  Note: ${issue.violation}`);
              }
            }
            console.log('');
          }
        } else {
          console.log('✅ No violations found!\n');
        }
      }
    } catch (error) {
      console.error('❌ Error executing review-code-change:', error);
      process.exit(1);
    }
  });
