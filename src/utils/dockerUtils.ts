import Dockerode from 'dockerode';
import { logger } from './Logger';
import { execSync } from 'child_process';
import { statSync } from 'fs';
import { ToolContext } from '../tools/tool_types';
import { ToolManager } from '../tools/ToolManager';

export const TOOL_EXECUTE_SHELL = 'execute_shell';

export const isRunningInDocker = (): boolean => {
  const result = statSync('/.dockerenv', { throwIfNoEntry: false });
  return result !== undefined;

  // try {
  //   execSync('cat /proc/1/cgroup');
  //   return true;
  // } catch (err) {
  //   return false;
  // }
};

export const runInDocker = async (context: ToolContext, image: string, ...args: string[]): Promise<string> => {
  if (isRunningInDocker()) {
    return executeShell(context, true, ...args);
  }

  let result;
  let container;
  const workspaceFolder = context.workspaceFolder;

  try {
    logger.info(`Exectute in Docker ${image}: ${args.join(' ')}`);

    const docker = new Dockerode();
    container = await docker.createContainer({
      Image: image,
      Cmd: args,
      HostConfig: {
        Binds: [`${workspaceFolder}:/workspace`],
      },
    });
    await container.start();

    const { output } = await container.wait();
    logger.info('Execution output:', output);

    const logs = await container.logs({ stdout: true, stderr: true });
    result = logs.toString('utf-8');
  } catch (err) {
    logger.error('Failed to run in Docker:', err);
    result = executeShell(context, false, ...args);
  } finally {
    if (container) {
      await container.stop();
      await container.remove();
    }
  }

  logger.info('Execution result:', result);
  return result;
};

export const executeShell = async (
  context: ToolContext,
  alreadyInDocker: boolean,
  ...args: string[]
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
