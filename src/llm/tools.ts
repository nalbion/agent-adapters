export interface ChatCompletionTool {
  type: 'function';
  function: FunctionDefinition;
}

export type FunctionDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type ChatCompletionToolChoiceOption =
  | 'none'
  | 'auto'
  | {
      type: 'function';
      function: {
        name: string;
      };
    };
