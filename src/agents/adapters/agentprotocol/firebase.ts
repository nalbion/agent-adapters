import { type Response } from 'express';
import { Request, onRequest } from 'firebase-functions/v2/https';
import { createServerless } from './agentprotocol';
import { useAnyCloudStorage } from '../../../utils/fileStorage';

const promisedStorage = useAnyCloudStorage({ type: 'firebase', bucket: 'my-bucket' });

const app = createServerless<Request, Response>(
  {
    // artifactStorage: new AnyCloudArtifactStorage(storage),
  },
  promisedStorage,
);
export const agentprotocol = onRequest(app);
