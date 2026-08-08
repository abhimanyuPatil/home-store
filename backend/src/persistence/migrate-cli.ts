import { closePool } from './database.js';
import { migrate } from './migrations.js';

try {
  await migrate();
  console.info('Database migrations applied.');
} finally {
  await closePool();
}
