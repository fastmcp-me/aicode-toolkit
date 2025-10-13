import chalk from 'chalk';
import gradient from 'gradient-string';
import { BANNER_GRADIENT } from '../constants';

/**
 * ASCII art for AICode Toolkit - simple and highly readable design
 * Uses clean block style with clear spacing
 */
const ASCII_ART = `
   █████╗ ██╗ ██████╗ ██████╗ ██████╗ ███████╗
  ██╔══██╗██║██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ███████║██║██║     ██║   ██║██║  ██║█████╗
  ██╔══██║██║██║     ██║   ██║██║  ██║██╔══╝
  ██║  ██║██║╚██████╗╚██████╔╝██████╔╝███████╗
  ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝

  ████████╗ ██████╗  ██████╗ ██╗     ██╗  ██╗██╗████████╗
  ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██║ ██╔╝██║╚══██╔══╝
     ██║   ██║   ██║██║   ██║██║     █████╔╝ ██║   ██║
     ██║   ██║   ██║██║   ██║██║     ██╔═██╗ ██║   ██║
     ██║   ╚██████╔╝╚██████╔╝███████╗██║  ██╗██║   ██║
     ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝
`;

/**
 * Displays the AICode Toolkit banner with gradient effect
 * Uses gradient-string with theme colors (primary green -> secondary teal)
 */
export function displayBanner(): void {
  // Create gradient: primary green -> secondary teal (theme colors)
  const bannerGradient = gradient(BANNER_GRADIENT);

  console.log(bannerGradient.multiline(ASCII_ART));
  console.log(bannerGradient('         AI-Powered Code Toolkit for Modern Development'));
  console.log(chalk.dim('         v0.6.0'));
  console.log(); // Empty line for spacing
}

/**
 * Simplified banner for compact display
 */
export function displayCompactBanner(): void {
  const titleGradient = gradient(BANNER_GRADIENT);

  console.log();
  console.log(chalk.bold('▸ ') + titleGradient('AICode Toolkit') + chalk.dim(' v0.6.0'));
  console.log(chalk.dim('  AI-Powered Code Toolkit'));
  console.log();
}
