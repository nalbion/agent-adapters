import { type AgentContext } from '../agents/AgentContext';
import { type Tool } from './Tool';
import { ToolDefinition } from './ToolDefinition';

export type ToolContext = AgentContext;

export type ToolConfig = {
  // As per Open AI function calling / Tool definition
  definition: ToolDefinition;
  implementation: Tool;
};

export type ToolCallback = (context: ToolContext, ...parameters: any) => void | string | Promise<string | undefined>;
