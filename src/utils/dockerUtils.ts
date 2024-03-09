import Dockerode, { ContainerCreateOptions } from 'dockerode';
import { logger } from './Logger';
import { statSync } from 'fs';
import { ToolContext } from '../tools/ToolTypes';
import { executeShell } from '../tools/impl/execute_shell';
import { Writable } from 'stream';

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

const docker = new Dockerode();

/**
 * @param context provies `workspaceFolder` and `askForUserPermission()`
 * @param image eg 'python:3.8'
 * @param containerCreateOpts eg `{ Cmd: ['python', '-c', 'print("Hello World")'], HostConfig: { Binds: [`${workspaceFolder}:/workspace`] } }`
 * @param args Provide `args` if you want to override `containerCreateOpts.Cmd` when running directly from within a container or in the local shell.
 * @returns
 */
export const runInDocker = async (
  context: ToolContext,
  image: string,
  containerCreateOpts: ContainerCreateOptions,
  args?: string[],
  stderr: boolean = false,
  follow: boolean = false,
): Promise<string> => {
  if (isRunningInDocker()) {
    return executeShell(context, true, args || containerCreateOpts.Cmd!);
  }

  let result: string;
  let container;
  const workspaceFolder = context.workspaceFolder;

  try {
    const cmd = containerCreateOpts.Cmd || args || [];
    logger.info(`Exectute in Docker ${image}: ${cmd.join(' ')}`);

    container = await docker.createContainer({
      ...containerCreateOpts,
      Image: image,
      Cmd: cmd,
      HostConfig: containerCreateOpts.HostConfig || {
        Binds: [`${workspaceFolder}:/workspace`],
      },
    });
    await container.start();

    const { output } = await container.wait();
    logger.info('Execution output:', output);

    const logs = await container.logs({ stdout: true, stderr: stderr, follow: (follow as true) || false });
    if (follow) {
      result = await parseDockerLogs(logs, stderr);
    } else {
      result = (logs as unknown as Buffer).toString('utf-8');
    }
  } catch (err) {
    logger.error('Failed to run in Docker:', err);
    result = await executeShell(context, false, args || containerCreateOpts.Cmd!);
  } finally {
    if (container) {
      await container.stop();
      await container.remove();
    }
  }

  logger.info('Execution result:', result);
  return result;
};

const parseDockerLogs = async (stream: NodeJS.ReadableStream, stderr: boolean): Promise<string> => {
  return new Promise((resolve) => {
    const output: string[] = [];
    const errOutput: string[] = [];

    const stdoutStream = new Writable({
      write(chunk, _encoding, callback) {
        output.push(chunk.toString('utf8'));
        callback();
      },
    });

    const stderrStream = new Writable({
      write(chunk, _encoding, callback) {
        errOutput.push(chunk.toString('utf8'));
        callback();
      },
    });

    docker.modem.demuxStream(stream, stdoutStream, stderrStream);

    stream.on('end', function () {
      let out = output.join('');
      if (stderr) {
        out = '# stdout\n' + out + '\n\n# stderr\n' + errOutput.join('');
      }
      resolve(out);
    });
  });
};
