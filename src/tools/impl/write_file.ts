import path from 'path';
import { ToolManager } from '../ToolManager';
import { ToolContext } from '../tool_types';
import { mkdirSync, writeFileSync } from 'fs';
import { getAbsolutePathInWorkspace } from '../../utils/fileUtils';

export const TOOL_WRITE_FILE = 'write_file';

/**
 * Write text to a file
 * @param filename The name of the file to write
 * @param contents The contents of the file to write
 */
const write_file = (context: ToolContext, filename: string, contents: string) => {
  const filePath = getAbsolutePathInWorkspace(context.workspaceFolder, filename);
  const dir = path.dirname(filePath);
  // TODO: abstract to ArtifactStorage - https://github.com/AI-Engineer-Foundation/agent-protocol/pull/100
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, contents, { encoding: 'utf-8' });
  context.onProgress({ type: 'inlineContentReference', title: filename, inlineReference: filePath });
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
