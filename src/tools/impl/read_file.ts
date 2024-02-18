import { ToolManager } from '../ToolManager';
import { ToolContext } from '../ToolTypes';
import { getAbsolutePathInWorkspace } from '../../utils/fileUtils';
import { fileStorage } from '../../utils/fileStorage';

export const TOOL_READ_FILE = 'read_file';
export const TOOL_READ_FILES = 'read_files';

/**
 * Read text from a file
 * @param filename The name of the file to read
 */
const read_file = async (context: ToolContext, filename: string, encoding?: BufferEncoding): Promise<string> => {
  const filePath = getAbsolutePathInWorkspace(context.workspaceFolder, filename);

  const contents = await fileStorage.readFile(filePath);

  context.onProgress({
    type: 'inlineContentReference',
    title: `Agent called \`read_file('${filePath}')\`\n\n`,
    inlineReference: filePath,
  });

  return contents.toString(encoding);
};

const read_files = async (
  context: ToolContext,
  files: Array<{ filename: string; encoding?: BufferEncoding }>,
): Promise<string> => {
  const results = await Promise.all(
    files.map(async (file) => {
      const contents = await read_file(context, file.filename, file.encoding);
      return `# ${file.filename}\n` + '```\n' + contents + '\n```\n';
    }),
  );

  return results.join('\n');
};

ToolManager.registerTool(read_file, {
  name: TOOL_READ_FILE,
  description: 'Read a file',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'The name of the file to read, relative to the project root directory.',
      },
      encoding: {
        type: 'string',
        description: 'The BufferEncoding of the file to read. eg: "utf-8", "base64", "binary". Defaults to "utf-8"',
      },
    },
    required: ['filename'],
  },
});

ToolManager.registerTool(read_files, {
  name: TOOL_READ_FILES,
  description: 'Read multiple files',
  parameters: {
    type: 'object',
    properties: {
      file: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'The name of the file to read, relative to the project root directory.',
            },
            encoding: {
              type: 'string',
              description:
                'The BufferEncoding of the file to read. eg: "utf-8", "base64", "binary". Defaults to "utf-8"',
            },
          },
          required: ['filename'],
        },
      },
    },
    required: ['files'],
  },
});
