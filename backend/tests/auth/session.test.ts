import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';

const originalEnvironment = {
  jwtSecret: process.env.JWT_SECRET,
  passphrase: process.env.HOUSEHOLD_PASSPHRASE,
};

describe('session API', () => {
  afterEach(() => {
    process.env.JWT_SECRET = originalEnvironment.jwtSecret;
    process.env.HOUSEHOLD_PASSPHRASE = originalEnvironment.passphrase;
  });

  it('issues a one-day session for the configured passphrase', async () => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
    process.env.HOUSEHOLD_PASSPHRASE = 'correct-passphrase';

    const response = await request(createApp())
      .post('/api/v1/session')
      .send({ passphrase: 'correct-passphrase' });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.expiresAt).toEqual(expect.any(String));
  });

  it('rejects an incorrect passphrase without exposing configuration', async () => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
    process.env.HOUSEHOLD_PASSPHRASE = 'correct-passphrase';

    const response = await request(createApp())
      .post('/api/v1/session')
      .send({ passphrase: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'The passphrase is invalid.',
        details: {},
      },
    });
  });

  it('protects application resources with a bearer token', async () => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
    process.env.HOUSEHOLD_PASSPHRASE = 'correct-passphrase';

    const response = await request(createApp()).get('/api/v1/locations');

    expect(response.status).toBe(401);
  });
});
