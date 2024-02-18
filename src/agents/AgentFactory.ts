import { Agent, AgentConfig } from '..';

export default class AgentFactory {
  private static agentCreators: { [role: string]: (agentConfig: AgentConfig) => Agent } = {};

  static registerAgentCreator(role: string, agentCreator: (agentConfig: AgentConfig) => Agent) {
    this.agentCreators[role] = agentCreator;
  }

  static createAgent(agentConfig: AgentConfig): Agent | undefined {
    if (agentConfig.routing?.roles?.length) {
      const agentCreator = this.agentCreators[agentConfig.routing.roles.sort().join(',')];
      if (agentCreator) {
        return agentCreator(agentConfig);
      }
    }

    return undefined;
  }
}
