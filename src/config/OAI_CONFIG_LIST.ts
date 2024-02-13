import * as fs from 'fs/promises';
import { ModelConfig } from '../types';
import { findFile } from '../utils/fileUtils';

export const OAI_CONFIG_LIST = 'OAI_CONFIG_LIST';

const readOaiConfigList = async (name = OAI_CONFIG_LIST): Promise<ModelConfig[]> => {
  let configList = process.env[name];
  if (!configList) {
    try {
      const oaiConfigList = await findFile(name, ['', '.json']);

      configList = await fs.readFile(oaiConfigList, 'utf8');
    } catch (paths) {
      throw new Error(`Could not find LLM config list in environment variables or in
  - ${(paths as string[]).join('\n  - ')}`);
    }
  }

  return JSON.parse(configList) as ModelConfig[];
};

/**
 * Get the path to the OAI config list file.
 * @param name The name of the file to search for.
 * @returns The path to the found file. eg: 'OAI_CONFIG_LIST.json', '~/.agents/OAI_CONFIG_LIST.json'
 */
export const getOaiConfigListPath = async (name = OAI_CONFIG_LIST): Promise<string> => {
  return findFile(name, ['', '.json']);
};

export default readOaiConfigList;
