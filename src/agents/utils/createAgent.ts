import Agent, { InstallationInstructions } from '../Agent';
import GitClient from '../adapters/GitClient';
import RouterAgent from '../roles/RouterAgent';
import AgentProtocolClient from '../adapters/AgentProtocolClient';
import CliClientAgent from '../adapters/CliClientAgent';
import OpenAiAgent from '../adapters/OpenAiAgent';
import { AgentConfig } from '../../types';
import { normalisePath } from '../../utils/fileUtils';

export const createAgent = async (agentConfig: AgentConfig): Promise<Agent | undefined> => {
  let agent: Agent | undefined;
  let installationNotes: InstallationInstructions | undefined;

  if (agentConfig.git) {
    agentConfig.git.baseDir = normalisePath(agentConfig.git.baseDir);
    const installationRequired = await pullGitRepo(agentConfig);
    if (installationRequired) {
      installationNotes = {
        message: `The git repo was cloned for ${agentConfig.name}`,
        detail:
          `The git repo ${agentConfig.git.repo}/tree/${agentConfig.git.branch} was cloned to ${agentConfig.git.baseDir}.\n` +
          'You may need to follow any installation instructions in the repo README.md.',
        items: [
          {
            title: 'View README',
            url: `${agentConfig.git.repo}/tree/${agentConfig.git.branch}`,
          },
          {
            title: 'Open project',
            url: agentConfig.git.baseDir,
          },
        ],
      };
    }
  }

  if (agentConfig.routing?.team) {
    agent = new RouterAgent(agentConfig);
  } else if (agentConfig.remote) {
    agent = new AgentProtocolClient(agentConfig);
  } else if (agentConfig.cli?.command) {
    agent = new CliClientAgent(agentConfig as AgentConfig & { cli: { command: string } });
  } else if (agentConfig.llm_config?.config_list?.length) {
    agent = new OpenAiAgent(agentConfig);
  }

  if (agent) {
    await agent.initialise(installationNotes);
  }

  return agent;
};

const pullGitRepo = async (agentConfig: AgentConfig) => {
  // Configure user.name if it's not already there
  let { repo, branch, remote, baseDir, options } = agentConfig.git!;
  if (options === undefined) {
    options = { config: [] };
  } else {
    options.config = options.config || [];
  }

  const userConfig = options.config!.find((c) => c.startsWith('user.name='));
  if (!userConfig) {
    options.config!.push(`user.name=${agentConfig.name}`);
  }

  const git = new GitClient(baseDir, options);
  return await git.init(repo, !!agentConfig.git?.alwaysPull, branch, remote);
};
