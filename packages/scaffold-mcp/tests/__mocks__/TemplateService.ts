import { vi } from 'vitest';
import type { ITemplateService } from '../../src/types/interfaces';

export const createMockTemplateService = (): ITemplateService => ({
  render: vi.fn().mockResolvedValue('rendered content'),
  renderString: vi
    .fn()
    .mockImplementation((template: string) => template.replace(/\{\{(\w+)\}\}/g, 'value')),
});
