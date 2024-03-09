import { ToolDefinition } from '../../tools/ToolTypes';
import { ModelSettings } from '../../types/AIConfig';
import { SlashCommand } from '../../types/AgentsYml';

/**
 * Allows AI agent workflows to be described by using a JSON API definition.
 * The idea is that an Agent Workflow should be able to be defined in YAML files
 * and given to an AI agent which has no other knowlege of the workflow.
 */
export type WorkflowDefinition = {
  steps: { [id: string]: StepDefinition };
  tools?: { [id: string]: ToolObjectDefinition };
  // included: Array<LlmRequestObjectDefinition | ToolObjectDefinition>;
  // meta: any;
};

export type StepRequirement = {
  name: string;
  /** `undefined`, /regex/ - possibly a number? */
  condition?: number | string;
};

export type StepProvide = {
  name: string;
  type?: 'string' | 'array';
  description?: string;
};

export type FollowUp = {
  /**
   * The message to send to the chat.
   */
  prompt: string;

  /**
   * A title to show the user. The prompt will be shown by default, when this is unspecified.
   */
  label?: string;

  /**
   * By default, the followup goes to the same participant/command. But this property can be set to invoke a different participant.
   * Followups can only invoke a participant that was contributed by the same extension.
   */
  participant?: string;

  /**
   * By default, the followup goes to the same participant/command. But this property can be set to invoke a different command.
   */
  command?: string;
};

/**
 * A Step defines an entry point for a step in the workflow.
 */
export type StepDefinition = {
  name?: string;
  /** A list of properties that are required to be (or not) in context */
  requires?: StepRequirement[];
  /** Properties which will be added to the context */
  provides?: StepProvide[];
  // llm_request: LlmRequestDefinition;
  /**
   * The role of the Agent required to process the request.
   * If the role is "user" then the user will be prompted to provide the information.
   * @example "product_owner", "developer", "user"
   */
  role: string;
  /**
   * Allows VS Code chat to invoke this step using a slash command.
   * The system should automatically register the slash command with the agent.
   * @example "/step_goals let's do a new step".
   */
  command?: SlashCommand;
  prompts: Prompt[];
  /** Allows for model, temperature etc to be  */
  options?: ModelSettings;
  tools?: string[];
  /** Can be used to show suggestions for the user's next response/action */
  followups?: FollowUp[];
  links?: { [id: string]: LinkDefinition };
};

type Prompt = {
  content: string;
  role?: 'system' | 'assistant' | 'user';
};

// type LlmRequestDefinition = {
//   messages: Array<{
//     content: string;
//     role: 'system' | 'assistant' | 'user';
//   }>;
//   options: {
//     model?: string;
//   };
//   /** Tool definitions don't belong here because they must also specify a `callback` */
//   tools?: string[];
// };

/**
 * For `"get_current_weather", {location: "San Francisco, CA", units: "celsius"}`
 * @example
 *   command: "python",
 *   args: ["~/agents/tools/get_current_weather.py"]
 *
 *    ```
 *    python ~/agents/tools/get_current_weather.py \
 *       --location="San Francisco, CA" \
 *       --unit=celsius
 *    ```
 * @example
 *   base_url: "https://weather.com"
 *
 *    `https://weather.com?location=San Francisco, CA&unit=celsius`
 */
export type ToolObjectDefinition = {
  definition: ToolDefinition;
  callback?: { cli: ToolCliConfig } | { remote: ToolRemoteConfig };
};

export type ToolCliConfig = {
  /**
   * The command to execute.
   * @example "python"
   */
  command: string;
  /**
   * Any extra args which must be provided before the tool's parameters.
   * @example ["~/agents/tools/get_current_weather.py"]
   */
  args?: string[];
};

export type ToolRemoteConfig = {
  /**
   * The URL of the remote agent
   * @example "https://weather.com"
   */
  base_url: string;
};

/**
 * The user may be able to select a specific option by clicking on a link in VS Code chat, as per `title`.
 */
export type LinkDefinition =
  | 'internal'
  | {
      /**
       * `baseUrl` might be, for example https://raw.githubusercontent.com/nalbion/agent_workflows/main/workflows/scrum
       * @example [baseUrl]/steps/1_initial_consultation.yml#initial_consultation
       */
      href: string;
      // rel?: "next" | "index";
      // /** could be used with ChatAgentReplyFollowup.title */
      // title?: string;
      /** this link can/should be navigated to if the requirements are satisfied */
      requires?: Record<string, boolean | string | number>;
    };
