import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const getRootPath = () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.join(__dirname, '../../../../..');
};

export const getProjectPath = (projectPath: string) => {
  return projectPath.replace(getRootPath(), '').replace('/', '');
};
