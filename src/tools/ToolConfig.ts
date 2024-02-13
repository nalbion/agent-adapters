import { FunctionDefinition } from '../llm';
import { Tool } from './Tool';

export type ToolConfig = {
  definition: FunctionDefinition;
  implementation: Tool;
};
