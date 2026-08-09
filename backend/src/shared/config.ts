export const validateProductionConfig = (): void => {
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'HOUSEHOLD_PIN',
    'ALLOWED_ORIGINS',
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required production configuration: ${missing.join(', ')}`,
    );
  }
  if (!/^\d{4}$/.test(process.env.HOUSEHOLD_PIN ?? '')) {
    throw new Error('HOUSEHOLD_PIN must contain exactly four digits.');
  }
  if ((process.env.JWT_SECRET ?? '').length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters.');
  }
};
