import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionToolChoiceOption } from 'openai/resources/index.mjs';
import { LlmMessage, LlmResponseMessage, assistantResponse, toolResponse } from '../message';
import { ChatRequestOptions } from '../../types/ChatRequest';
import { ModelConfig } from '../../types';
import { ProgressData } from '../../agents/AgentContext';

const llmClients: { [model: string]: OpenAI } = {};

const getLlmClient = (config: ModelConfig) => {
  if (!llmClients[config.model]) {
    llmClients[config.model] = new OpenAI({
      apiKey: config.api_key || process.env['OPENAI_API_KEY'],
      baseURL: config.base_url,
      // baseURL: 'https://api.openai.com/v1',  // /chat/completions
      // apiVersion: config.api_version,
    });
  }
  return llmClients[config.model];
};

const toOpenAiMessage = ({ role, content }: LlmMessage): ChatCompletionMessageParam =>
  ({ role, content }) as ChatCompletionMessageParam;
export const fromOpenAiMessage = (message: LlmResponseMessage): LlmMessage =>
  message.role === 'assistant' ? message : { role: 'tool', content: 'TODO: tool response' }; // JSON.stringify(message.tool.function) });

export const openAiChatRequest = async (
  messages: LlmMessage[],
  { model_config, ...chatRequestOptions }: ChatRequestOptions,
  onProgress: (progressData: ProgressData) => void,
): Promise<LlmResponseMessage> => {
  // To talk to local LLM use Ollama? - https://docs.litellm.ai/docs/providers/ollama#litellmollama-docker-image
  const model = getLlmClient(model_config);
  const { cancellation, ...openAiOptions } = chatRequestOptions;

  console.info('openAiChatRequest', messages, openAiOptions);

  if (openAiOptions.tools) {
    // Send request & handle tool (function calling) response
    const tool_choice: ChatCompletionToolChoiceOption =
      chatRequestOptions.tool_choice || openAiOptions.tools.length === 1
        ? { type: 'function', function: { name: openAiOptions.tools[0].function.name } }
        : 'auto';

    const body = {
      messages: messages.map(toOpenAiMessage),
      // model: 'gpt-3.5-turbo',
      model: 'gpt-4', // can be over-ridden by options
      // response_format: ,
      temperature: 0.2,
      tool_choice,
      ...openAiOptions, // frequency_penalty, logit_bias, logprobs, max_tokens, n, presence_penalty,
      // response_format, seed, stop, stream, temperature, tools, tool_choice,
      // top_logprobs, top_p, user
    };
    console.info('body:', body);

    const completion = await model.chat.completions.create(body);

    // TODO: cancellation
    // if (options.cancellation?.isCancellationRequested) {
    //   eventEmitter.fire(token.onCancellationRequested);
    // }

    switch (completion.choices[0].finish_reason) {
      case 'stop':
        const content = completion.choices[0].message.content;
        if (content) {
          return assistantResponse(content);
        }
      case 'tool_calls':
        const tools = completion.choices[0].message.tool_calls;
        if (tools) {
          return toolResponse(tools);
        }
        break;
    }

    throw new Error('Unexpected finish_reason: ' + completion.choices[0].finish_reason);
  } else {
    const completion = await model.chat.completions.create({
      model: 'gpt-4', // can be over-ridden by options
      messages: messages.map(toOpenAiMessage),
      stream: true,
      ...openAiOptions, // frequency_penalty, logit_bias, logprobs, max_tokens, n, presence_penalty,
      // response_format, seed, stop, stream, temperature, tools, tool_choice,
      // top_logprobs, top_p, user
    });

    let buffer = '';

    for await (const chunk of completion) {
      if (cancellation?.isCancellationRequested) {
        break;
      }

      const content = chunk.choices[0].delta.content;
      if (content) {
        buffer += content;
        onProgress({ type: 'content', content });
      }

      // TODO: cancellation
      // if (options.cancellation?.isCancellationRequested) {
      //   eventEmitter.fire(token.onCancellationRequested);
      // }

      // chunk.choices[0].finish_reason;

      // if (content) {
      //   return assistantResponse(content);
      // }
    }

    return assistantResponse(buffer);
  }
};
