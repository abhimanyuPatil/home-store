import { badRequest } from './errors.js';

export const SUPPORTED_UNITS = ['g', 'kg', 'l', 'pack', 'bottle'] as const;
export type SupplyUnit = (typeof SUPPORTED_UNITS)[number];

const quantityPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export const requiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw badRequest(`${field} must be a non-empty string.`);
  }

  return value;
};

export const optionalString = (
  value: unknown,
  field: string,
): string | undefined => {
  if (value === undefined) return undefined;
  return requiredString(value, field);
};

export const parseUnit = (value: unknown): SupplyUnit => {
  if (
    typeof value !== 'string' ||
    !SUPPORTED_UNITS.includes(value as SupplyUnit)
  ) {
    throw badRequest('unit must be one of g, kg, l, pack, or bottle.');
  }

  return value as SupplyUnit;
};

export const parseQuantity = (value: unknown): string => {
  const quantity = typeof value === 'number' ? String(value) : value;

  if (typeof quantity !== 'string' || !quantityPattern.test(quantity)) {
    throw badRequest('quantity must be a non-negative decimal.');
  }

  return quantity;
};

export const parseUuid = (value: unknown, field: string): string => {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw badRequest(`${field} must be a valid identifier.`);
  }

  return value;
};
