import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { logger } from '../utils';

export function normalisePath(filePath: string): string;
export function normalisePath(filePath: string | undefined): string | undefined;

export function normalisePath(filePath: string | undefined) {
  if (filePath) {
    if (filePath.startsWith('~')) {
      filePath = path.join(os.homedir(), filePath.substring(1));
    }
  }
  return filePath;
}

export function getAbsolutePathInWorkspace(workspaceFolder: string, filePath: string): string {
  filePath = filePath.replaceAll('\\', '/').replaceAll('../', '');

  if (filePath.startsWith('~')) {
    filePath = 'home/' + filePath.substring(1);
  } else if (filePath.startsWith('/')) {
    filePath = 'root' + filePath;
  } else {
    filePath = filePath.replace(/^[^:]+:/, 'root');
  }
  let absolutePath = path.resolve(workspaceFolder, filePath);

  return absolutePath;
}

/**
 * Searches for the named file in the current directory, the home directory, and `~/.agents/`.
 * @param name The name of the file to search for.
 * @param extensions Optional list of file extensions to search for.
 *                Example: ['.yml', '.yaml']
 * @returns The path to the found file. Will include path if not in the current directory.
 */
export const findFile = async (name: string, extensions?: string[]): Promise<string> => {
  // Build a list of path variants
  const inHomeDir = path.join(os.homedir(), name);
  const inAgentsDir = path.join(os.homedir(), '.agents', name);

  const paths = [name, inHomeDir, inAgentsDir].reduce((paths: string[], path: string) => {
    if (extensions) {
      extensions.forEach((ext) => paths.push(`${path}${ext}`));
    } else {
      paths.push(path);
    }
    return paths;
  }, []);

  // logger.debug('Looking for file in\n  - ' + paths.join('\n  - '));

  // Find the first path that exists
  const found = (
    await Promise.all(
      paths.map(async (path) => {
        try {
          await fs.access(path, fs.constants.R_OK);
          logger.debug('  found', path);
          return path;
        } catch {
          return undefined;
        }
      }),
    )
  ).find((found) => found);

  if (!found) {
    throw paths;
  }

  return found;
};

/**
 * Searches for files with the given suffix in `configDir`, the home directory, and `~/.agents/`.
 * @param configDir The directory to search for files with the given suffix.
 * @param suffix The suffix to search for.
 * @returns The paths to the found files.
 */
export const findFilesBySuffix = async (configDir: string, suffix: string): Promise<string[]> => {
  const homeDir = os.homedir();
  const agentsDir = path.join(os.homedir(), '.agents');
  const paths = new Set([configDir, homeDir, agentsDir]);

  const found = await Promise.all(
    Array.from(paths).map(async (path) => {
      try {
        const files = await fs.readdir(path, { withFileTypes: true });
        return files
          .filter((file) => file.isFile() && file.name.endsWith(suffix))
          .map((file) => path + '/' + file.name);
      } catch {
        return [];
      }
    }),
  );

  return found.flat();
};
