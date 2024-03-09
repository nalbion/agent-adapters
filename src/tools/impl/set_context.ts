import { ToolManager } from '../ToolManager';
import { ToolContext } from '../ToolTypes';
import { RoutingContextValues } from '../../types/AgentsYml';

export const TOOL_SET_CONTEXT_VALUES = 'set_context_values';
export const TOOL_SET_CONTEXT_TEXT = 'set_context';

/**
 * Use this tool to set conversational context values.
 * @param key The name of the field to set in the context
 * @param values An array of strings to set for the key in the context
 */
const setContextValues = (context: ToolContext, key: string, values: RoutingContextValues) => {
  console.info('set_contextValues', key, values);
  context.routing[key] = values;
  console.info('context updated:', context.routing);
};

ToolManager.registerTool(setContextValues, {
  name: TOOL_SET_CONTEXT_VALUES,
  description:
    'Call this function to set conversational context values. This should generally not be the only tool used to service a user request.',
  parameters: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Context category. Preferred values: languages, frameworks, platforms, dependencies, os, regions',
      },
      values: {
        type: 'array',
        items: {
          type: 'string',
          description: 'List of names/terms, lower-case letters only with no spaces, hyphens, dashes etc',
        },
      },
    },
    required: ['key', 'values'],
  },
});

/**
 * Use this tool to set conversational context value.
 * @param key The name of the field to set in the context
 * @param value An string to set for the key in the context
 */
const setContextText = (context: ToolContext, key: string, value: string) => {
  console.info('set_contextText', key, value);
  context.routing[key] = value;
  console.info('context updated:', context.routing);
};

ToolManager.registerTool(setContextText, {
  name: TOOL_SET_CONTEXT_TEXT,
  description: 'Call this function to set a conversational context value.',
  parameters: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Context category. eg: project_name, initial_description',
      },
      value: {
        type: 'string',
        description: 'The value to set for the key in the context. eg: "My Project"',
      },
    },
    required: ['key', 'value'],
  },
});
