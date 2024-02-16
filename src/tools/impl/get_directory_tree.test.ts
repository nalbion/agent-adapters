import * as fs from 'fs';
import { get_directory_tree } from './get_directory_tree';
import path from 'path';

const rootPath = 'test/files';

describe('get_directory_tree', () => {
  beforeAll(() => {
    // Initialise the directory structure
    const src = path.join(rootPath, 'src');
    const foo = path.join(rootPath, 'src/foo');
    const filesNoFolders = path.join(foo, 'files_no_folders');

    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(foo, { recursive: true });
    fs.mkdirSync(path.join(foo, 'empty1'), { recursive: true });
    fs.mkdirSync(path.join(foo, 'empty2'), { recursive: true });
    fs.mkdirSync(filesNoFolders, { recursive: true });

    for (const dir of ['.git', '.idea', '.vscode', '__pycache__', 'node_modules', 'venv', 'dist', 'build']) {
      fs.mkdirSync(path.join(rootPath, dir), { recursive: true });
    }

    // ...and files
    fs.writeFileSync(path.join(rootPath, 'package.json'), JSON.stringify({ name: 'test app' }, null, 2));

    for (const filePath of [
      path.join(src, 'main.js'),
      path.join(src, 'other.js'),
      path.join(foo, 'bar.js'),
      path.join(foo, 'fighters.js'),
      path.join(filesNoFolders, 'file1.js'),
      path.join(filesNoFolders, 'file2.js'),
    ]) {
      fs.writeFileSync(filePath, 'console.log("Hello World!");');
    }
  });

  afterAll(() => {
    fs.rmdirSync(rootPath, { recursive: true });
  });

  it('should return the correct directory tree for a given directory', () => {
    // When
    const result = get_directory_tree(rootPath);

    // Then
    expect(result).toBe(
      `
/
  /src
    /foo
      /empty1
      /empty2
      /files_no_folders: file1.js, file2.js
      bar.js, fighters.js
    main.js, other.js
  package.json
`.trimStart(),
    );
  });
});
