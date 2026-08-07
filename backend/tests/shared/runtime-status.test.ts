import { describe, expect, it } from 'vitest';

import { getRuntimeStatus } from '../../src/shared/runtime-status.js';

describe('getRuntimeStatus', () => {
  it('returns the API runtime readiness status', () => {
    expect(getRuntimeStatus()).toEqual({
      service: 'home-store-api',
      status: 'ready',
    });
  });
});
