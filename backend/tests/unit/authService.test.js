import jwt from 'jsonwebtoken';
import { loginMechanic } from '../../src/services/authService.js';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb.js';
import { createMechanic, mechanicCredentials } from '../helpers/fixtures.js';

const INVALID_CREDENTIALS = { statusCode: 401, message: 'Invalid email or password' };

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('authService.loginMechanic', () => {
  it('returns a JWT carrying the mechanic id and mechanic role for valid credentials', async () => {
    const mechanic = await createMechanic();

    const { token } = await loginMechanic(mechanicCredentials);

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    expect(payload.sub).toBe(mechanic._id.toString());
    expect(payload.role).toBe('mechanic');
  });

  it('returns the mechanic profile without the password hash', async () => {
    const mechanic = await createMechanic();

    const result = await loginMechanic(mechanicCredentials);

    expect(result.mechanic).toEqual({
      id: mechanic._id.toString(),
      name: mechanic.name,
      position: mechanic.position,
    });
  });

  it('rejects a wrong password with a 401', async () => {
    await createMechanic();

    await expect(
      loginMechanic({ email: mechanicCredentials.email, password: 'wrong-password' }),
    ).rejects.toMatchObject(INVALID_CREDENTIALS);
  });

  it('rejects an unknown email with the same 401 as a wrong password', async () => {
    await createMechanic();

    await expect(
      loginMechanic({ email: 'nobody@autotrack.test', password: mechanicCredentials.password }),
    ).rejects.toMatchObject(INVALID_CREDENTIALS);
  });
});
