import { createServer } from 'node:http';

import { createApp } from './app.js';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const app = createApp();
const server = createServer(app);

server.listen(port, () => {
  console.info(`Home Store API listening on port ${port}`);
});

const shutdown = (signal: 'SIGINT' | 'SIGTERM') => {
  console.info(`Received ${signal}; shutting down`);

  server.close((error) => {
    if (error) {
      console.error('Failed to close the HTTP server cleanly', error);
      process.exitCode = 1;
    }
  });
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
