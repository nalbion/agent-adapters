import { AgentResponseMessage } from '..';
import { FollowUp } from '../workflow/WorkflowSchema';

export enum AgentResponseStatus {
  NEEDS_USER_INPUT,
  NEEDS_DEBUGGING,
  IN_PROGRESS,
  NEXT_STEP,
  DONE,
}

export type AgentResponse = {
  reply: AgentResponseMessage;
  status?: AgentResponseStatus;
  followups?: FollowUp[];
};

export const nextStepResponse = (): AgentResponse => {
  return { reply: { content: '' }, status: AgentResponseStatus.NEXT_STEP };
};
