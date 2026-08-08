import serverless from 'serverless-http';

import { createApp } from './app.js';
import { validateProductionConfig } from './shared/config.js';

validateProductionConfig();
const app = createApp();

export const handler = serverless(app);
