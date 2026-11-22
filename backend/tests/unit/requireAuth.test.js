import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../../src/middleware/auth.js';
import { AppError } from '../../src/utils/AppError.js';
import { signAccessToken } from '../../src/utils/jwt.js';

const USER_ID = '64b7f0c2a1b2c3d4e5f60718';
const secret = () => process.env.JWT_SECRET;

// Runs the middleware with a fake request and reports what it passed to next().
async function run(authorization) {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  const res = {};
  const next = jest.fn();
  await requireAuth(req, res, next);
  return { req, next };
}

function expectUnauthorized({ req, next }) {
  expect(next).toHaveBeenCalledTimes(1);
  const [err] = next.mock.calls[0];
  expect(err).toBeInstanceOf(AppError);
  expect(err.statusCode).toBe(401);
  expect(req.user).toBeUndefined();
}

// Builds an unsigned token with alg "none", which must never be accepted.
function unsignedToken(payload) {
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
}

describe('requireAuth middleware', () => {
  it('accepts a valid Bearer token and sets req.user to { id, role }', async () => {
    const token = signAccessToken({ sub: USER_ID, role: 'mechanic' });

    const { req, next } = await run(`Bearer ${token}`);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: USER_ID, role: 'mechanic' });
  });

  it('returns 401 when the Authorization header is missing', async () => {
    expectUnauthorized(await run(undefined));
  });

  it('returns 401 for a non-Bearer scheme', async () => {
    const token = signAccessToken({ sub: USER_ID, role: 'mechanic' });
    expectUnauthorized(await run(`Basic ${token}`));
  });

  it('returns 401 for "Bearer" with no token', async () => {
    expectUnauthorized(await run('Bearer '));
  });

  it('returns 401 for a malformed token', async () => {
    expectUnauthorized(await run('Bearer not-a-jwt'));
  });

  it('returns 401 for a token signed with the wrong secret', async () => {
    const token = jwt.sign({ role: 'mechanic' }, 'some-other-secret', { subject: USER_ID });
    expectUnauthorized(await run(`Bearer ${token}`));
  });

  it('returns 401 for an expired token', async () => {
    const expired = Math.floor(Date.now() / 1000) - 60;
    const token = jwt.sign({ role: 'mechanic', sub: USER_ID, exp: expired }, secret());
    expectUnauthorized(await run(`Bearer ${token}`));
  });

  it('returns 401 for an unsigned (alg "none") token', async () => {
    expectUnauthorized(await run(`Bearer ${unsignedToken({ sub: USER_ID, role: 'mechanic' })}`));
  });

  it('returns 401 for a token signed with an algorithm other than HS256', async () => {
    const token = jwt.sign({ role: 'mechanic' }, secret(), {
      subject: USER_ID,
      algorithm: 'HS512',
    });
    expectUnauthorized(await run(`Bearer ${token}`));
  });

  it('returns 401 for a token without a subject', async () => {
    const token = jwt.sign({ role: 'mechanic' }, secret());
    expectUnauthorized(await run(`Bearer ${token}`));
  });

  it('returns 401 for a token without a role', async () => {
    const token = jwt.sign({}, secret(), { subject: USER_ID });
    expectUnauthorized(await run(`Bearer ${token}`));
  });
});
