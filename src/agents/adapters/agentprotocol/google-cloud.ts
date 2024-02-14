import functions from '@google-cloud/functions-framework';
import { createServerless } from './agentprotocol';
import { useAnyCloudStorage } from '../../../utils/fileStorage';

const promisedStorage = useAnyCloudStorage({ type: 'gcp', bucket: 'my-bucket' });

const app = createServerless(
  {
    // artifactStorage: new AnyCloudArtifactStorage(storage)
  },
  promisedStorage,
);
// functions.http('agentprotocol', app);
