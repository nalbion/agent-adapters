import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';

import { defaultAgentYmlPath } from './agents_yml';
import { AgentsYml } from '../types';
import agentsSchema from '../../schemas/agents.yml.json';
import { parseYmlWithSchema } from '../utils/parseYmlWithSchema';

jest.mock('./parseYmlWithSchema');

describe('readAgentConfig', () => {
  it('should have a valid default agents.yml in the examples fold', async () => {
    // Given the default agents.yml file
    const fileContents = await fs.readFile(defaultAgentYmlPath, 'utf8');
    const defaultConfig = yaml.load(fileContents) as AgentsYml;

    // Then the default config should be valid
    parseYmlWithSchema<AgentsYml>(defaultAgentYmlPath, fileContents, agentsSchema);
  });
});
