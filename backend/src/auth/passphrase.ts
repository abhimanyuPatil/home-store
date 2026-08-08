import { timingSafeEqual } from 'node:crypto';

export const verifyPin = (pin: string): boolean => {
  const configuredPin = process.env.HOUSEHOLD_PIN;
  if (!configuredPin || !/^\d{4}$/.test(configuredPin)) return false;
  if (!/^\d{4}$/.test(pin)) return false;
  console.log('configuredPin', configuredPin);
  console.log('actual', pin);
  const actual = Buffer.from(pin);
  const expected = Buffer.from(configuredPin);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
