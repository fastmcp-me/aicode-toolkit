import { Liquid } from 'liquidjs';

export interface ITemplateService {
  renderString(template: string, variables: Record<string, any>): string;
  containsTemplateVariables(content: string): boolean;
}

export class TemplateService implements ITemplateService {
  private liquid: Liquid;

  constructor() {
    // Configure LiquidJS engine with custom filters
    this.liquid = new Liquid({
      strictFilters: false, // Don't throw on undefined filters
      strictVariables: false, // Don't throw on undefined variables
    });

    // Add custom filters for common transformations
    this.setupCustomFilters();
  }

  private toPascalCase(str: string): string {
    const camelCase = str.replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''));
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  private setupCustomFilters(): void {
    // Convert to camelCase
    this.liquid.registerFilter('camelCase', (str: string) => {
      return str.replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''));
    });

    // Convert to PascalCase
    this.liquid.registerFilter('pascalCase', (str: string) => {
      return this.toPascalCase(str);
    });

    // Convert to TitleCase (alias for PascalCase)
    this.liquid.registerFilter('titleCase', (str: string) => {
      return this.toPascalCase(str);
    });

    // Convert to kebab-case
    this.liquid.registerFilter('kebabCase', (str: string) => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    });

    // Convert to snake_case
    this.liquid.registerFilter('snakeCase', (str: string) => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
    });

    // Convert to UPPER_CASE
    this.liquid.registerFilter('upperCase', (str: string) => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toUpperCase();
    });

    // Convert to lowercase
    this.liquid.registerFilter('lower', (str: string) => str.toLowerCase());

    // Convert to uppercase
    this.liquid.registerFilter('upper', (str: string) => str.toUpperCase());

    // Pluralize (simple implementation)
    this.liquid.registerFilter('pluralize', (str: string) => {
      if (str.endsWith('y')) {
        return `${str.slice(0, -1)}ies`;
      } else if (
        str.endsWith('s') ||
        str.endsWith('sh') ||
        str.endsWith('ch') ||
        str.endsWith('x') ||
        str.endsWith('z')
      ) {
        return `${str}es`;
      } else {
        return `${str}s`;
      }
    });

    // Singularize (simple implementation)
    this.liquid.registerFilter('singularize', (str: string) => {
      if (str.endsWith('ies')) {
        return `${str.slice(0, -3)}y`;
      } else if (str.endsWith('es')) {
        return str.slice(0, -2);
      } else if (str.endsWith('s') && !str.endsWith('ss')) {
        return str.slice(0, -1);
      } else {
        return str;
      }
    });
  }

  renderString(template: string, variables: Record<string, any>): string {
    try {
      // LiquidJS parseAndRenderSync is synchronous
      return this.liquid.parseAndRenderSync(template, variables);
    } catch (error) {
      console.warn(`LiquidJS rendering error: ${error}`);
      return template; // Return original template if rendering fails
    }
  }

  containsTemplateVariables(content: string): boolean {
    // Check for Liquid/Nunjucks template syntax: {{ }}, {% %}
    // Note: Liquid doesn't use {# #} for comments, it uses {% comment %}
    const liquidPatterns = [
      /\{\{.*?\}\}/, // Variables: {{ variable }}
      /\{%.*?%\}/, // Tags: {% if %}, {% for %}, etc.
    ];

    return liquidPatterns.some((pattern) => pattern.test(content));
  }
}
