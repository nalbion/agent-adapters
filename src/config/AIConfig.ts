import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentConfig, AgentsYml } from '../types';
import { findFilesBySuffix } from '../utils/fileUtils';
import { getAgentsYmlPath } from './agents_yml';

/**
 * Search for AIConfig files (ending with `aiconfig.json`) in the CWD and the agentsConfig directory.
 * @see https://aiconfig.lastmileai.dev/docs/overview/ai-config-format
 */
const readAiConfigFiles = async (agentsConfig: AgentsYml) => {
  const configPath = await getAgentsYmlPath();
  const configDir = path.dirname(configPath);
  const files = await findFilesBySuffix(configDir, 'aiconfig.json');
  files.map(async (file) => {
    try {
      const aiConfig = await readAiConfig(file);
      console.info('Loaded AIConfig agent from', file);
      agentsConfig.agents.push(aiConfig);
    } catch (err) {
      console.error(`Error reading AIConfig file "${file}:`, err);
    }
  });
};

/** @see https://aiconfig.lastmileai.dev/docs/overview/ai-config-format */
const readAiConfig = async (path: string): Promise<AgentConfig> => {
  const contents = await fs.readFile(path, 'utf8');
  return JSON.parse(contents) as AgentConfig;
};

export default readAiConfigFiles;
