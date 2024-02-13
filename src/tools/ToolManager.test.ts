import { ToolManager } from './ToolManager';
import { ToolCallback, ToolContext } from './tool_types';
import { AgentContext } from '../agents/AgentContext';
import { ToolDefinition } from './ToolDefinition';

describe('ToolManager', () => {
  let toolCallback: ToolCallback;
  let toolDefinition: ToolDefinition;
  let toolContext: ToolContext;
  let toolName = 'testTool';
  let parameters: string;

  beforeEach(() => {
    // Initialize your variables here
    toolCallback = (context: ToolContext, param1: string, param2: string) => {
      console.info('toolCallback', param1, param2);
      return `toolCallback ${param1} ${param2}`;
    };
    toolDefinition = {
      name: 'testTool',
      description: 'test tool description',
      parameters: {
        type: 'object',
        properties: {
          param1: {
            type: 'string',
            description: 'param1 description',
          },
          param2: {
            type: 'string',
            description: 'param2 description',
          },
        },
      },
    };

    toolContext = new AgentContext();
    toolContext.routing = {
      testing: ['yes'],
    };
    parameters = JSON.stringify({ param1: 'foo', param2: 'bar' });

    // Register a tool before each test
    ToolManager.registerTool(toolCallback, toolDefinition);
  });

  it('should register a tool', () => {
    const tool = ToolManager.getTool(toolName);
    expect(tool).toBeDefined();
  });

  it('should get a tool', () => {
    const tool = ToolManager.getTool(toolName);
    expect(tool).toBeDefined();
  });

  it('should execute a tool', () => {
    const result = ToolManager.executeTool(toolName, toolContext, parameters);
    const expectedResult = 'toolCallback foo bar';
    expect(result).toEqual(expectedResult);
  });
});
