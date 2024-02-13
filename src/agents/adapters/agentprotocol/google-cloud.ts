import functions from '@google-cloud/functions-framework';
import { createServerless } from './agentprotocol';

const app = createServerless({
  // artifactStorage: new GcpStorage(storage, "my-agent-artifacts")
});
// functions.http('agentprotocol', app);
