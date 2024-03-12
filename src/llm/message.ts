// as per 'openai/resources/index.mjs'
export type ChatCompletionRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

export type LlmMessage =
  | {
      role: ChatCompletionRole;
      content: string;
    }
  | {
      role: 'assistant';
      content?: string;
      name?: string;
      tool_calls: ChatCompletionMessageToolCall[];
    };

export type LlmRequestMessage =
  | {
      role: 'system' | 'user' | 'assistant';
      content: string;
      name?: string;
    }
  | {
      role: 'assistant';
      content?: string;
      name?: string;
      tool_calls: ChatCompletionMessageToolCall[];
    }
  | {
      role: 'tool';
      tool_call_id: string;
      content: string;
    };

export type LlmResponseMessage =
  | { role: 'tool'; tools: ChatCompletionMessageToolCall[] }
  | { role: 'assistant'; content: string };

export type ChatCompletionMessageToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export const assistantResponse = (content: string): LlmResponseMessage => ({
  role: 'assistant',
  content,
});
export const toolResponse = (tools: ChatCompletionMessageToolCall[]): LlmResponseMessage => ({ role: 'tool', tools });
