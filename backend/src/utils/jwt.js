import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Signs an access token for an authenticated user. `sub` is the user's id.
export function signAccessToken({ sub, role }) {
  return jwt.sign({ role }, env.jwtSecret, {
    subject: sub,
    expiresIn: env.jwtExpiresIn,
  });
}
