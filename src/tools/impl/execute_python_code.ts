import { ToolManager } from '../ToolManager';
import { ToolContext } from '../ToolTypes';
import { logger } from '../../utils/Logger';

export const TOOL_EXECUTE_PYTHON_CODE = 'execute_python_code';
export const TOOL_EXECUTE_PYTHON_FILE = 'execute_python_file';

import path from 'path';
import { runInDocker } from '../../utils/dockerUtils';

const runPythonInDocker = async (context: ToolContext, args: string[]) => {
  return runInDocker(context, 'python:latest', { Cmd: ['python'] }, args);
};

/**
 * Executes the given Python code inside a single-use Docker container with access to your workspace folder
 */
const execute_python_code = async (context: ToolContext, code: string) => {
  let content;
  try {
    logger.info('Executing Python code:', code);
    const result = await runPythonInDocker(context, ['-c', `"${code}"`]);
    content = 'Executed Python code: \n```' + result + '\n```';

    context.onProgress({ type: 'content', content });
  } catch (err) {
    content = 'Error executing Python code: \n```' + err + '\n```';
    logger.error('Failed to execute python code:', err);
    context.onProgress({ type: 'content', content: content });
  }

  return content;
};

ToolManager.registerTool(execute_python_code, {
  name: TOOL_EXECUTE_PYTHON_CODE,
  description:
    'Executes the given Python code inside a single-use Docker container with access to your workspace folder',
  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'The Python code to run',
      },
    },
    required: ['code'],
  },
});

/** Execute an existing Python file inside a single-use Docker container with access to your workspace folder */
const executePythonFile = async (context: ToolContext, filename: string, args: string[] = []) => {
  let content;

  // Check if the file is a Python file
  if (path.extname(filename) !== '.py') {
    content = `\`${filename}\` is an invalid file type. Only .py files are allowed.`;
  } else {
    // Execute the Python file
    try {
      content = await runPythonInDocker(context, [filename, ...args]);
    } catch (error) {
      content = `Error executing Python file: ${(error as Error).message}`;
    }
  }
  context.onProgress({ type: 'content', content });
  return content;
};

ToolManager.registerTool(executePythonFile, {
  name: TOOL_EXECUTE_PYTHON_FILE,
  description:
    'Execute an existing Python file inside a single-use Docker container with access to your workspace folder',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'The name of the file to execute',
      },
      args: {
        type: 'string',
        description: 'The (command line) arguments to pass to the script',
      },
    },
    required: ['filename'],
  },
});
