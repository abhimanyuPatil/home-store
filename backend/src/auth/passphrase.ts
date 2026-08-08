import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const hashPassphrase = (passphrase: string): string => {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(passphrase, salt, 64);
  return `scrypt$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
};

export const verifyPassphrase = (passphrase: string): boolean => {
  const configuredHash = process.env.HOUSEHOLD_PASSPHRASE_HASH;
  const plainPassphrase = process.env.HOUSEHOLD_PASSPHRASE;
  if (plainPassphrase) {
    const actual = Buffer.from(passphrase);
    const expected = Buffer.from(plainPassphrase);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
  if (!configuredHash) return false;

  const [, saltText, hashText] = configuredHash.split('$');
  if (!saltText || !hashText) return false;
  const derivedKey = scryptSync(
    passphrase,
    Buffer.from(saltText, 'base64url'),
    64,
  );
  const expected = Buffer.from(hashText, 'base64url');
  return (
    expected.length === derivedKey.length &&
    timingSafeEqual(derivedKey, expected)
  );
};
