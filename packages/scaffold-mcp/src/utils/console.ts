import chalk from 'chalk';

/**
 * Themed console utilities for consistent CLI output
 */

export const logger = {
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
  rocket: '=�',
  check: '',
  cross: 'L',
  warning: '�',
  info: '9',
  package: '=�',
  folder: '=�',
  file: '📄',
  config: '📝',
  wrench: '🔧',
  chart: '📊',
  bulb: '💡',
  download: '=�',
  upload: '=�',
  gear: '�',
  clipboard: '=�',
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
    logger.info(`${icons.info} ${message}`);
  },

  /**
   * Display a success message with icon
   */
  success: (message: string) => {
    logger.success(`${icons.check} ${message}`);
  },

  /**
   * Display an error message with icon
   */
  error: (message: string, error?: Error | string) => {
    logger.error(`${icons.cross} ${message}`, error);
  },

  /**
   * Display a warning message with icon
   */
  warning: (message: string) => {
    logger.warning(`${icons.warning} ${message}`);
  },

  /**
   * Display a hint/tip message with icon
   */
  hint: (message: string) => {
    logger.warning(`${icons.bulb} ${message}`);
  },

  /**
   * Display a loading/processing message with icon
   */
  loading: (message: string) => {
    logger.info(`${icons.rocket} ${message}`);
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
    logger.newline();
    logger.header(`${title}`);
    logger.newline();
  },

  /**
   * Print a list section with title
   */
  list: (title: string, items: string[]) => {
    logger.header(`\n${title}\n`);
    items.forEach((item) => logger.item(item));
  },

  /**
   * Print next steps section
   */
  nextSteps: (steps: string[]) => {
    logger.header(`\n${icons.clipboard} Next steps:`);
    steps.forEach((step) => logger.indent(step));
  },

  /**
   * Print created files section
   */
  createdFiles: (files: string[], maxShow: number = 10) => {
    logger.header(`\n${icons.folder} Created files:`);
    const filesToShow = files.slice(0, maxShow);
    filesToShow.forEach((file) => logger.item(file));
    if (files.length > maxShow) {
      logger.indent(`... and ${files.length - maxShow} more files`);
    }
  },

  /**
   * Print warnings section
   */
  warnings: (warnings: string[]) => {
    logger.warning(`\n${icons.warning} Warnings:`);
    warnings.forEach((warning) => logger.item(warning));
  },
};
