import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import * as fs from 'fs-extra';

const execAsync = promisify(exec);

/**
 * Parse GitHub URL to detect if it's a subdirectory
 * Supports formats:
 * - https://github.com/user/repo
 * - https://github.com/user/repo/tree/branch/path/to/dir
 * - https://github.com/user/repo/tree/main/path/to/dir
 */
export function parseGitHubUrl(url: string): {
  owner?: string;
  repo?: string;
  repoUrl: string;
  branch?: string;
  subdirectory?: string;
  isSubdirectory: boolean;
} {
  // Match GitHub URL patterns
  const treeMatch = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/,
  );
  const blobMatch = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/,
  );
  const rootMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);

  if (treeMatch || blobMatch) {
    const match = treeMatch || blobMatch;
    return {
      owner: match![1],
      repo: match![2],
      repoUrl: `https://github.com/${match![1]}/${match![2]}.git`,
      branch: match![3],
      subdirectory: match![4],
      isSubdirectory: true,
    };
  }

  if (rootMatch) {
    return {
      owner: rootMatch[1],
      repo: rootMatch[2],
      repoUrl: `https://github.com/${rootMatch[1]}/${rootMatch[2]}.git`,
      isSubdirectory: false,
    };
  }

  // If it doesn't match GitHub patterns, assume it's a direct git URL
  return {
    repoUrl: url,
    isSubdirectory: false,
  };
}

/**
 * Clone a subdirectory from a git repository using sparse checkout
 */
export async function cloneSubdirectory(
  repoUrl: string,
  branch: string,
  subdirectory: string,
  targetFolder: string,
): Promise<void> {
  const tempFolder = `${targetFolder}.tmp`;

  try {
    // Initialize a new git repo
    await execAsync(`git init "${tempFolder}"`);

    // Add remote
    await execAsync(`git -C "${tempFolder}" remote add origin ${repoUrl}`);

    // Enable sparse checkout
    await execAsync(`git -C "${tempFolder}" config core.sparseCheckout true`);

    // Configure sparse checkout to only include the subdirectory
    const sparseCheckoutFile = path.join(tempFolder, '.git', 'info', 'sparse-checkout');
    await fs.writeFile(sparseCheckoutFile, `${subdirectory}\n`);

    // Pull the specific branch
    await execAsync(`git -C "${tempFolder}" pull --depth=1 origin ${branch}`);

    // Move the subdirectory content to target folder
    const sourceDir = path.join(tempFolder, subdirectory);
    if (!(await fs.pathExists(sourceDir))) {
      throw new Error(
        `Subdirectory '${subdirectory}' not found in repository at branch '${branch}'`,
      );
    }

    await fs.move(sourceDir, targetFolder);

    // Clean up temp folder
    await fs.remove(tempFolder);
  } catch (error) {
    // Clean up temp folder on error
    if (await fs.pathExists(tempFolder)) {
      await fs.remove(tempFolder);
    }
    throw error;
  }
}

/**
 * Clone entire repository
 */
export async function cloneRepository(repoUrl: string, targetFolder: string): Promise<void> {
  await execAsync(`git clone ${repoUrl} "${targetFolder}"`);

  // Remove .git folder
  const gitFolder = path.join(targetFolder, '.git');
  if (await fs.pathExists(gitFolder)) {
    await fs.remove(gitFolder);
  }
}

/**
 * Fetch directory listing from GitHub API
 */
export async function fetchGitHubDirectoryContents(
  owner: string,
  repo: string,
  path: string,
  branch = 'main',
): Promise<Array<{ name: string; type: string; path: string }>> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'scaffold-mcp',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch directory contents: ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Expected directory but got file');
  }

  return data.map((item: any) => ({
    name: item.name,
    type: item.type,
    path: item.path,
  }));
}
