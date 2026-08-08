import { describe, expect, it } from 'vitest';

import { parseQuantity, parseUnit } from '../../src/shared/validation.js';

describe('quantity validation', () => {
  it.each(['0', '400', '0.5', '12.125'])(
    'accepts non-negative decimal %s',
    (value) => {
      expect(parseQuantity(value)).toBe(value);
    },
  );

  it.each(['-1', '-0.5', '', '1e3', '01', 'NaN'])(
    'rejects invalid quantity %s',
    (value) => {
      expect(() => parseQuantity(value)).toThrow();
    },
  );
});

describe('unit validation', () => {
  it.each(['g', 'kg', 'l', 'pack', 'bottle'])('accepts %s', (unit) => {
    expect(parseUnit(unit)).toBe(unit);
  });

  it('rejects unsupported units', () => {
    expect(() => parseUnit('ml')).toThrow();
  });
});
