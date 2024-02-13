import { type LlmRequestMessage } from '../../llm';

export type AgentInputMessage = {
  content: string | LlmRequestMessage[];
  command?: string;
};
export type AgentResponseMessage = {
  content: string;
};

export const agentMessageToLlmMessages = (input: AgentInputMessage, systemMessage?: string): LlmRequestMessage[] => {
  if (typeof input.content === 'string') {
    const userMessage: LlmRequestMessage = {
      role: 'user',
      content: input.content,
    };
    return !systemMessage ? [userMessage] : [{ role: 'system', content: systemMessage }, userMessage];
  } else {
    return input.content;
  }
};
