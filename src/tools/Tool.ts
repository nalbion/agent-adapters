import { ToolCallback } from './tool_types';
import { ChatCompletionTool } from '../llm/tools';
import { ToolDefinition } from './ToolDefinition';

export class Tool {
  id: string;
  execute: ToolCallback;

  constructor(
    id: string,
    private definition: ToolDefinition,
    execute: ToolCallback,
  ) {
    this.id = id;
    this.execute = execute;
  }

  openAiFormat(): ChatCompletionTool {
    return {
      type: 'function',
      function: this.definition,
    };
  }
}
