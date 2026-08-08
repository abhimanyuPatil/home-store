import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';

const originalEnvironment = {
  jwtSecret: process.env.JWT_SECRET,
  pin: process.env.HOUSEHOLD_PIN,
};

describe('session API', () => {
  afterEach(() => {
    process.env.JWT_SECRET = originalEnvironment.jwtSecret;
    process.env.HOUSEHOLD_PIN = originalEnvironment.pin;
  });

  it('issues a one-day session for the configured PIN', async () => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
    process.env.HOUSEHOLD_PIN = '1234';

    const response = await request(createApp())
      .post('/api/v1/session')
      .send({ pin: '1234' });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.expiresAt).toEqual(expect.any(String));
  });

  it('rejects an incorrect PIN without exposing configuration', async () => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
    process.env.HOUSEHOLD_PIN = '1234';

    const response = await request(createApp())
      .post('/api/v1/session')
      .send({ pin: '9999' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'The PIN is invalid.',
        details: {},
      },
    });
  });

  it('protects application resources with a bearer token', async () => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
    process.env.HOUSEHOLD_PIN = '1234';

    const response = await request(createApp()).get('/api/v1/locations');

    expect(response.status).toBe(401);
  });
});
