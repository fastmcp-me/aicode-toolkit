import chalk from 'chalk';

/**
 * Themed console utilities for consistent CLI output
 */

export const print = {
  /**
   * Log info message (cyan)
   */
  info: (message: string) => {
    console.log(chalk.cyan(message));
  },

  /**
   * Log success message (green)
   */
  success: (message: string) => {
    console.log(chalk.green(message));
  },

  /**
   * Log warning message (yellow)
   */
  warning: (message: string) => {
    console.log(chalk.yellow(message));
  },

  /**
   * Log error message (red)
   */
  error: (message: string, error?: Error | string) => {
    if (error) {
      const errorMsg = error instanceof Error ? error.message : error;
      console.error(chalk.red(message), errorMsg);
    } else {
      console.error(chalk.red(message));
    }
  },

  /**
   * Log debug message (gray)
   */
  debug: (message: string) => {
    console.log(chalk.gray(message));
  },

  /**
   * Log section header (bold cyan)
   */
  header: (message: string) => {
    console.log(chalk.bold.cyan(message));
  },

  /**
   * Log item in a list (gray with prefix)
   */
  item: (message: string) => {
    console.log(chalk.gray(`   - ${message}`));
  },

  /**
   * Log indented text (gray)
   */
  indent: (message: string) => {
    console.log(chalk.gray(`   ${message}`));
  },

  /**
   * Log highlighted text (bold green)
   */
  highlight: (message: string) => {
    console.log(chalk.bold.green(message));
  },

  /**
   * Empty line
   */
  newline: () => {
    console.log();
  },
};

/**
 * Emoji icons for consistent visual markers
 */
export const icons = {
  rocket: '🚀',
  check: '✅',
  cross: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  package: '📦',
  folder: '📁',
  file: '📄',
  config: '📝',
  wrench: '🔧',
  chart: '📊',
  bulb: '💡',
  download: '⬇️',
  upload: '⬆️',
  gear: '⚙️',
  clipboard: '📋',
  skip: '⏭',
};

/**
 * Themed message helpers
 */
export const messages = {
  /**
   * Display an info message with icon
   */
  info: (message: string) => {
    print.info(`${icons.info} ${message}`);
  },

  /**
   * Display a success message with icon
   */
  success: (message: string) => {
    print.success(`${icons.check} ${message}`);
  },

  /**
   * Display an error message with icon
   */
  error: (message: string, error?: Error | string) => {
    print.error(`${icons.cross} ${message}`, error);
  },

  /**
   * Display a warning message with icon
   */
  warning: (message: string) => {
    print.warning(`${icons.warning} ${message}`);
  },

  /**
   * Display a hint/tip message with icon
   */
  hint: (message: string) => {
    print.warning(`${icons.bulb} ${message}`);
  },

  /**
   * Display a loading/processing message with icon
   */
  loading: (message: string) => {
    print.info(`${icons.rocket} ${message}`);
  },
};

/**
 * Section formatters
 */
export const sections = {
  /**
   * Print a header section
   */
  header: (title: string) => {
    print.newline();
    print.header(`${title}`);
    print.newline();
  },

  /**
   * Print a list section with title
   */
  list: (title: string, items: string[]) => {
    print.header(`\n${title}\n`);
    items.forEach((item) => print.item(item));
  },

  /**
   * Print next steps section
   */
  nextSteps: (steps: string[]) => {
    print.header(`\n${icons.clipboard} Next steps:`);
    steps.forEach((step) => print.indent(step));
  },

  /**
   * Print created files section
   */
  createdFiles: (files: string[], maxShow: number = 10) => {
    print.header(`\n${icons.folder} Created files:`);
    const filesToShow = files.slice(0, maxShow);
    filesToShow.forEach((file) => print.item(file));
    if (files.length > maxShow) {
      print.indent(`... and ${files.length - maxShow} more files`);
    }
  },

  /**
   * Print warnings section
   */
  warnings: (warnings: string[]) => {
    print.warning(`\n${icons.warning} Warnings:`);
    warnings.forEach((warning) => print.item(warning));
  },
};
