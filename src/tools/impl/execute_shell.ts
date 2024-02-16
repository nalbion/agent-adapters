import { execSync } from 'child_process';
import { logger } from '../../utils/Logger';
import { ToolContext } from '../ToolTypes';
import { ToolManager } from '../ToolManager';

export const TOOL_EXECUTE_SHELL = 'execute_shell';

export const executeShell = async (
  context: ToolContext,
  alreadyInDocker: boolean,
  args: string[]
): Promise<string> => {
  const command = args.join(' ');
  if (!alreadyInDocker) {
    // TODO: implement allow/deny list as per validate_command in AutoGPT
    if (!(await context.askForUserPermission(`Can I run "${command}"?`))) {
      return 'Command rejected by user';
    }
    logger.info(`Running locally: ${command}`);
  }
  return execSync(command, { cwd: context.workspaceFolder, encoding: 'utf-8' });
};

ToolManager.registerTool(executeShell, {
  name: TOOL_EXECUTE_SHELL,
  description: 'Execute a Shell Command, non-interactive commands only',
  parameters: {
    type: 'object',
    properties: {
      command_line: {
        type: 'string',
        description: 'The command line to execute',
      },
    },
    required: ['command_line'],
  },
});
