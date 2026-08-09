import serverless from 'serverless-http';

import { createApp } from './app.js';
import { validateProductionConfig } from './shared/config.js';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

validateProductionConfig();
const app = createApp();

const serverlessHandler = serverless(app);

export const handler = (event: APIGatewayProxyEventV2, context: Context) => {
  console.info(JSON.stringify({ event: 'lambda_raw_full', payload: event }));
  return serverlessHandler(event, context);
};
