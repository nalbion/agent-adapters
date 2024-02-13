import * as fs from 'fs/promises';

import { defaultAgentYmlPath } from './agents_yml';
import { AgentsYml } from '../types';
import { parseYmlWithSchema } from '../utils/parseYmlWithSchema';
import agentsSchema from '../../schemas/agents.yml.json';

jest.mock('../utils/parseYmlWithSchema');

describe('readAgentConfig', () => {
  it('should have a valid default agents.yml in the examples fold', async () => {
    // Given the default agents.yml file
    const fileContents = await fs.readFile(defaultAgentYmlPath, 'utf8');

    // Then the default config should be valid
    parseYmlWithSchema<AgentsYml>(defaultAgentYmlPath, fileContents, agentsSchema);
  });
});
