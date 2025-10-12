import { beforeEach, describe, expect, it, vi } from 'vitest';
import { icons, messages, print, sections } from '../../src/utils/print';

// Mock console methods
const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('print utils', () => {
  beforeEach(() => {
    mockLog.mockClear();
    mockError.mockClear();
  });

  describe('print', () => {
    it('should log info messages', () => {
      print.info('test message');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('test message'));
    });

    it('should log success messages', () => {
      print.success('success message');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('success message'));
    });

    it('should log warning messages', () => {
      print.warning('warning message');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('warning message'));
    });

    it('should log error messages', () => {
      print.error('error message');

      expect(mockError).toHaveBeenCalledTimes(1);
      expect(mockError).toHaveBeenCalledWith(expect.stringContaining('error message'));
    });

    it('should log error with Error object', () => {
      const error = new Error('test error');
      print.error('error occurred', error);

      expect(mockError).toHaveBeenCalledTimes(1);
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining('error occurred'),
        'test error',
      );
    });

    it('should log error with error string', () => {
      print.error('error occurred', 'error details');

      expect(mockError).toHaveBeenCalledTimes(1);
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining('error occurred'),
        'error details',
      );
    });

    it('should log debug messages', () => {
      print.debug('debug message');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('debug message'));
    });

    it('should log header messages', () => {
      print.header('Header Title');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Header Title'));
    });

    it('should log list items with prefix', () => {
      print.item('list item');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('- list item'));
    });

    it('should log indented text', () => {
      print.indent('indented text');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('indented text'));
    });

    it('should log highlighted text', () => {
      print.highlight('important text');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('important text'));
    });

    it('should log newlines', () => {
      print.newline();

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith();
    });
  });

  describe('icons', () => {
    it('should have all required icons', () => {
      expect(icons.check).toBeDefined();
      expect(icons.cross).toBeDefined();
      expect(icons.warning).toBeDefined();
      expect(icons.info).toBeDefined();
      expect(icons.rocket).toBeDefined();
      expect(icons.folder).toBeDefined();
      expect(icons.file).toBeDefined();
      expect(icons.bulb).toBeDefined();
    });
  });

  describe('messages', () => {
    it('should display info message with icon', () => {
      messages.info('info message');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('info message'));
    });

    it('should display success message with icon', () => {
      messages.success('success message');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('success message'));
    });

    it('should display error message with icon', () => {
      messages.error('error message');

      expect(mockError).toHaveBeenCalledTimes(1);
      expect(mockError).toHaveBeenCalledWith(expect.stringContaining('error message'));
    });

    it('should display warning message with icon', () => {
      messages.warning('warning message');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('warning message'));
    });

    it('should display hint message with icon', () => {
      messages.hint('helpful tip');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('helpful tip'));
    });

    it('should display loading message with icon', () => {
      messages.loading('processing...');

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('processing...'));
    });
  });

  describe('sections', () => {
    it('should print header section', () => {
      sections.header('Section Title');

      expect(mockLog).toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Section Title'));
    });

    it('should print list section with items', () => {
      sections.list('My List', ['item 1', 'item 2', 'item 3']);

      expect(mockLog).toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('My List'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('item 1'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('item 2'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('item 3'));
    });

    it('should print next steps section', () => {
      sections.nextSteps(['step 1', 'step 2']);

      expect(mockLog).toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Next steps'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('step 1'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('step 2'));
    });

    it('should print created files section', () => {
      sections.createdFiles(['file1.ts', 'file2.ts', 'file3.ts']);

      expect(mockLog).toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Created files'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('file1.ts'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('file2.ts'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('file3.ts'));
    });

    it('should limit displayed files when exceeding max', () => {
      const files = Array.from({ length: 15 }, (_, i) => `file${i + 1}.ts`);
      sections.createdFiles(files, 5);

      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('file1.ts'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('file5.ts'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('10 more files'));
    });

    it('should print warnings section', () => {
      sections.warnings(['warning 1', 'warning 2']);

      expect(mockLog).toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Warnings'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('warning 1'));
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('warning 2'));
    });
  });
});
