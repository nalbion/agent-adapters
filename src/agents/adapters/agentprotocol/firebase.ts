import { onRequest } from 'firebase-functions/v2/https';
import { createServerless } from './agentprotocol';

const app = createServerless({
  // artifactStorage: new FirebaseStorage(storage),
});
// export const agentprotocol = onRequest(app);
