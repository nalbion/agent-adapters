import { ChildProcess, spawn } from 'child_process';
import { AgentContext } from '../AgentContext';
import { logger } from '../../utils';

export class ProcessError extends Error {
  constructor(
    message: string,
    public output: ProcessOutput,
  ) {
    super(message);
  }
}

export type ProcessOutput = { stdout: string; stderr: string; code: number | null };

type ProcessData = {
  process: ChildProcess;
  prompt: string;
};

type StartProcessOptions = {
  cwd?: string;
  // waitFor?: string | number;
  // daemon?: boolean;
  // formatError?: (error: string) => unknown;
};

export class CliClient {
  /**
   * @param wrapOutput eg: ```
   */
  constructor(private wrapOutput?: string) {}

  /**
   * Executes the specified command and communicates with the process via stdin/stdout/stderr.
   *
   * eg: (Windows) `startProcess('cmd.exe', ['/K', 'dir'], { cwd: 'C:\\' })`
   *
   * @param command The command to execute
   * @param args The arguments to pass to the command
   * @param cwd
   */
  startProcess(
    command: string,
    args: string[],
    { cwd }: StartProcessOptions = {}, // daemon = false, formatError = (s) => s
  ): ChildProcess {
    logger.info('startProcess', JSON.stringify({ command, args, cwd }));

    const process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      // detached: true, // daemon
      // shell: false,
      // timeout: 1000,
      // argv0: 'dir',
      cwd,
    });

    if (!process.pid) {
      throw new ProcessError(`Process ${command} ${args.join(' ')} failed to start`, {
        stdout: process.stdout?.read()?.toString(),
        stderr: process.stderr?.read()?.toString(),
        code: process.exitCode,
      });
    }

    logger.info(`Running ${command} ${args.join(' ')} as process ${process.pid}`);
    return process;
  }

  /** @returns true if the proceess was cancelled */
  cancelProcess(process: ChildProcess): boolean {
    if (process.pid && !process.killed) {
      logger.info(`Killing process ${process.pid}`);
      return process.kill('SIGINT');
    }
    return false;
  }

  /**
   * Monitors the process, sending stdout & stderr to context.onProgress.
   * Kills the process if the context is cancelled.
   *
   * @param process the process to monitor
   * @param context provides onProgress and cancellation
   * @param waitFor A timeout (in ms) or string or /regex/ to scan for in the output to indicate the end of the command output
   * @returns stdout, stderr and exit code
   * @throws ProcessError with stdout, stderr and exit code
   */
  monitorProcess(process: ChildProcess, context: AgentContext, waitFor?: string | number): Promise<ProcessOutput> {
    // , daemon: boolean = false
    let stdout = '';
    let stderr = '';

    logger.info(`Monitoring process ${process.pid}`);
    // Open the markdown box
    if (this.wrapOutput) {
      context.onProgress({ type: 'markdown', content: this.wrapOutput + '\n' });
    }

    return new Promise((resolve, reject) => {
      context.cancellation.onCancellationRequested(() => {
        logger.info('Process cancelled');
        this.cancelProcess(process);
        reject(130);
      });

      const onStdout = (data: string) => {
        const chunk = data.toString();

        try {
          stdout += chunk;
          context.onProgress({ type: 'markdown', content: chunk });
        } catch (err) {
          logger.error('Error formatting output:', err);
        }

        // TODO: detect end of process - on windows, this is the prompt string, on linux, it's the end of the stream
        // this doesn't work if the process changes the current working directory...
        if (this.isEndOfProcess(chunk, typeof waitFor === 'string' ? waitFor : `${context.workspaceFolder}>`)) {
          logger.info('presumably that is the end?');

          if (this.wrapOutput) {
            context.onProgress({ type: 'markdown', content: `\n${this.wrapOutput}\n` });
          }

          removeListeners();
          resolve({ stdout: stdout + stdout, stderr, code: 0 });
        }
      };

      const onStderr = (data: string) => {
        try {
          stderr += data.toString();

          const content = data.toString();
          context.onProgress({ type: 'markdown', content });
        } catch (err) {
          logger.error('Error formatting error:', err);
        }
      };

      const onClose = (code: number | null) => {
        logger.info(`Process exited with code ${code}`, stdout);

        try {
          stdout += process.stdout?.read();
        } catch (err) {
          logger.error('Error getting terminal output:', err);
        }

        removeListeners();
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new ProcessError(`Process exited with error: ${code}`, { stdout, stderr, code }));
        }
      };

      process.stdout!.on('data', onStdout);
      process.stderr!.on('data', onStderr);
      process.once('close', onClose);

      function removeListeners() {
        process.stdout?.off('data', onStdout);
        process.stderr?.off('data', onStderr);
      }
    });
  }

  /**
   * @param data the data received from the process
   * @param expectedEndPrompt the prompt string that indicates the end of the process
   */
  isEndOfProcess(data: string, expectedEndPrompt: string): boolean {
    return data.endsWith(expectedEndPrompt);
  }

  writeToProcess(data: string, process: ChildProcess): Promise<void> {
    return new Promise((resolve) => {
      if (!process.stdin!.write(data)) {
        process.stdin!.once('drain', resolve);
      } else {
        resolve(undefined);
      }
      logger.info(`Wrote to process ${process.pid}: ${data}`);
    });
  }
}
