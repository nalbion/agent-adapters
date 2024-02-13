import AgentRegistry, { AgentSearchOpts } from './utils/AgentRegistry';
import { WorkflowManager, createWorkflowManager } from './workflow/WorkflowManager';
import { AgentContext, ProgressData, RoutingContext } from './AgentContext';
import { AgentResponse, AgentResponseStatus } from './types/AgentResponse';
import { AgentInputMessage } from './types/AgentMessage';

import { LlmRequestMessage, LlmResponseMessage, sendChatRequest } from '../llm';
import { ModelManager } from '../models';
import { AgentConfig, ModelConfig } from '../types';
import { ToolManager } from '../tools';
import { SlashCommand } from '../types/AgentsYml';
import { ChatRequestOptions, ChatRequestOptionsWithOptionalModelConfig } from '../types/ChatRequest';
import { logger, normalisePath } from '../utils';
import { normaliseRoutingContext } from '../utils/routingContext';

export const INSTALLATION_COMMAND = 'installation';

export type InstallationInstructions = {
  message: string;
  detail?: string;
  items?: Array<{
    title: string;
    url: string;
  }>;
};

export function llmResponseMessageToAgentResponse(llmResponseMessage: LlmResponseMessage): AgentResponse {
  return {
    reply:
      llmResponseMessage.role === 'assistant'
        ? { content: llmResponseMessage.content }
        : { content: 'TODO - parse tool response' },
    status: AgentResponseStatus.DONE,
  };
}

export default abstract class Agent {
  name: string;
  installationNotes?: InstallationInstructions;
  // protected context: AgentContext = new AgentContext();
  protected workflowManager?: WorkflowManager;
  protected fallbacks: Agent[] = [];
  protected static defaultAgent: Agent;
  private disposeListeners: Array<() => void> = [];
  private slashCommandListeners: { [command: string]: () => AgentResponse | undefined } = {};
  protected logger = logger;

  constructor(
    protected agentConfig: AgentConfig,
    role?: string,
  ) {
    this.name = agentConfig.name;

    this.addRole(role || 'agent', agentConfig);

    if (agentConfig.routing?.context) {
      normaliseRoutingContext(agentConfig.routing.context);
    }

    AgentRegistry.registerAgent(agentConfig, this);
  }

  addDisposeListener(callback: () => void) {
    this.disposeListeners.push(callback);
  }

  // [Symbol.dispose](): void {
  dispose(): void {
    AgentRegistry.unregisterAgent(this.agentConfig.name);
    this.disposeListeners.forEach((callback) => callback());
  }

  async initialise(installationNotes: InstallationInstructions | undefined): Promise<void> {
    this.installationNotes = installationNotes;

    if (this.agentConfig.workflow_base_path) {
      this.workflowManager = createWorkflowManager(normalisePath(this.agentConfig.workflow_base_path));
      this.agentConfig.commands = await this.workflowManager?.getCommands();
    }
  }

  getCommands(): SlashCommand[] | undefined {
    if (this.agentConfig.commands && !this.installationNotes) {
      this.removeSlashCommandHandler(INSTALLATION_COMMAND);
    }

    return this.agentConfig.commands;
  }

  addSlashCommandHandler(command: string, description: string, callback: () => AgentResponse | undefined) {
    this.slashCommandListeners[command] = callback;

    if (!this.agentConfig.commands) {
      this.agentConfig.commands = [];
    }
    this.agentConfig.commands.push({ name: command, description });
  }

  removeSlashCommandHandler(command: string) {
    delete this.slashCommandListeners[command];
    this.agentConfig.commands = this.agentConfig.commands?.filter((c) => c.name !== command);
  }

  getRoles(): string[] {
    return this.agentConfig.routing?.roles || [];
  }

  toString() {
    return this.name;
  }

  /**
   * Adds the agent from agentConfig.routing.fallback to the fallbacks list
   * @param getAgent function provided by AgentRegistry to get an Agent instance by name
   */
  updateTeam(getAgent: (name: string) => Agent) {
    if (this.agentConfig.routing?.fallback) {
      this.fallbacks = [getAgent(this.agentConfig.routing.fallback)];
    }
  }

  updateModelConfig(newConfigList: ModelConfig[]) {
    const configList = this.agentConfig.llm_config?.config_list;
    if (configList) {
      let i = configList.length;
      while (i-- !== 0) {
        const agentConfig = configList[i];
        const newConfig = newConfigList.find((config) => config.model === agentConfig.model);
        if (newConfig) {
          configList[i] = { ...agentConfig, ...newConfig };
          logger.info(
            `Updated model ${agentConfig.model} in agent ${this.name} config_list from ${agentConfig} to ${configList[i]}`,
          );
        } else {
          logger.info(`Removing model ${agentConfig.model} from agent ${this.name} config_list`);
          configList.splice(i, 1);
        }
      }
    }
  }

  /** Called by AgentRegistry when an Agent is disposed */
  removeAgentFromTeam(name: string) {
    this.fallbacks = this.fallbacks.filter((agent) => agent.name !== name);
  }

  /**
   * Filters agents by role and sorts by context
   * @see filterAgentsByContext(), AgentRegistry.searchAgents()
   */
  findAgentsByRole(role: string, context: RoutingContext): Agent[] {
    return AgentRegistry.searchAgents(role, { context, team: this.agentConfig.routing?.team });
    // TODO: use fallbacks?
  }

  /**
   * Receive a message from another Agent and respond to it.
   * Subclasses should override `processUserRequest()` if they want to be able to use the WorkflowManager.
   * This method falls back to `sendMessageToAgent()` to delegate through AgentRegistry.
   */
  async receiveMessage(input: AgentInputMessage, context: AgentContext): Promise<AgentResponse> {
    logger.info(`Agent ${this.name} receiveMessage`, input);

    for (const [command, callback] of Object.entries(this.slashCommandListeners)) {
      if (input.command === command) {
        const response = callback();
        if (response) {
          context.onProgress({ type: 'content', content: response.reply.content });
          return response;
        }
      }
    }

    const response = await this.processUserRequest(input, context);
    if (response) {
      return response;
    }

    return this.sendMessageToAgent('?', input, context);
  }

  /**
   * Called from receiveMessage, this is the Agent's chance to respond to the user's input.
   * The response may be based on the input, the context and the Agent's state.
   * If the Agent returns a response, it will be sent to the user.
   * If the Agent returns undefined, the Router will forward the message to the default Agent.
   *
   * @param input The user's input message
   * @param context The Agent's context
   * @returns A response to the user, or undefined  TODO - or AgentResponse?
   */
  protected processUserRequest(
    input: AgentInputMessage,
    context: AgentContext,
  ): Promise<AgentResponse | undefined> | undefined {
    return this.workflowManager?.processUserRequest(input, context, this);
  }

  /**
   * The prompt may be based on the input, the context and the Agent's state.
   *
   * Agent implementations may override this method and use prompt templates with parameters from the context etc.
   * eg: If full-stack & current focus is on the front-end, prompt with a front-end question.
   *     If full-stack and current focus is unknown:
   *  "You should focus on front-end first, build something to present to the client for feedback, validation & iteration.
   */
  protected generateSystemPrompt(input: AgentInputMessage, context: AgentContext): string | undefined {
    return this.agentConfig.prompts?.find((p) => p.name === 'system')?.input as string;
  }

  /**
   * @param agent agent `role` or actual Agent instance
   */
  protected async sendMessageToAgent(
    agent: Agent | string,
    input: AgentInputMessage,
    context: AgentContext,
  ): Promise<AgentResponse> {
    const resolvedAgents = typeof agent === 'string' ? AgentRegistry.searchAgents(agent) : [agent];

    if (resolvedAgents?.length === 1) {
      logger.info(`Agent ${this.name} sendMessageToAgent ${agent} resolved agent "${agent}:`, resolvedAgents[0]);
      return await resolvedAgents[0].receiveMessage(input, context);
    }

    const fallbacks = this.filterAgentsByContext({
      context: context.routing,
      team: this.fallbacks.map((agent) => agent.name),
    });

    if (fallbacks.length) {
      logger.info(`Agent ${this.name} sendMessageToAgent - fallback`, fallbacks[0].name);
      return fallbacks[0].receiveMessage(input, context);
    }

    if (this === Agent.defaultAgent) {
      return { reply: { content: "Sorry, I'm not sure how to help." }, status: AgentResponseStatus.DONE };
    }

    logger.info(`Agent ${this.name} sendMessageToAgent - default agent`, input);
    return Agent.defaultAgent.receiveMessage(input, context);
  }

  async executeInternalTool(context: AgentContext, name: string, parameters: any) {
    const tool = ToolManager.getTool(name);
    if (!tool) {
      throw new Error(`Agent ${this.name} has no tool named ${name}`);
    }

    logger.info(`Agent ${this.name} executeInternalTool ${name} with parameters:`, parameters);
    tool.execute(context, ...parameters);
  }

  addRole(role: string, agentConfig: AgentConfig) {
    if (!agentConfig.routing) {
      agentConfig.routing = {};
    }
    if (!agentConfig.routing.roles) {
      agentConfig.routing.roles = [];
    }
    if (!agentConfig.routing.roles.includes(role)) {
      agentConfig.routing.roles.push(role);
    }
  }

  getDescriptionForRoutingLlm(): string {
    let description = this.agentConfig.description;
    if (this.agentConfig.routing?.context) {
      description += `\nThis agent can work within the following context: ${JSON.stringify(this.agentConfig.routing.context)}`;
    }
    if (this.agentConfig.routing?.roles) {
      description += `\nSpecialising in roles: ${this.agentConfig.routing.roles.join(', ')}`;
    }

    return description;
  }

  /**
   * Sends the message to the LLM
   */
  sendMessagesToLlm(
    input: LlmRequestMessage[],
    onProgress: (progressData: ProgressData) => void,
    options?: ChatRequestOptionsWithOptionalModelConfig,
  ): Promise<LlmResponseMessage> {
    return sendChatRequest(input, this.prepareChatRequestOptions(options), onProgress);
  }

  protected prepareChatRequestOptions(options?: ChatRequestOptionsWithOptionalModelConfig): ChatRequestOptions {
    return this._prepareChatRequestOptions(options);
  }

  protected filterAgentsByContext(searchOpts: AgentSearchOpts): Agent[] {
    const role = '?';
    return AgentRegistry.searchAgents(role, searchOpts);
  }

  /**
   * Selects an LLM model and merges the Agent's llm_config with the provided options
   */
  private _prepareChatRequestOptions(options?: ChatRequestOptionsWithOptionalModelConfig): ChatRequestOptions {
    const { llm_config } = this.agentConfig;
    const { config_list, ...agent_llm_opts } = llm_config || {};
    // TODO: what if model is "copilot"? that should be safe
    const model_config = this.requireModelConfig(options, config_list);

    let configuredOptions: ChatRequestOptions = {
      ...agent_llm_opts, // cache_seed, max_tokens, temperature
      ...options, // tools, tool_choice & the above
      // cancellation,
      model_config: options?.model_config || model_config,
    };

    return configuredOptions;
  }

  /**
   * Selects an LLM model config from `options` or selects the default
   */
  private requireModelConfig(options?: Partial<ChatRequestOptions>, config_list?: ModelConfig[]): ModelConfig {
    let { model_config, model } = options || {};

    if (!model_config) {
      model_config = ModelManager.getModelConfig(model, config_list);
      if (!model_config) {
        throw new Error(`Agent ${this.name} has no LLM model_config`);
      }
    }

    return model_config;
  }
}
