import { type ProgressData, type CancellationToken, type RoutingContext } from '../agents/AgentContext';

export type ToolContext = {
  workspaceFolder: string;
  routing: RoutingContext;
  askForUserPermission: (message: string) => Promise<boolean>;
  cancellation: CancellationToken;
  onProgress: (progressData: ProgressData) => void;
  formatError: (error: string) => string;
  mergeRoutingContext: (delta: RoutingContext) => RoutingContext;
};

export type ToolCallback = (
  context: ToolContext,
  ...parameters: any
) => string | undefined | void | Promise<string | undefined | void>;
export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};
