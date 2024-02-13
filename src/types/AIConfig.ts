/** @see https://aiconfig.lastmileai.dev/docs/overview/ai-config-format#root-metadata */
export type AIConfigRootMetadata = {
  /** Parameters key-value pairs that may be used in one or more text prompt inputs with the handlebars {{parameter_name}} syntax */
  parameters?: { [name: string]: string };
  /**
   * Globally defined model settings.
   * Any prompts that use these models will have these settings applied by default,
   * unless they override them with their own model settings
   */
  models?: { [name: string]: ModelSettings };
  default_model?: string;
  /**
   * This is useful if you want to use a custom ModelParser for a model, or if a single ModelParser can handle multiple models.
   * @example { "mistralai/Mistral-7B-v0.1": "HuggingFaceTextGenerationParser" }
   * @see https://aiconfig.lastmileai.dev/docs/extensibility#define-a-custom-modelparser
   */
  model_parsers?: { [model: string]: string };
  // Additional properties can be specified that may be used for specific use-cases.
};

export type ModelSettings = {
  model: string;
  top_p?: number;
  max_tokens?: number;
  temperature?: number;
  system_prompt?: string;
  presence_penalty?: number;
  frequency_penalty?: number;
  // stream?: boolean;
  // Bison
  // topK?: number;
  // topP?: number;
  // maxOutputTokens?: number;
  [k: string]: string | number | undefined;
};

/** @see https://aiconfig.lastmileai.dev/docs/overview/ai-config-format#prompts */
export type AiConfigPrompt = {
  /** A unique identifier for the prompt. This is used to reference the prompt. */
  name: string;
  /** The input prompt - this can be a string, or a complex object that represents one or more inputs (e.g. image URI and string prompt). */
  input: PromptInput;
  /**
   * Prompt-specific metadata that applies to this prompt, containing things like model settings and prompt parameters.
   * This gets merged with the root metadata, and takes precedence for overridden properties.
   */
  metadata?: AiConfigPromptMetadata;
  /** Optional array of outputs representing a previous inference run for this prompt */
  outputs?: PromptOutput | PromptOutput[];
  // Additional properties can be specified that may be used for specific use-cases.
};

type AiConfigPromptMetadata = {
  /** If this is undefined, the default_model specified in the root metadata will be used. */
  model?:
    | string
    | {
        name: string;
        settings: ModelSettings;
      };
  /** Parameters key-value pairs that may be used in one or more text prompt inputs with the handlebars {{parameter_name}} syntax */
  parameters?: { [name: string]: string };
  /** A list of string tags on the prompt */
  tags?: string[];
  // Additional properties can be specified that may be used for specific use-cases.
  // remember_chat_context?: boolean;
};

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

type PromptInput =
  | {
      /**
       * Input to the model. This can represent a single input, or multiple inputs.
       * The structure of the data object is up to the ModelParser. For example,
       * a multi-modal ModelParser can choose to key the data by MIME type.
       */
      data?: JSONValue;
      [k: string]: any;
    }
  | string;

type PromptOutput = ExecuteResult | Error;

type ExecuteResult = {
  output_type: 'execute_result';

  /**
   * A result's prompt number (0 based), if there are multiple outputs (e.g. multiple choices).
   */
  execution_count?: number;

  /**
   * The result of executing the prompt.
   * @example { role: "assistant", content: "Sure, here is the resposne..." }
   */
  data: JSONValue;

  /**
   * The MIME type of the result. If not specified, the MIME type will be assumed to be plain text.
   */
  mime_type?: string;

  /**
   * Output metadata.
   * @example { id: "", object: "chat.completion", "created": ms, model: "gpt-4",
   *           usage: {prompt_tokens, completion_tokens,total_tokens}, finish_reason: "stop"}
   */
  metadata?: {
    [k: string]: any;
  };
};

type Error = {
  /** Type of output. */
  output_type: 'error';

  /** The name of the error. */
  ename: string;

  /** The value, or message, of the error. */
  evalue: string;

  /** The error's traceback, represented as an array of strings. */
  traceback: string[];
};
