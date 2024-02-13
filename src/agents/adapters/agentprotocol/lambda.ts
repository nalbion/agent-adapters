import awsServerlessExpress from 'aws-serverless-express';
import { createServerless } from './agentprotocol';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const app = createServerless({
  // artifactStorage: new S3Storage(s3, 'my-agent-artifacts'),
});
// const server = awsServerlessExpress.createServer(app);

// exports.handler = (event: APIGatewayProxyEvent, context: Context) => {
//   awsServerlessExpress.proxy(server, event, context);
// };
