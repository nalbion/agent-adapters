import awsServerlessExpress from 'aws-serverless-express';
import { createServerless } from './agentprotocol';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { useAnyCloudStorage } from '../../../utils/fileStorage';

const promisedStorage = useAnyCloudStorage({ type: 's3', bucket: 'my-bucket' });

const app = createServerless(
  {
    // artifactStorage: new AnyCloudArtifactStorage(storage),
  },
  promisedStorage,
);
// const server = awsServerlessExpress.createServer(app);

// exports.handler = (event: APIGatewayProxyEvent, context: Context) => {
//   awsServerlessExpress.proxy(server, event, context);
// };
