// as per 'openai/resources/index.mjs'
export type ChatCompletionRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

export type LlmMessage = {
  role: ChatCompletionRole;
  content: string;
};

export type LlmRequestMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
};

export type LlmResponseMessage =
  | { role: 'tool'; tools: ChatCompletionMessageToolCall[] }
  | { role: 'assistant'; content: string };

type ChatCompletionMessageToolCall = {
  // id: string;
  function: {
    name: string;
    arguments: string;
  };
  // type: function;
};

export const assistantResponse = (content: string): LlmResponseMessage => ({
  role: 'assistant',
  content,
});
export const toolResponse = (tools: ChatCompletionMessageToolCall[]): LlmResponseMessage => ({ role: 'tool', tools });
