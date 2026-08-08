import serverless from 'serverless-http';

import { createApp } from './app.js';
import { validateProductionConfig } from './shared/config.js';

validateProductionConfig();
const app = createApp();

export const handler = (event: any, context: any) => {
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
