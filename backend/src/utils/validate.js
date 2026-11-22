import { AppError } from './AppError.js';

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
