import { jest } from '@jest/globals';
import { requireRole } from '../../src/middleware/auth.js';
import { AppError } from '../../src/utils/AppError.js';

const USER_ID = '64b7f0c2a1b2c3d4e5f60718';

// Runs the guard with a fake request and returns the next() mock.
async function run(guard, user) {
  const req = user === undefined ? {} : { user };
  const next = jest.fn();
  await guard(req, {}, next);
  return next;
}

function expectError(next, statusCode) {
  expect(next).toHaveBeenCalledTimes(1);
  const [err] = next.mock.calls[0];
  expect(err).toBeInstanceOf(AppError);
  expect(err.statusCode).toBe(statusCode);
}

describe('requireRole middleware', () => {
  it('lets a user with the required role through', async () => {
    const next = await run(requireRole('mechanic'), { id: USER_ID, role: 'mechanic' });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 403 for a customer on a mechanic-only route', async () => {
    const next = await run(requireRole('mechanic'), { id: USER_ID, role: 'customer' });

    expectError(next, 403);
  });

  it('returns 403 for a mechanic on a customer-only route', async () => {
    const next = await run(requireRole('customer'), { id: USER_ID, role: 'mechanic' });

    expectError(next, 403);
  });

  it('matches roles exactly, not by case or prefix', async () => {
    expectError(await run(requireRole('mechanic'), { id: USER_ID, role: 'Mechanic' }), 403);
    expectError(await run(requireRole('mechanic'), { id: USER_ID, role: 'mech' }), 403);
  });

  it('returns 401 when there is no authenticated user', async () => {
    const next = await run(requireRole('mechanic'), undefined);

    expectError(next, 401);
  });

  it('accepts any of several allowed roles', async () => {
    const guard = requireRole('mechanic', 'customer');

    const asMechanic = await run(guard, { id: USER_ID, role: 'mechanic' });
    const asCustomer = await run(guard, { id: USER_ID, role: 'customer' });

    expect(asMechanic).toHaveBeenCalledWith();
    expect(asCustomer).toHaveBeenCalledWith();
  });

  it('returns 403 when the role is not in a list of several', async () => {
    const next = await run(requireRole('mechanic', 'admin'), { id: USER_ID, role: 'customer' });

    expectError(next, 403);
  });
});
