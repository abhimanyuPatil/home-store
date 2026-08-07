import express from 'express';

import { getRuntimeStatus } from './shared/runtime-status.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  return app;
};

export const runtimeStatus = getRuntimeStatus();
