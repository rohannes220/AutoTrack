import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Signs an access token for an authenticated user. `sub` is the user's id.
export function signAccessToken({ sub, role }) {
  return jwt.sign({ role }, env.jwtSecret, {
    subject: sub,
    expiresIn: env.jwtExpiresIn,
  });
}

// Verifies an access token and returns its payload. Throws if it is invalid or expired.
// Only HS256 is accepted, which also rules out unsigned ("none") tokens.
export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}
