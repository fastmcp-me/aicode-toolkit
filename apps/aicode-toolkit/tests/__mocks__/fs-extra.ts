import { vi } from 'vitest';

export const ensureDir = vi.fn();
export const pathExists = vi.fn();
export const readFile = vi.fn();
export const writeFile = vi.fn();
export const readdir = vi.fn();
export const copy = vi.fn();
export const remove = vi.fn();
export const mkdir = vi.fn();
export const readJson = vi.fn();
export const stat = vi.fn();

export default {
  ensureDir,
  pathExists,
  readFile,
  writeFile,
  readdir,
  copy,
  remove,
  mkdir,
  readJson,
  stat,
};
