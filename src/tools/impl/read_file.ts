import { ToolManager } from '../ToolManager';
import { ToolContext } from '../ToolTypes';
import { getAbsolutePathInWorkspace } from '../../utils/fileUtils';
import { fileStorage } from '../../utils/fileStorage';

export const TOOL_READ_FILE = 'read_file';

/**
 * Read text from a file
 * @param filename The name of the file to read
 */
const read_file = async (context: ToolContext, filename: string, encoding?: BufferEncoding): Promise<string> => {
  const filePath = getAbsolutePathInWorkspace(context.workspaceFolder, filename);

  const contents = await fileStorage.readFile(filePath);

  context.onProgress({ type: 'inlineContentReference', title: filename, inlineReference: filePath });

  return contents.toString(encoding);
};

ToolManager.registerTool(read_file, {
  name: TOOL_READ_FILE,
  description: 'Read text from a file',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'The name of the file to read',
      },
      encoding: {
        type: 'string',
        description: 'The BufferEncoding of the file to read. eg: "utf-8", "base64", "binary"',
      },
    },
    required: ['filename'],
  },
});
