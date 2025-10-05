import fs from 'fs-extra';
import type { IFileSystemService } from '../types/interfaces';

export class FileSystemService implements IFileSystemService {
  async pathExists(path: string): Promise<boolean> {
    return fs.pathExists(path);
  }

  async readFile(path: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    return fs.readFile(path, encoding);
  }

  async readJson(path: string): Promise<any> {
    return fs.readJson(path);
  }

  async writeFile(path: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    return fs.writeFile(path, content, encoding);
  }

  async ensureDir(path: string): Promise<void> {
    return fs.ensureDir(path);
  }

  async copy(src: string, dest: string): Promise<void> {
    return fs.copy(src, dest);
  }

  async readdir(path: string): Promise<string[]> {
    return fs.readdir(path);
  }

  async stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
    return fs.stat(path);
  }
}
