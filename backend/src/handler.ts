import serverless from 'serverless-http';

import { createApp } from './app.js';
import { validateProductionConfig } from './shared/config.js';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

validateProductionConfig();
const app = createApp();

export const handler = (event: APIGatewayProxyEvent, context: Context) => {
  console.info(
    JSON.stringify({
      event: 'lambda_raw',
      isBase64Encoded: event.isBase64Encoded,
      bodyType: typeof event.body,
      body: event.body,
      contentType:
        event.headers?.['content-type'] ?? event.headers?.['Content-Type'],
    }),
  );

  return serverless(app)(event, context);
};
