import * as os from 'os';
import * as path from 'path';
import { findFile, getAbsolutePathInWorkspace } from './fileUtils';

jest.mock('fs/promises', () => {
  const validPaths = ['package.json', path.join(os.homedir(), 'agents.yml')];

  return {
    access: jest.fn((filePath: string) => {
      if ((filePath.includes('package') || filePath.includes('agents')) && !validPaths.includes(filePath)) {
        return Promise.reject(new Error('Access denied'));
      }

      return Promise.resolve();
    }),
    constants: {
      R_OK: 4,
    },
  };
});

describe('getAbsolutePathInWorkspace', () => {
  const testCases = [
    { workspace: '/my/workspace', file: 'file', expected: '/my/workspace/file' },
    { workspace: 'C:\\my\\workspace', file: 'file', expected: '/my/workspace/file' },
    { workspace: '/my/workspace', file: '.env', expected: '/my/workspace/.env' },
    { workspace: '/my/workspace', file: './file', expected: '/my/workspace/file' },
    { workspace: '/my/workspace', file: 'path/to/file', expected: '/my/workspace/path/to/file' },
    { workspace: '/my/workspace', file: '../path/../../../to/file', expected: '/my/workspace/path/to/file' },
    { workspace: '/my/workspace', file: './path/to my/file', expected: '/my/workspace/path/to my/file' },
    { workspace: '/my/workspace', file: '~/file', expected: '/my/workspace/home/file' },
    { workspace: '/my/workspace', file: '~/path/to/file', expected: '/my/workspace/home/path/to/file' },
    { workspace: '/my/workspace', file: '/temp/path/to/file', expected: '/my/workspace/root/temp/path/to/file' },
    { workspace: '/my/workspace', file: 'C:\\temp\\path\\to\\file', expected: '/my/workspace/root/temp/path/to/file' },
  ];

  testCases.forEach(({ workspace, file, expected }) => {
    it(`should return the correct path for getAbsolutePath("${workspace}", "${file}")`, () => {
      // When
      const result = getAbsolutePathInWorkspace(workspace, file);

      // Then
      console.info('result:', result);
      expect(result.replaceAll('\\', '/').replace(/^[A-Z]:/, '')).toBe(expected);
    });
  });
});

describe('findFile', () => {
  const testCases = [
    {
      name: 'agents',
      extensions: ['.yml', '.yaml'],
      expectedPath: path.join(os.homedir(), 'agents.yml'),
    },
    {
      name: 'package',
      extensions: ['', '.json'],
      expectedPath: 'package.json',
    },
    {
      name: 'package.json',
      extensions: undefined,
      expectedPath: 'package.json',
    },
  ];

  testCases.forEach(({ name, extensions, expectedPath }) => {
    it(`should return the correct path for findFile("${name}", ${JSON.stringify(extensions)})`, async () => {
      // When
      const result = await findFile(name, extensions);

      // Then
      expect(result).toBe(expectedPath);
    });
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});
