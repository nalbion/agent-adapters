import Agent from '../Agent';
import { AgentContext } from '../AgentContext';
import { AgentInputMessage, AgentResponse, AgentResponseStatus, agentMessageToLlmMessages } from '../types';
import { ChatCompletionTool } from '../../llm';
import { Tool, ToolDefinition, ToolCallback } from '../../tools';
import { AgentConfig } from '../../types';
import { createChatRequestOptions } from '../../types/ChatRequest';
import { ToolConfig } from '../../tools/ToolConfig';

export default class OpenAiAgent extends Agent {
  private tools: { [name: string]: ToolConfig } = {};

  constructor(agentConfig: AgentConfig) {
    super(agentConfig);
  }

  registerTool(callback: ToolCallback, definition: ToolDefinition) {
    this.tools[definition.name] = {
      definition,
      implementation: new Tool(definition.name, definition, callback),
    };
  }

  override async processUserRequest(input: AgentInputMessage, context: AgentContext): Promise<AgentResponse> {
    let response = await super.processUserRequest(input, context);

    if (!response) {
      // async sendMessage(input: AgentInputMessage): Promise<AgentResponse> {
      console.info('OpenAiAgent.receiveMessage', input.content);
      const messages = agentMessageToLlmMessages(input, this.generateSystemPrompt(input, context));

      const tools = Object.values(this.tools);
      const options = createChatRequestOptions(context.cancellation, {
        tools:
          tools.length === 0
            ? undefined
            : Object.values(this.tools).map<ChatCompletionTool>((tool) => ({
                type: 'function',
                function: tool.definition,
              })),
      });

      const llmResponse = await this.sendMessagesToLlm(messages, context.onProgress, options);

      console.info('OpenAiAgent.receiveMessage LLM response:', response);

      if (llmResponse.role === 'assistant') {
        response = { reply: { content: llmResponse.content }, status: AgentResponseStatus.DONE };
      } else {
        const { tools } = llmResponse;
        const results = await Promise.all(
          tools.map((tool) =>
            this.tools[tool.function.name].implementation.execute(context, JSON.parse(tool.function.arguments)),
          ),
        );

        response = {
          reply: {
            content: results.map((result, i) => `# ${tools[i].function.name}\n\n${result}\n`).join('\n'),
          },
          status: AgentResponseStatus.DONE,
        };
      }
    }

    return response;
  }
}
