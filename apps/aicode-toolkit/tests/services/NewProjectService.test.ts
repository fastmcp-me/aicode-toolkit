/**
 * NewProjectService Tests
 *
 * TESTING PATTERNS:
 * - Unit tests with mocked dependencies
 * - Test each method independently
 * - Cover success cases, edge cases, and error handling
 *
 * CODING STANDARDS:
 * - Use descriptive test names (should...)
 * - Arrange-Act-Assert pattern
 * - Mock external dependencies
 * - Test behavior, not implementation
 */

import { ProjectType } from '@agiflowai/aicode-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NewProjectService, RESERVED_PROJECT_NAMES } from '../../src/services/NewProjectService';

describe('NewProjectService', () => {
  describe('constructor', () => {
    it('should initialize with provided name and project type', () => {
      const service = new NewProjectService('my-project', ProjectType.MONOLITH);

      expect(service.getProvidedName()).toBe('my-project');
      expect(service.getProvidedProjectType()).toBe(ProjectType.MONOLITH);
    });

    it('should initialize with undefined values when not provided', () => {
      const service = new NewProjectService();

      expect(service.getProvidedName()).toBeUndefined();
      expect(service.getProvidedProjectType()).toBeUndefined();
    });
  });

  describe('validateProjectName', () => {
    let service: NewProjectService;

    beforeEach(() => {
      service = new NewProjectService();
    });

    it('should return true for valid project name', () => {
      expect(service.validateProjectName('my-project')).toBe(true);
      expect(service.validateProjectName('MyProject')).toBe(true);
      expect(service.validateProjectName('project123')).toBe(true);
      expect(service.validateProjectName('my_project')).toBe(true);
    });

    it('should return error for empty project name', () => {
      expect(service.validateProjectName('')).toBe('Project name is required');
      expect(service.validateProjectName('   ')).toBe('Project name is required');
    });

    it('should return error for project name not starting with letter or number', () => {
      expect(service.validateProjectName('-project')).toBe(
        'Project name must start with a letter or number',
      );
      expect(service.validateProjectName('_project')).toBe(
        'Project name must start with a letter or number',
      );
    });

    it('should return error for project name with invalid characters', () => {
      expect(service.validateProjectName('my project')).toBe(
        'Project name can only contain letters, numbers, hyphens, and underscores',
      );
      expect(service.validateProjectName('my@project')).toBe(
        'Project name can only contain letters, numbers, hyphens, and underscores',
      );
    });

    it('should return error for reserved project names', () => {
      // Test uppercase reserved names (CON, PRN, AUX, etc.)
      const uppercaseReserved = RESERVED_PROJECT_NAMES.filter((name) => /^[A-Z]/.test(name));
      for (const reserved of uppercaseReserved) {
        expect(service.validateProjectName(reserved)).toBe('Project name uses a reserved name');
        expect(service.validateProjectName(reserved.toLowerCase())).toBe(
          'Project name uses a reserved name',
        );
      }
    });
  });

  describe('validateProjectType', () => {
    let service: NewProjectService;

    beforeEach(() => {
      service = new NewProjectService();
    });

    it('should not throw for valid project types', () => {
      expect(() => service.validateProjectType(ProjectType.MONOLITH)).not.toThrow();
      expect(() => service.validateProjectType(ProjectType.MONOREPO)).not.toThrow();
    });

    it('should throw for invalid project type', () => {
      expect(() => service.validateProjectType('invalid')).toThrow(
        "Invalid project type 'invalid'. Must be 'monolith' or 'monorepo'",
      );
    });
  });

  describe('validateRepositoryUrl', () => {
    let service: NewProjectService;

    beforeEach(() => {
      service = new NewProjectService();
    });

    it('should return true for valid repository URLs', () => {
      expect(service.validateRepositoryUrl('https://github.com/user/repo')).toBe(true);
      expect(service.validateRepositoryUrl('http://github.com/user/repo')).toBe(true);
      expect(service.validateRepositoryUrl('git@github.com:user/repo.git')).toBe(true);
    });

    it('should return error for empty URL', () => {
      expect(service.validateRepositoryUrl('')).toBe('Repository URL is required');
      expect(service.validateRepositoryUrl('   ')).toBe('Repository URL is required');
    });

    it('should return error for invalid URL format', () => {
      expect(service.validateRepositoryUrl('not-a-url')).toBe(
        'Please enter a valid Git repository URL',
      );
      expect(service.validateRepositoryUrl('ftp://example.com')).toBe(
        'Please enter a valid Git repository URL',
      );
    });
  });

  describe('getProvidedName', () => {
    it('should return provided name from constructor', () => {
      const service = new NewProjectService('test-project');
      expect(service.getProvidedName()).toBe('test-project');
    });

    it('should return undefined when not provided', () => {
      const service = new NewProjectService();
      expect(service.getProvidedName()).toBeUndefined();
    });
  });

  describe('getProvidedProjectType', () => {
    it('should return provided project type from constructor', () => {
      const service = new NewProjectService(undefined, ProjectType.MONOREPO);
      expect(service.getProvidedProjectType()).toBe(ProjectType.MONOREPO);
    });

    it('should return undefined when not provided', () => {
      const service = new NewProjectService();
      expect(service.getProvidedProjectType()).toBeUndefined();
    });
  });
});
