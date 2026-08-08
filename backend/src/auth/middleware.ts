import type { RequestHandler } from 'express';

import { verifyToken } from './jwt.js';
import { unauthorized } from '../shared/errors.js';

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorization = request.header('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    next(unauthorized());
    return;
  }

  try {
    verifyToken(authorization.slice('Bearer '.length));
    next();
  } catch (error) {
    next(error);
  }
};
