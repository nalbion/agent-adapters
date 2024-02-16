import { ToolDefinition } from '../tools';

export interface ChatCompletionTool {
  type: 'function';
  function: ToolDefinition;
}

export type ChatCompletionToolChoiceOption =
  | 'none'
  | 'auto'
  | {
      type: 'function';
      function: {
        name: string;
      };
    };
