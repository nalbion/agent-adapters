import { AgentConfig, AgentsYml, ModelConfig } from '../types';
import { normaliseRoutingContext } from '../utils/routingContext';

import readAiConfigFiles from './AIConfig';
import readOaiConfigList from './OAI_CONFIG_LIST';
import initialiseAgentsYml from './agents_yml';
import { logger } from '../utils';

/**
 * Attempts to locate and read the `agents.yml` file. If it doesn't exist, a default configuration is created.
 * Also searches for `*aiconfig.json` files in the same directory as `agents.yml` and adds them to the configuration.
 *
 * If `agents.yml` does not include a `config_list`, it will attempt to read the `OAI_CONFIG_LIST` environment variable or file.
 */
export async function readAgentConfig(): Promise<AgentsYml> {
  const agentsConfig = await initialiseAgentsYml();

  await readAiConfigFiles(agentsConfig);

  try {
    // Read config_list from OAI_CONFIG_LIST environment variable or file
    if (!agentsConfig.config_list) {
      agentsConfig.config_list = await readOaiConfigList();
    }

    for (const agent of agentsConfig.agents) {
      postProcessAgentConfig(agent, agentsConfig.config_list);
    }
  } catch (err) {
    logger.error('Error reading the LLM config list:', err);
  }

  return agentsConfig;
}

const postProcessAgentConfig = (agent: AgentConfig, root_config_list: ModelConfig[]) => {
  normaliseAgentConfig(agent);

  applyConfigListToAgent(agent, root_config_list);
};

/** The agent context values should be normalized to all lower case and no spaces, hyphens, or underscores etc. */
const normaliseAgentConfig = (agent: AgentConfig) => {
  if (agent.routing?.context) {
    normaliseRoutingContext(agent.routing.context);
  }
};

/**
 * Each agent should have an `llm_config` with a usable `config_list` (`model` name & `api_key` etc).
 */
const applyConfigListToAgent = (agent: AgentConfig, root_config_list: ModelConfig[]) => {
  if (agent.metadata?.models?.length && agent.llm_config === undefined) {
    // Copy AIConfig data into the agent's `llm_config` if it's not already there
    const aiModels = agent.metadata.models;
    agent.models = Object.keys(aiModels);
    const modelName = agent.metadata.default_model ? agent.metadata.default_model : agent.models[0];

    agent.llm_config = {
      // ...aiModels[modelName],
      model_settings: aiModels,
      config_list: [],
    };
  }

  // Filter & assign config_list for each agent
  const config_list =
    agent.models === undefined
      ? root_config_list
      : root_config_list.filter((config) => agent.models!.includes(config.model)).map((config) => ({ ...config }));

  if (!agent.llm_config) {
    agent.llm_config = { config_list };
  } else if (!agent.llm_config.config_list?.length) {
    agent.llm_config.config_list = config_list;
  }
};
