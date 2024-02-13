import { ChatCompletionTool, LlmRequestMessage } from '../llm';
import { ModelConfig } from '.';
import { ChatCompletionToolChoiceOption } from '../llm/tools';
import { ModelSettings } from './AIConfig';
import { CancellationToken } from '../agents/AgentContext';

export const createChatRequestOptions = (
  cancellation: CancellationToken,
  options?: ChatRequestOptionsWithOptionalModelConfig,
): ChatRequestOptionsWithOptionalModelConfig => {
  return {
    ...options,
    cancellation,
  };
};

type ModelOptions = {
  /** Defaults to gpt-4 */
  model?: string;
  max_tokens?: number;
  // response_format: { type: 'json_object' },
  /**
   * What sampling temperature to use, between 0 and 2. Higher values like 0.8 will
   * make the output more random, while lower values like 0.2 will make it more
   * focused and deterministic.
   */
  temperature?: number;
};

export type ChatRequestOptionsWithOptionalModelConfig = (Partial<ModelSettings> | ModelOptions) & {
  tools?: ChatCompletionTool[];
  /** `none` is the default when no functions are present. `auto` is the default if functions are present. */
  tool_choice?: ChatCompletionToolChoiceOption;
  // user: 'user_1234',
  // ----------------- End OpenAI params -----------------

  /** If initially undefined, will be provided by Agent._prepareChatRequestOptions() */
  model_config?: ModelConfig;

  /** Required (HIGHLY recommended) for `copilotChatRequest`, should be provided for OpenAI also */
  cancellation?: {
    isCancellationRequested: boolean;
    onCancellationRequested: (listener: (e: any) => any) => any;
  };

  // [k: string]: string | number | undefined;
};

export type ChatRequestOptions = ChatRequestOptionsWithOptionalModelConfig & {
  /** Required by `openAiChatRequest()`, provides `api_key` and `model` (defaults to gpt-4) */
  model_config: ModelConfig;
};

export type ChatRequestArgs<O = ChatRequestOptions> = {
  messages: LlmRequestMessage[];
  options: O;
};
