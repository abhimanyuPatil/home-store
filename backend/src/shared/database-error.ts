import { AppError, badRequest, conflict } from './errors.js';

type DatabaseError = { code?: string; constraint?: string };

export const mapDatabaseError = (error: unknown): AppError | undefined => {
  const databaseError = error as DatabaseError;
  if (databaseError.code === '23505') {
    if (databaseError.constraint === 'supplies_name_key') {
      return conflict('A supply with this name already exists.');
    }
    return conflict('The requested resource conflicts with existing data.');
  }
  if (databaseError.code === '23503') {
    return badRequest(
      'A referenced location or subsection does not exist or does not belong together.',
    );
  }
  if (databaseError.code === '23514') {
    return badRequest('A supplied value violates a product rule.');
  }
  return undefined;
};
