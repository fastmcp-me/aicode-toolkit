/**
 * Type declarations for text file imports with import attributes
 */

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare module '*.liquid?raw' {
  const content: string;
  export default content;
}
