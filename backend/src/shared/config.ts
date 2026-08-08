export const validateProductionConfig = (): void => {
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'HOUSEHOLD_PASSPHRASE_HASH',
    'ALLOWED_ORIGINS',
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required production configuration: ${missing.join(', ')}`,
    );
  }
};
