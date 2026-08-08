import serverless from 'serverless-http';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { createApp } from './app.js';
import { validateProductionConfig } from './shared/config.js';
import type { Request } from 'express';

validateProductionConfig();
const app = createApp();

export const handler = serverless(app, {
    request: (req: Request, event: APIGatewayProxyEventV2) => {
      if (event.body && typeof event.body === 'string') {
        try {
          req.body = JSON.parse(event.body);
        } catch {
          req.body = {};
        }
      }
    },
  });