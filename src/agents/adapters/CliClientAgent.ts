import { ChildProcess } from 'child_process';
import { CliClient } from './CliClient';
import Agent from '../Agent';
import { AgentContext } from '../AgentContext';
import { AgentInputMessage, AgentResponse, AgentResponseStatus } from '../types';
import { logger, normalisePath } from '../../utils';
import { AgentConfig } from '../../types';

/**
 * Executes the specified command and communicates with the process via stdin/stdout/stderr.
 */
export default class CliClientAgent extends Agent {
  private cli: { command: string; args?: string[]; cwd?: string; image?: string };
  private cliClient;
  private processes: { [pid: number]: ChildProcess } = {};

  constructor(agentConfig: AgentConfig & Required<Pick<AgentConfig, 'cli'>>) {
    super(agentConfig);
    this.cliClient = new CliClient(agentConfig.cli.wrap_output);
    this.cli = agentConfig.cli;
  }

  /** Called from Agent.receiveMessage() if it did not return early while processing slash commmands */
  override processUserRequest(input: AgentInputMessage, context: AgentContext): Promise<AgentResponse> {
    let processes = Object.values(this.processes).filter((process) => !process.killed);
    let agentProcess: ChildProcess | undefined;

    logger.info(
      'processes:',
      JSON.stringify(
        Object.values(this.processes).map((p) => {
          const { pid, spawnargs, connected, killed } = p;
          return { pid, spawnargs, connected, killed };
        }),
        null,
        2,
      ),
    );

    if (processes.length === 0) {
      const args = this.prepareArgs(input, context);
      logger.info(`Running CLI Agent ${this.name}: ${this.cli.command} ${args.join(' ')}`);
      agentProcess = this.startProcess(this.cli.command, args, normalisePath(this.cli.cwd), context);
    } else {
      agentProcess = processes[0];

      if (processes.length === 1) {
        logger.debug('CLI Agent %s using existing process %d', this.name, agentProcess.pid);
      } else {
        logger.warn(`Multiple processes running for agent ${this.name}`, processes.map((p) => p.pid).join(', '));
      }

      const content = typeof input.content === 'string' ? input.content : JSON.stringify(input.content);
      this.writeToProcess(content, agentProcess);
    }

    if (!agentProcess?.pid) {
      throw new Error(`CLI Agent ${this.name} failed to start process ${this.cli.command} ${this.cli.args?.join(' ')}`);
    }

    logger.info("CLI Agent %s monitioring process...'", this.name);
    return this.monitorProcess(agentProcess, context, this.agentConfig.cli!.wait_for);
  }

  protected prepareArgs(input: AgentInputMessage, context: AgentContext): string[] {
    // Send the input message as an argument to the script
    const args: string[] = typeof input.content === 'string' ? [`"${input.content}"`] : [JSON.stringify(input.content)];
    logger.info('prepareArgs: input.content:', input.content);
    logger.info('prepareArgs: args:', JSON.stringify(args));

    // May need to prefix with any other args
    if (this.cli.args !== undefined) {
      args.unshift(
        ...this.cli.args.map((arg) => {
          if (arg === '${workspaceFolder}') {
            logger.info("Replacing '${workspaceFolder}' with workspace path:", context.workspaceFolder);
            return context.workspaceFolder;
          } else {
            return arg;
          }
        }),
      );
    }

    logger.info("CLI Agent %s args: '%s'", this.name, JSON.stringify(args));

    return args;
  }

  /**
   *
   * @param command
   * @param args
   * @param cwd
   * @param context
   * @returns
   */
  protected startProcess(
    command: string,
    args: string[],
    cwd: string | undefined,
    context: AgentContext,
  ): ChildProcess {
    const process = this.cliClient.startProcess(command, args, {
      cwd: cwd || context.workspaceFolder,
      // daemon: this.agentConfig.cli?.daemon,
      // formatError: context.formatError,
    });
    this.processes[process.pid!] = process;
    return process;
  }

  protected monitorProcessId(pid: number, context: AgentContext): Promise<AgentResponse | undefined> {
    const process = this.processes[pid];
    if (process) {
      return this.monitorProcess(process, context);
    }

    return Promise.resolve(undefined);
  }

  protected async monitorProcess(
    agentProcess: ChildProcess,
    context: AgentContext,
    waitFor?: string | number,
  ): Promise<AgentResponse> {
    const process = this.processes[agentProcess.pid!];
    if (!process) {
      throw new Error(`Process ${agentProcess.pid} not found`);
    }

    try {
      process.once('close', (code: number | undefined) => {
        logger.log(`CLI Agent ${this.name} exited with code ${code}`);
        delete this.processes[process.pid!];
      });

      const result = await this.cliClient.monitorProcess(agentProcess, context, waitFor); // , this.agentConfig.cli?.daemon);

      return {
        reply: { content: JSON.stringify(result) },
        status: process.pid ? AgentResponseStatus.IN_PROGRESS : AgentResponseStatus.DONE,
      };
    } catch (err) {
      logger.error(`CLI Agent ${this.name} failed to process request:`, err);
      return {
        reply: { content: err?.toString() || 'ERROR' },
        status: process.pid ? AgentResponseStatus.IN_PROGRESS : AgentResponseStatus.DONE,
      };
    }
  }

  private writeToProcess(data: string, process: ChildProcess): Promise<void> {
    return this.cliClient.writeToProcess(data + '\n', process);
  }
}
