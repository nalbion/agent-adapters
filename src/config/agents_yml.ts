import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';
import * as os from 'os';
import { AgentsYml } from '../types';
import { findFile } from '../utils/fileUtils';
import agentsSchema from '../../schemas/agents.yml.json';
import { parseYmlWithSchema } from '../utils/parseYmlWithSchema';
import { logger } from '../utils';

export const defaultAgentYmlPath = 'examples/default/agents.yml';

const initialiseAgentsYml = async (): Promise<AgentsYml> => {
  let agentsConfig: AgentsYml;

  try {
    agentsConfig = await loadAgentsYml();
  } catch (err) {
    logger.error('err:', err);
    handleAgentsYmlError(err);

    // agents.yml not found, create default config with a single agent
    agentsConfig = await createDefaultConfig(path.join(os.homedir(), 'agents.yml'));
  }

  return agentsConfig;
};

/**
 * Searches for the agents.yml file in the current directory, the home directory, and `~/.agents/`.
 * @returns The path to the found file. eg: 'agents.yml', '~/.agents/agents.yml'
 */
export const getAgentsYmlPath = async (): Promise<string> => {
  return findFile('agents', ['.yml', '.yaml']);
};

const loadAgentsYml = async (): Promise<AgentsYml> => {
  // Attempt to load the agents.yml file
  const configPath = await getAgentsYmlPath();
  const configFileContents = await fs.readFile(configPath, 'utf8');
  const config = parseYmlWithSchema<AgentsYml>(configPath, configFileContents, agentsSchema);

  return config;
};

const handleAgentsYmlError = (err: any) => {
  if (Array.isArray(err)) {
    logger.info(`Could not find agents.yml in
- ${(err as string[]).join('\n  - ')}`);
  } else if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
    logger.error('Error reading the configuration file:', err);
    throw err;
  }
};

export async function createDefaultConfig(configPath: string): Promise<AgentsYml> {
  const fileContents = await fs.readFile(defaultAgentYmlPath, 'utf8');
  const defaultConfig = yaml.load(fileContents) as AgentsYml;

  await fs.writeFile(configPath, fileContents, 'utf8');

  logger.log('Created default configuration file:', defaultConfig);
  return defaultConfig;
}

export default initialiseAgentsYml;
