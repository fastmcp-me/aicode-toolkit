import { vi } from 'vitest';

// Virtual file system state
let virtualFS: Map<string, { content: string; isDirectory: boolean }> = new Map();

// Reset virtual file system
export const __resetVirtualFS = () => {
  virtualFS = new Map();
};

// Set virtual file or directory
export const __setVirtualFile = (path: string, content: string, isDirectory = false) => {
  virtualFS.set(path, { content, isDirectory });
};

// Mock implementations
export const pathExists = vi.fn(async (path: string) => {
  return virtualFS.has(path);
});

export const pathExistsSync = vi.fn((path: string) => {
  return virtualFS.has(path);
});

export const readFile = vi.fn(async (path: string, _encoding?: BufferEncoding) => {
  const file = virtualFS.get(path);
  if (!file || file.isDirectory) {
    throw new Error(`ENOENT: no such file, open '${path}'`);
  }
  return file.content;
});

export const readFileSync = vi.fn((path: string, _encoding?: BufferEncoding) => {
  const file = virtualFS.get(path);
  if (!file || file.isDirectory) {
    throw new Error(`ENOENT: no such file, open '${path}'`);
  }
  return file.content;
});

export const writeFile = vi.fn(
  async (path: string, content: string, _encoding?: BufferEncoding) => {
    virtualFS.set(path, { content, isDirectory: false });
  },
);

export const ensureDir = vi.fn(async (path: string) => {
  virtualFS.set(path, { content: '', isDirectory: true });
});

export const copy = vi.fn(async (src: string, dest: string) => {
  const file = virtualFS.get(src);
  if (!file) {
    throw new Error(`ENOENT: no such file or directory, copy '${src}' -> '${dest}'`);
  }
  virtualFS.set(dest, { ...file });
});

export const readdir = vi.fn(async (path: string) => {
  const dir = virtualFS.get(path);
  if (!dir || !dir.isDirectory) {
    throw new Error(`ENOTDIR: not a directory, scandir '${path}'`);
  }

  // Return files/dirs that are children of this path
  const children: string[] = [];
  const pathPrefix = path.endsWith('/') ? path : `${path}/`;

  for (const [filePath] of virtualFS) {
    if (filePath.startsWith(pathPrefix)) {
      const relativePath = filePath.substring(pathPrefix.length);
      const parts = relativePath.split('/');
      if (parts.length > 0 && parts[0] && !children.includes(parts[0])) {
        children.push(parts[0]);
      }
    }
  }

  return children;
});

export const stat = vi.fn(async (path: string) => {
  const file = virtualFS.get(path);
  if (!file) {
    throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
  }

  return {
    isDirectory: () => file.isDirectory,
    isFile: () => !file.isDirectory,
  };
});

export const readJson = vi.fn(async (path: string) => {
  const file = virtualFS.get(path);
  if (!file || file.isDirectory) {
    throw new Error(`ENOENT: no such file, open '${path}'`);
  }
  return JSON.parse(file.content);
});

export const remove = vi.fn(async (path: string) => {
  virtualFS.delete(path);
});

export default {
  pathExists,
  pathExistsSync,
  readFile,
  readFileSync,
  writeFile,
  ensureDir,
  copy,
  readdir,
  stat,
  readJson,
  remove,
};
