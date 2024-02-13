import { SlashCommand } from '../../types/AgentsYml';
import { RoutingContext } from '../AgentContext';
import { Step } from './Step';

class WorflowNotFoundError extends Error {
  constructor(
    public fullPath: string,
    filePath: string,
  ) {
    super(`Workflow not found: ${filePath}`);
  }
}

export interface Workflow {
  readWorkflowFile(basePath: string, filePath: string): Promise<Workflow>;

  getCommands(): Promise<SlashCommand[]>;

  getStepForCommand(command: string): Step | undefined;

  getStepForContext(context: RoutingContext, activeStep?: Step): Promise<Step | undefined>;

  getNextStep(context: RoutingContext, activeStep: Step): Promise<Step | undefined>;
}
