import path from 'node:path';
import { log } from '@agiflowai/aicode-utils';
import type {
  IFileSystemService,
  ITemplateService,
  IVariableReplacementService,
} from '../types/interfaces';

export class VariableReplacementService implements IVariableReplacementService {
  private readonly binaryExtensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.pdf',
    '.zip',
    '.tar',
    '.gz',
    '.exe',
    '.dll',
    '.so',
    '.dylib',
  ];

  constructor(
    private fileSystem: IFileSystemService,
    private templateService: ITemplateService,
  ) {}

  async processFilesForVariableReplacement(
    dirPath: string,
    variables: Record<string, any>,
  ): Promise<void> {
    let items: string[] = [];
    try {
      items = await this.fileSystem.readdir(dirPath);
    } catch (error) {
      // If we can't read the directory, skip it
      log.warn(`Skipping directory ${dirPath}: ${error}`);
      return;
    }

    for (const item of items) {
      if (!item) continue; // Skip empty items

      const itemPath = path.join(dirPath, item);

      try {
        const stat = await this.fileSystem.stat(itemPath);

        if (stat.isDirectory()) {
          await this.processFilesForVariableReplacement(itemPath, variables);
        } else if (stat.isFile()) {
          await this.replaceVariablesInFile(itemPath, variables);
        }
      } catch (error) {
        log.warn(`Skipping item ${itemPath}: ${error}`);
      }
    }
  }

  async replaceVariablesInFile(filePath: string, variables: Record<string, any>): Promise<void> {
    try {
      // Skip binary files
      if (this.isBinaryFile(filePath)) {
        return;
      }

      const content = await this.fileSystem.readFile(filePath, 'utf8');

      // Render the template using template service
      const renderedContent = this.templateService.renderString(content, variables);

      await this.fileSystem.writeFile(filePath, renderedContent, 'utf8');
    } catch (error) {
      // If we can't read the file as text, skip it (likely binary)
      log.warn(`Skipping file ${filePath}: ${error}`);
    }
  }

  isBinaryFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.binaryExtensions.includes(ext);
  }
}
