import { TaskInput } from 'agent-protocol';
import path from 'path';

import { startServer } from './agentprotocol/agentprotocol';
import { Agent } from '..';
import { AgentContext } from '../AgentContext';
import { AgentResponse, AgentResponseStatus } from '../types';
import { AgentConfig } from '../../types';

type AgentConfigWithRequiredServer = Required<Pick<AgentConfig, 'server'>> & Partial<Omit<AgentConfig, 'server'>>;

export default class AgentProtocolServer extends Agent {
  private static instance: AgentProtocolServer | undefined;
  private taskContexts: Map<string, AgentProtocolContext> = new Map();

  constructor(agentConfig: AgentConfigWithRequiredServer) {
    if (AgentProtocolServer.instance) {
      throw new Error('AgentProtocolServer is a singleton');
    }

    super(agentConfig as AgentConfig);

    if (agentConfig.server.port) {
      startServer(agentConfig.server);
    }
    // else serverless Agents need to manually call `createServerless` and provide to the Serverless provider.
    // see `src/agents/adapters/firebase, google-cloud, lambda

    // Waiting on https://github.com/AI-Engineer-Foundation/agent-protocol/pull/100
    // apAgent.setArtifactStorage(ArtifactStorageFactory.create(agentConfig.server.artifactStorage));
  }

  static async newTask(taskId: string, _taskInput: TaskInput | null, _additionalInput?: Record<string, any>) {
    const agent = AgentProtocolServer.instance;

    if (!agent) {
      throw new Error('AgentProtocolServer is not initialised');
    }

    agent.createContextForTask(taskId);
    // const content = taskInput?.input || '';
    // const command = additionalInput?.command;
    // const response = await agent.receiveMessage({ content, command }, context);
  }

  static async executeStep(
    taskId: string,
    input: string,
    additionalInput?: Record<string, any>,
  ): Promise<AgentResponse> {
    const agent = AgentProtocolServer.instance;

    if (!agent) {
      throw new Error('AgentProtocolServer is not initialised');
    }

    const context = agent.getContextForTask(taskId);
    const content = input;
    const command = additionalInput?.command;
    const response = await agent.receiveMessage({ content, command }, context);

    if (response.status === AgentResponseStatus.DONE) {
      agent.deleteContextForTask(taskId);
    }

    return response;
  }

  private createContextForTask(taskId: string): AgentProtocolContext {
    const context = new AgentProtocolContext(this.getWorkspace(taskId));
    this.taskContexts.set(taskId, context);
    return context;
  }

  private getContextForTask(taskId: string): AgentProtocolContext {
    let context = this.taskContexts.get(taskId);
    if (!context) {
      console.warn(`No context found for task ${taskId}, creating now.`);
      context = this.createContextForTask(taskId);
    }
    return context;
  }

  private deleteContextForTask(taskId: string) {
    this.taskContexts.delete(taskId);
  }

  private getWorkspace(taskId: string): string {
    const workspace = this.agentConfig.server!.workspace || './workspace';
    const rootDir = path.isAbsolute(workspace) ? workspace : path.join(process.cwd(), workspace);
    return path.join(rootDir, taskId);
  }
}

class AgentProtocolContext extends AgentContext {
  constructor(workspace: string) {
    super(workspace);
  }
}
