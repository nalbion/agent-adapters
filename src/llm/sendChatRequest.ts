import { LlmMessage, LlmResponseMessage } from './message';
import { openAiChatRequest } from './openai/openAiChatRequest';
import { ChatRequestOptions } from '../types/ChatRequest';
import { ProgressData } from '../agents/AgentContext';

export type ChatRequestMessages = string | LlmMessage | LlmMessage[];

export const sendChatRequest = async (
  messages: ChatRequestMessages,
  options: ChatRequestOptions,
  onProgress: (progressData: ProgressData) => void,
): Promise<LlmResponseMessage> => {
  if (typeof messages === 'string') {
    messages = [{ role: 'user', content: messages }];
  } else if (!Array.isArray(messages)) {
    messages = [messages];
  }

  return openAiChatRequest(messages, options, onProgress);
};
