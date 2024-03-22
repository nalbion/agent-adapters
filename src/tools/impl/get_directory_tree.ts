import fs from 'fs';
import path from 'path';
import { ToolManager } from '../ToolManager';
import { ToolContext } from '../ToolTypes';

export const TOOL_GET_DIRECTORY_TREE = 'get_directory_tree';

/**
 * Renders the directory tree structure in a simplified format.
 *
 * @param dirPath The starting directory path.
 * @param depth how deep to go into the directory tree
 * @param prefix Prefix for the current item, used for recursion.
 * @param rootPath The root directory path - also used for recursion.
 * @returns A string representation of the directory tree.
 */
export const get_directory_tree = (
  dirPath: string,
  depth: number = Number.MAX_VALUE,
  prefix = '',
  rootPath: string | null = null,
): string => {
  let output = '';
  const indent = '  ';

  if (rootPath === null) {
    rootPath = dirPath;
  }

  if (fs.statSync(dirPath).isDirectory()) {
    if (rootPath === dirPath) {
      output += '/';
    } else {
      const dirName = path.basename(dirPath);
      output += `${prefix}/${dirName}`;
    }

    const items = fs.readdirSync(dirPath);
    const dirs: string[] = [];
    const files: string[] = [];

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      if (shouldIgnoreFile(itemPath)) {
        continue;
      }

      if (fs.statSync(itemPath).isDirectory()) {
        dirs.push(item);
      } else {
        // if (fs.statSync(itemPath).isFile()) {
        files.push(item);
      }
    }

    dirs.sort();
    files.sort();

    if (dirs.length) {
      if (depth === 0) {
        output += ` [... ${dirs.length} more directories]\n`;
      } else {
        output += '\n';
        const newPrefix = prefix + indent;
        for (const dir of dirs) {
          const itemPath = path.join(dirPath, dir);
          output += get_directory_tree(itemPath, depth - 1, newPrefix, rootPath);
        }
      }

      if (files.length) {
        output += `${prefix}  ${files.join(', ')}\n`;
      }
    } else if (files.length) {
      output += `: ${files.join(', ')}\n`;
    } else {
      output += '\n';
    }
  }

  return output;
};

const ignorePaths = [
  '.git',
  '.gpt-pilot',
  '.idea',
  '.vscode',
  '.next',
  '.DS_Store',
  '__pycache__',
  'node_modules',
  'package-lock.json',
  'venv',
  'dist',
  'build',
  'target',
  '*.min.js',
  '*.min.css',
  '*.svg',
  '*.csv',
  '*.log',
  'go.sum',
];

function shouldIgnoreFile(filePath: string): boolean {
  return path.basename(filePath).startsWith('.') || ignorePaths.includes(path.basename(filePath));
}

ToolManager.registerTool(
  (context: ToolContext, directoryPath?: string, depth?: number) =>
    get_directory_tree(
      directoryPath ? path.join(context.workspaceFolder, directoryPath) : context.workspaceFolder,
      depth,
    ),
  {
    name: TOOL_GET_DIRECTORY_TREE,
    description: 'Provides a directory listing in a tree format',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The root path to start the directory listing. Defaults to the project root.',
        },
        depth: {
          type: 'number',
          description: 'How deep to go into the directory tree',
        },
      },
      // required: ['path'],
    },
  },
);
