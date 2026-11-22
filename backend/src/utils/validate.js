import { AppError } from './AppError.js';
import { FIRST_MODEL_YEAR, US_STATE_CODES } from './usStates.js';

// Returns only the named fields, each guaranteed to be a non-empty string.
// Objects such as { $ne: null } are rejected here, before any query is built.
export function requireStrings(body, fields) {
  const source = body !== null && typeof body === 'object' ? body : {};
  const result = {};
  for (const field of fields) {
    const value = source[field];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new AppError(`${field} is required and must be a non-empty string`, 400);
    }
    result[field] = value;
  }
  return result;
}

const OBJECT_ID = /^[0-9a-f]{24}$/i;

// True only for a 24-character hex string, so values like { $ne: null } never reach a query.
export function isObjectIdString(value) {
  return typeof value === 'string' && OBJECT_ID.test(value);
}

function text(field) {
  return (value) => {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new AppError(`${field} is required and must be a non-empty string`, 400);
    }
    return value.trim();
  };
}

// One checker per allowed vehicle field; each returns the normalized value or throws a 400.
const VEHICLE_FIELDS = {
  make: text('make'),
  model: text('model'),
  year: (value) => {
    const latest = new Date().getFullYear() + 1;
    if (!Number.isInteger(value) || value < FIRST_MODEL_YEAR || value > latest) {
      throw new AppError(`year must be an integer from ${FIRST_MODEL_YEAR} to ${latest}`, 400);
    }
    return value;
  },
  color: text('color'),
  state: (value) => {
    const state = text('state')(value).toUpperCase();
    if (!US_STATE_CODES.includes(state)) {
      throw new AppError('state must be a two-letter US state code', 400);
    }
    return state;
  },
  licensePlate: (value) => text('licensePlate')(value).toUpperCase(),
  owner: (value) => {
    if (!isObjectIdString(value)) {
      throw new AppError('owner must be a customer id', 400);
    }
    return value;
  },
};

// Validates and normalizes vehicle input. Unknown keys, including `$` operators, are rejected.
// With `partial`, only the supplied fields are checked, but at least one is required.
export function validateVehicleFields(body, { partial = false } = {}) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be an object', 400);
  }

  const unknown = Object.keys(body).find((key) => !Object.hasOwn(VEHICLE_FIELDS, key));
  if (unknown !== undefined) {
    throw new AppError(`Unknown field: ${unknown}`, 400);
  }

  const result = {};
  for (const [field, check] of Object.entries(VEHICLE_FIELDS)) {
    if (partial && !Object.hasOwn(body, field)) continue;
    result[field] = check(body[field]);
  }

  if (Object.keys(result).length === 0) {
    throw new AppError('At least one vehicle field is required', 400);
  }
  return result;
}
