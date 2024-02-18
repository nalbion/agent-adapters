import { ToolManager } from '../ToolManager';
import { ToolContext } from '../ToolTypes';
import { getAbsolutePathInWorkspace } from '../../utils/fileUtils';
import { fileStorage } from '../../utils/fileStorage';

export const TOOL_WRITE_FILE = 'write_file';

/**
 * Write text to a file
 * @param filename The name of the file to write
 * @param contents The contents of the file to write
 */
const write_file = async (context: ToolContext, filename: string, contents: string) => {
  const filePath = getAbsolutePathInWorkspace(context.workspaceFolder, filename);

  await fileStorage.saveTextFile(filePath, contents);

  context.onProgress({
    type: 'inlineContentReference',
    title: `\nwrite_file(${filename})\n`,
    inlineReference: filePath,
  });
};

ToolManager.registerTool(write_file, {
  name: TOOL_WRITE_FILE,
  description: 'Write text to a file',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'The name of the file to write',
      },
      values: {
        type: 'string',
        description: 'The contents of the file to write',
      },
    },
    required: ['filename', 'contents'],
  },
});
