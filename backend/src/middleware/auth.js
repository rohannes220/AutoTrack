import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

const BEARER = /^Bearer (\S+)$/i;

// Verifies the Bearer JWT and sets req.user = { id, role }. Any failure is a 401.
export function requireAuth(req, res, next) {
  const match = BEARER.exec(req.headers.authorization ?? '');
  if (!match) {
    return next(new AppError('Authentication required', 401));
  }

  let payload;
  try {
    payload = verifyAccessToken(match[1]);
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }

  const { sub, role } = payload;
  if (typeof sub !== 'string' || sub === '' || typeof role !== 'string' || role === '') {
    return next(new AppError('Invalid or expired token', 401));
  }

  req.user = { id: sub, role };
  return next();
}

// Allows only users whose role is one of `roles`. Use after requireAuth.
// No authenticated user is a 401; an authenticated user with the wrong role is a 403.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }
    return next();
  };
}
