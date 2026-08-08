import { createHmac, timingSafeEqual } from 'node:crypto';

import { unauthorized } from '../shared/errors.js';

type JwtPayload = { sub: string; iat: number; exp: number };

const base64Url = (value: string | Buffer) =>
  Buffer.from(value).toString('base64url');

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32)
    throw new Error('JWT_SECRET must be at least 32 characters.');
  return value;
};

const signatureFor = (value: string) =>
  base64Url(createHmac('sha256', secret()).update(value).digest());

export const createToken = (
  subject = 'household',
  lifetimeSeconds = 86_400,
): string => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({ sub: subject, iat: now, exp: now + lifetimeSeconds }),
  );
  const signingInput = `${header}.${payload}`;
  return `${signingInput}.${signatureFor(signingInput)}`;
};

export const verifyToken = (token: string): JwtPayload => {
  const parts = token.split('.');
  if (parts.length !== 3) throw unauthorized('The session token is invalid.');

  const [header, payload, signature] = parts;
  if (!header || !payload || !signature)
    throw unauthorized('The session token is invalid.');
  const expected = signatureFor(`${header}.${payload}`);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw unauthorized('The session token is invalid.');
  }

  try {
    const parsedHeader = JSON.parse(
      Buffer.from(header, 'base64url').toString(),
    ) as { alg?: string; typ?: string };
    const parsedPayload = JSON.parse(
      Buffer.from(payload, 'base64url').toString(),
    ) as JwtPayload;
    if (
      parsedHeader.alg !== 'HS256' ||
      parsedHeader.typ !== 'JWT' ||
      !parsedPayload.sub ||
      parsedPayload.exp <= Math.floor(Date.now() / 1000)
    ) {
      throw new Error('Invalid claims');
    }
    return parsedPayload;
  } catch {
    throw unauthorized('The session token is invalid or expired.');
  }
};
