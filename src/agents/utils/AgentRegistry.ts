import { ChatCompletionTool } from '../../llm/tools';
import { AgentConfig } from '../../types';
import Agent from '../Agent';
import { RoutingContext } from '../AgentContext';

export type AgentSearchOpts = {
  context?: RoutingContext;
  contextKeysToCompare?: string[];
  // team?: Agent[];
  team?: string[];
};

export default class AgentRegistry {
  static agentsByRole: { [role: string]: AgentConfig[] } = {};
  static agents: { [name: string]: Agent } = {};
  static SELECT_AGENT_TOOL = 'select_agent';

  static registerAgent(config: AgentConfig, agent: Agent) {
    if (config.routing?.roles) {
      config.routing.roles.forEach((role) => {
        if (!this.agentsByRole[role]) {
          this.agentsByRole[role] = [];
        }
        this.agentsByRole[role].push(config);
      });
    }

    this.agents[config.name] = agent;
  }

  static unregisterAgent(name: string) {
    const agent = this.agents[name];
    if (agent) {
      delete this.agents[name];
    }

    for (const role in this.agentsByRole) {
      this.agentsByRole[role] = this.agentsByRole[role].filter((agentConfig) => agentConfig.name !== name);
    }

    for (const otherAgent of Object.values(this.agents)) {
      otherAgent.removeAgentFromTeam(name);
    }
  }

  static manageTeams() {
    for (const agent of Object.values(this.agents)) {
      agent.updateTeam((name) => this.agents[name]);
    }
  }

  static getAllAgents(): Agent[] {
    return Object.values(this.agents);
  }

  /**
   * @param {string} role - The role of the agent to search for, eg: developer, tester.
   * @param {RoutingContext} searchOpts.context - Optional. The context to match against.
   *         Before getting to this point, both task and agent context values should be normalized
   *         to all lower case and no spaces, hyphens, or underscores etc.
   *         eg: { languages: ["typescript", "yaml"], framework: ["nodjs"], dependencies: ["openai"], platform: ["web", "vscode"]}
   * @param {string[]} searchOpts.contextKeysToCompare - Optional. The keys in the context to consider for ranking.
   *         eg: ['languages', 'framework', 'dependencies', 'platform']
   * @param {string[]} searchOpts.team - Optional. Names of agents within the team.
   * @returns {Agent[]} The agents that match the given role and context.
   */
  static searchAgents(role: string, searchOpts?: AgentSearchOpts): Agent[] {
    // agentConfigs: [{name, roles, context, ...}, ...]
    let agentConfigs: AgentConfig[] | undefined;

    if (role) {
      let agent = this.agents[role];
      if (agent) {
        return [agent];
      }

      agentConfigs = this.agentsByRole[role];
    } else {
      agentConfigs = undefined;
    }

    // If no role is given, return all agents
    if (!agentConfigs) {
      agentConfigs = Object.values(this.agentsByRole).flat();
      // console.info('No role given, using all agents:', agentConfigs);
    }

    if (searchOpts?.team?.length) {
      agentConfigs = agentConfigs.filter((agentConfig) => searchOpts.team!.includes(agentConfig.name));
      // console.info('Filtered agents by team:', agentConfigs);
    }

    if (searchOpts?.context) {
      agentConfigs = this.rankAgents(agentConfigs, searchOpts.context, searchOpts.contextKeysToCompare);
      // console.info('Ranked agents:', agentConfigs);
    }

    // Gather the filtered & ranked Agents
    const agents: Agent[] = [];
    agentConfigs.forEach((agentConfig) => {
      agents.push(this.agents[agentConfig.name]);
    });

    return agents;
  }

  static getAsTool(agents?: Agent[]): ChatCompletionTool {
    let agentNames: string[];
    let agentRoles: string[];

    if (agents) {
      agentNames = agents.map((agent) => agent.name);
      agentRoles = agents.reduce((roles, agent) => roles.concat(agent.getRoles()), [] as string[]);
    } else {
      agents = Object.values(this.agents);
      agentNames = Object.keys(this.agents);
      agentRoles = Object.keys(this.agentsByRole);
    }

    return {
      type: 'function',
      function: {
        name: this.SELECT_AGENT_TOOL,
        description: 'Select the most appropriate agent to handle this request',
        parameters: {
          type: 'object',
          properties: {
            agent: {
              type: 'string',
              description:
                'The agent to send the input to:\n' +
                agents
                  .map((agentConfig) => {
                    const agent = AgentRegistry.agents[agentConfig.name];
                    return `- ${agentConfig.name}: ${agent.getDescriptionForRoutingLlm()}`;
                  })
                  .join('\n\n'),
              enum: agentNames,
            },
            role: {
              type: 'string',
              description: 'The role of the agent to send the input to',
              enum: agentRoles,
            },
            set_context: {
              type: 'object',
              description: 'Update the conversation context with any relevant information extracted from the request',
              properties: {
                context: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: {
                      type: 'array',
                      items: {
                        type: 'string',
                        pattern: '^[a-z-]+$',
                        description: 'List of names/terms, lower-case letters only with no spaces, hyphens, dashes etc',
                      },
                    },
                    description:
                      'Context category. Preferred values: languages, frameworks, platforms, dependencies, os, regions',
                  },
                },
              },
            },
          },
          required: ['agent'],
        },
      },
    };
  }

  /**
   * Ranks agents based on their context matches and `agent.routing.rank`.
   * This function is used to prioritize agents based on their relevance to a given context.
   * Each agent may have a `agent.routing.rank` head start, or it may be undefined.
   * The rank should increase based on the number of task matches it has in the task context.
   * Once ranked, agents are sorted by `agent.routing.rank` in descending order, with the highest at [0].
   *
   * Usage:
   * If `context` is `{ languages:[], random: ["sdf"], framework:[]}` and the optional parameter is
   * `["languages", "framework"]` then the values in `random` will not be considered in the ranking.
   *
   * @param {AgentConfig[]} agentConfigs - The agents to rank.
   * @param {AgentRoutingContext} context - The context to match against.
   * @param {string[]} contextKeysToCompare - Optional. The keys in the context to consider for ranking.
   * @returns {Agent[]} The agents ranked in descending order of rank.
   */
  private static rankAgents(
    agentConfigs: AgentConfig[],
    context: RoutingContext,
    contextKeysToCompare?: string[],
  ): AgentConfig[] {
    return agentConfigs
      .map((agent) => {
        let rank = agent.routing?.rank || 0;

        if (agent.routing?.context) {
          const agentContext = agent.routing.context;

          processContextKeys(context, contextKeysToCompare, (key) => {
            const contextItems = context[key];
            const agentItems = agentContext[key];

            if (agentItems?.some((item) => contextItems.includes(item))) {
              rank++;
            }
          });
        }

        return { ...agent, rank };
      })
      .sort((a, b) => b.rank - a.rank);
  }
}

const processContextKeys = (
  context: RoutingContext,
  keysToProcess: string[] | undefined,
  callback: (key: string) => void,
): void => {
  const keys = keysToProcess || Object.keys(context);
  keys.forEach(callback);
};

export const filterContext = (context?: RoutingContext, keysToCompare?: string[]): RoutingContext | undefined => {
  if (!context || !keysToCompare) {
    return context;
  }

  const filteredContext: RoutingContext = {};

  processContextKeys(context, keysToCompare, (key) => {
    filteredContext[key] = context[key];
  });

  return filteredContext;
};
