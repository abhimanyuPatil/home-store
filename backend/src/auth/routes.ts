import { Router } from 'express';

import { createToken } from './jwt.js';
import { verifyPassphrase } from './passphrase.js';
import { asyncRoute, unauthorized } from '../shared/errors.js';
import { createRateLimiter } from '../shared/rate-limit.js';

export const authRouter = Router();

const windowMs = Number.parseInt(
  process.env.RATE_LIMIT_WINDOW_MS ?? '900000',
  10,
);
const maxAttempts = Number.parseInt(
  process.env.RATE_LIMIT_MAX_ATTEMPTS ?? '10',
  10,
);

authRouter.post(
  '/session',
  createRateLimiter(windowMs, maxAttempts),
  asyncRoute(async (request, response) => {
    const passphrase = request.body?.passphrase;
    if (typeof passphrase !== 'string' || !verifyPassphrase(passphrase)) {
      throw unauthorized('The passphrase is invalid.');
    }

    const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
    response.status(200).json({ token: createToken(), expiresAt });
  }),
);
