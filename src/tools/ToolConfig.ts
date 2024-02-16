import { type Tool } from './Tool';
import { ToolDefinition } from './ToolTypes';

export type ToolConfig = {
  // As per Open AI function calling / Tool definition
  definition: ToolDefinition;
  implementation: Tool;
};
