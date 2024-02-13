import { AgentContext } from '../AgentContext';
import { AgentInputMessage } from '../types/AgentMessage';
import { AgentResponse } from '../types/AgentResponse';
import { SlashCommand } from '../../types/AgentsYml';
import { Workflow } from './Workflow';
import { Agent } from '..';
import { Factory } from '../../types/Factory';

type WorkFlowManagerFactory = Factory<WorkflowManager | undefined, string>;

let workflowManagerFactory: WorkFlowManagerFactory = (_path: string) => undefined;

export const setWorkflowManagerFactory = (factory: WorkFlowManagerFactory) => {
  workflowManagerFactory = factory;
};

export const createWorkflowManager = (path: string) => {
  return workflowManagerFactory(path);
};

export interface WorkflowManager {
  processUserRequest(input: AgentInputMessage, context: AgentContext, agent: Agent): Promise<AgentResponse | undefined>;

  getCommands(): Promise<SlashCommand[]>;

  loadWorkflow(basePath: string, filePath: string, unlessCached?: boolean): Promise<Workflow>;
  loadWorkflow(basePath: string, filePath: string, unlessCached: true): Promise<Workflow | undefined>;
  loadWorkflow(basePath: string, filePath: string, unlessCached: boolean): Promise<Workflow | undefined>;

  useWorkflow(filePath?: string): Promise<Workflow>;
}
