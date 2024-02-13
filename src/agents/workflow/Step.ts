import { Agent } from '..';
import { AgentContext, RoutingContext } from '../AgentContext';
import { AgentInputMessage } from '../types/AgentMessage';
import { AgentResponse } from '../types/AgentResponse';
import { LinkDefinition, StepProvide, ToolObjectDefinition } from './WorkflowSchema';

export interface Step {
  matchesContext(context: RoutingContext): boolean;

  processUserRequest(
    input: AgentInputMessage,
    context: AgentContext,
    agent: Agent,
    tools?: { [id: string]: ToolObjectDefinition },
  ): Promise<AgentResponse | undefined>;

  processUserStep(input: AgentInputMessage, context: AgentContext): AgentResponse;

  getUnfilledProvides(context: RoutingContext): StepProvide[];

  getLinks(): { [id: string]: LinkDefinition };
}
