/**
 * Theme color constants for AICode Toolkit
 * Defines the brand color palette used throughout the CLI
 */
export const THEME = {
  colors: {
    primary: {
      default: '#10b981',
      dark: '#059669',
      text: '#ffffff',
    },
    secondary: {
      default: '#0d9488',
      dark: '#0f766e',
      light: '#14b8a6',
      text: '#ffffff',
    },
    accent: {
      default: '#c44569',
      dark: '#c44569',
      text: '#2a0b14',
    },
    semantic: {
      info: '#5fb3d4',
      success: '#5fb368',
      error: '#d45959',
      alert: '#d4b359',
    },
    cta: {
      from: '#10b981',
      to: '#0d9488',
      text: '#ffffff',
    },
    transparent: 'rgba(0, 0, 0, 0)',
    white: '#c4cccf',
    black: '#424549',
    background: {
      dark: {
        default: '#0f0f0f',
        shade: '#141414',
        dark: '#0a0a0a',
        light: '#1a1a1a',
      },
      light: {
        default: '#fff',
        shade: '#EAEAEA',
        dark: '#17202a',
        light: '#EAEAEA',
      },
    },
  },
} as const;

/**
 * Gradient colors for banner (primary green -> secondary teal)
 */
export const BANNER_GRADIENT = [
  THEME.colors.primary.default,
  THEME.colors.primary.dark,
  THEME.colors.secondary.default,
  THEME.colors.secondary.dark,
];
