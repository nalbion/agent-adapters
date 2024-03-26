import Agent from '../Agent';
import AgentRegistry, { filterContext } from '../utils/AgentRegistry';
import { AgentInputMessage, agentMessageToLlmMessages } from '../types/AgentMessage';
import { AgentConfig } from '../../types';
import { AgentRoutingContext } from '../../types/AgentsYml';
import { AgentContext, RoutingContext } from '../AgentContext';
import { ToolManager } from '../../tools/ToolManager';
import { createChatRequestOptions } from '../../types/ChatRequest';
import { AgentResponse, AgentResponseStatus } from '../types/AgentResponse';

export default class RouterAgent extends Agent {
  private agent?: Agent;
  // private team: Agent[] = [];

  constructor(agentConfig: AgentConfig) {
    super(agentConfig, 'router');
  }

  // /**
  //  * <strike reason="not used">Maps the agent names in the routing.team array to the actual Agent instances</strike>
  //  * @param getAgent function provided by AgentRegistry to get an Agent instance by name
  //  */
  // override updateTeam(getAgent: (name: string) => Agent) {
  //   if (this.agentConfig.routing?.team) {
  //     this.team = this.agentConfig.routing.team.map(getAgent);
  //   }
  //   // this.logger.info('RouterAgent.updateTeam', this.agentConfig.routing?.team, this.team);
  //   super.updateTeam(getAgent);
  // }

  // override removeAgentFromTeam(name: string): void {
  //   this.team = this.team.filter((agent) => agent.name !== name);
  //   super.removeAgentFromTeam(name);
  // }

  override async receiveMessage(input: AgentInputMessage, context: AgentContext): Promise<AgentResponse> {
    // if (type == 'alert'):
    // return receiveAlert(sender, input)
    this.logger.info('Router received message:', input.content);

    while (true) {
      if (!this.agent) {
        this.agent = await this.chooseAgent(input, context);
        this.logger.info('Selected new agent:', this.agent.name);
      }

      let { reply, status } = await this.sendMessageToAgent(this.agent, input, context);

      this.logger.info('Router received reply from agent', this.agent.name, reply.content);

      if (reply.content) {
        context.onProgress({ type: 'markdown', content: reply.content });
      } else {
        // presumably we have nothing else to say to this agent
        this.agent = undefined;
      }

      if (status === AgentResponseStatus.NEXT_STEP && !reply.content) {
        // NEXT_STEP and nothing to say, keep going
        input.command = undefined;
      } else {
        return { reply, status };
      }
    }

    // while (action is AgentAction) {
    //   reply, action = self.route_action(action)
    // }

    // if (action.type === Done.type) {
    //   this.agent = undefined;
    // }

    // TODO: is this call necessary?
    // this.sendMessageToAgent('user', reply, context);
    // return { reply, status };
  }

  /**
   * - calls AgentRegistry.searchAgents('?', context, team) (via filterAgentsByContext())
   *
   * - Subclasses could use heuristics (see also WorkflowAgent, filterAgentsByContext(), prepareRoutingPrompt(context)):
   *   - project name/description provided?
   *   - architecture unknown?
   *   - stories undefined or all done?
   *
   * - Fallback to LLM:
   *    You are a routing agent within a system of LLM agents
   *    I need you to select the most appropriate agent to handle this request.
   *    {{ agent roles & descriptions }}
   *    {{ filtered context }}
   *    {{ user input }}
   * @param agent
   * @param input
   * @param context
   */
  protected async chooseAgent(
    input: AgentInputMessage,
    context: AgentContext,
    contextKeysToCompare?: string[],
  ): Promise<Agent> {
    const filteredContent = filterContext(context.routing, contextKeysToCompare);

    // Filter the team of agents by context & name
    const agents = this.filterAgentsByContext(
      {
        context: filteredContent,
        contextKeysToCompare,
        team: this.agentConfig.routing!.team,
      },
      input,
      context,
    );
    this.logger.info('RouterAgent.chooseAgent filtered to candidates:', agents);

    let agentName: string | undefined = agents[0]?.name;

    if (agents.length > 1) {
      const systemMessage = this.prepareRoutingPrompt(filteredContent);
      const messages = agentMessageToLlmMessages(input, systemMessage);

      // const tools = AgentRegistry.getAsTools();
      // const set_context = ToolManager.getTool(SET_CONTEXT_TOOL);
      // tools.push(set_context.openAiFormat());
      const tools = [AgentRegistry.getAsTool(agents)];
      const options = createChatRequestOptions(context.cancellation, { tools, temperature: 0 });

      const response = await this.sendMessagesToLlm(messages, context.onProgress, options);

      this.logger.info('RouterAgent.chooseAgent LLM response:', response);

      if (response.role !== 'tool') {
        this.logger.warn(
          'RouterAgent expected a tool response from the LLM indicating the chosen agent. ' + response.content,
        );
      } else {
        const tool = response.tools[0];
        if (tool.function.name === AgentRegistry.SELECT_AGENT_TOOL) {
          const [resolvedAgent, setContext] = ToolManager.parseToolParameters(tool.function.arguments);
          agentName = resolvedAgent as string;

          if (setContext) {
            context.mergeRoutingContext(setContext as AgentRoutingContext);
          }
        }

        this.logger.info('LLM routed to agent:', agentName);
      }
    }

    // The AgentRegistry will resolve the Agent by name, or select the highest ranking Agent according to the context.
    const agent = AgentRegistry.searchAgents(agentName || '?', { context: context.routing })[0];
    context.onProgress({ type: 'progress', content: `Using agent: ${agent.name}` });
    return agent;
  }

  protected prepareRoutingPrompt(filteredContent?: RoutingContext): string {
    let systemMessage =
      this.agentConfig.prompts?.find((p) => p.name === 'background')?.input ||
      'You are a routing agent within a system of LLM agents. ' +
        'I need you to select the most appropriate agent to handle this request.\n' +
        'In addition to one of the Agent tools, please also call the `set_context` function to add information ' +
        " to the conversation's context based on what you know about the user's request and why you selected the agent. " +
        'You must respond with a function calling/tool response answering the following questions:\n' +
        '1: Which agent is best matched to service this call?\n' +
        '2: Have they mentioned any specific languages or technologies?';

    if (filteredContent) {
      systemMessage += `\nContext: ${JSON.stringify(filteredContent)}`;
    }

    return systemMessage as string;
  }

  protected routeAction(_status: AgentResponseStatus): AgentResponseStatus {
    // may need to push the agent onto a stack?

    // switch (status) {
    //   case NEEDS_DEBUGGING:
    //   return this.sendMessageToAgent('debugger', action.to_message();
    //   case TASK_DONE:
    //   return this.sendMessageToAgent('scrum_master', NEXT_TASK)
    // }

    // ...try custom agents?

    return AgentResponseStatus.DONE;
  }
}
