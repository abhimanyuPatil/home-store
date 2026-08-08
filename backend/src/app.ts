import { randomUUID } from 'node:crypto';
import express from 'express';

import { authRouter } from './auth/routes.js';
import { requireAuth } from './auth/middleware.js';
import { errorHandler, notFoundHandler } from './shared/errors.js';
import { inventoryRouter } from './inventory/routes.js';
import { storageRouter } from './storage/routes.js';
import { suppliesRouter } from './supplies/routes.js';
import { getRuntimeStatus } from './shared/runtime-status.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use((request, response, next) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    response.setHeader('X-Request-Id', requestId);
    response.on('finish', () => {
      console.info(
        JSON.stringify({
          event: 'http_request',
          requestId,
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    });
    next();
  });
  app.use((request, response, next) => {
    const origin = request.header('origin');
    const allowedOrigins = (
      process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173'
    )
      .split(',')
      .map((value) => value.trim());
    if (origin && allowedOrigins.includes(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
      response.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      );
      response.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS',
      );
    }
    if (request.method === 'OPTIONS') {
      response.status(204).send();
      return;
    }
    next();
  });

  app.use('/api/v1', authRouter);
  app.use('/api/v1', requireAuth, storageRouter);
  app.use('/api/v1', requireAuth, suppliesRouter);
  app.use('/api/v1', requireAuth, inventoryRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const runtimeStatus = getRuntimeStatus();
