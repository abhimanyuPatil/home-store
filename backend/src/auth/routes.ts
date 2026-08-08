import { Router } from 'express';

import { createToken } from './jwt.js';
import { verifyPin } from './passphrase.js';
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
    const pin = request.body?.pin;

    console.info(
      JSON.stringify({
        event: 'session_attempt',
        bodyType: typeof request.body,
        body: request.body,
        bodyKeys:
          request.body && typeof request.body === 'object'
            ? Object.keys(request.body)
            : null,
        contentType: request.header('content-type') ?? null,
        pinReceived: typeof pin === 'string',
        pinLength: typeof pin === 'string' ? pin.length : null,
        pinConfigured: Boolean(process.env.HOUSEHOLD_PIN),
      }),
    );
    if (typeof pin !== 'string' || !verifyPin(pin)) {
      throw unauthorized('The PIN is invalid.');
    }

    const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
    response.status(200).json({ token: createToken(), expiresAt });
  }),
);
