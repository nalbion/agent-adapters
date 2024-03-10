import { logger } from '../utils/Logger';
import { Tool } from './Tool';
import { ToolDefinition } from './ToolTypes';
import { ToolCallback, ToolContext } from './ToolTypes';
import { ToolConfig } from './ToolConfig';

export class ToolManager {
  private static tools: Record<string, ToolConfig> = {};

  static registerTool(callback: ToolCallback, definition: ToolDefinition) {
    this.tools[definition.name] = {
      definition,
      implementation: new Tool(definition.name, definition, callback),
    };
  }

  /**
   * Usage: ToolManager.getTool('set_context').execute(context, { key: 'foo', values: ['bar'] })
   */
  static getTool(name: string): Tool {
    return this.tools[name].implementation;
  }

  static parseToolParameters(parameters: string): unknown[] {
    const parsedParams = JSON.parse(parameters);
    return Object.values(parsedParams);
  }

  static listTools(): string[][] {
    return Object.values(this.tools)
      .map((tool) => [tool.definition.name, tool.definition.description])
      .sort((a, b) => a[0].localeCompare(b[0]));
  }

  static async executeTool(
    name: string,
    context: ToolContext,
    parameters: string | { [k: string]: unknown },
  ): Promise<string | undefined | void> {
    const tool = this.tools[name];
    if (tool) {
      const parsedParams = typeof parameters === 'string' ? JSON.parse(parameters) : parameters;
      const values = Object.values(parsedParams);
      return await tool.implementation.execute(context, ...values);
    }
    logger.warn(`Tool ${name} not found in ToolManager.tools. parameters: ${JSON.stringify(parameters)}`);
    return undefined;
  }
}
