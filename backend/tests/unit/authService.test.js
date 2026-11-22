import jwt from 'jsonwebtoken';
import { loginCustomer, loginMechanic } from '../../src/services/authService.js';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb.js';
import {
  createCustomer,
  createMechanic,
  customerCredentials,
  mechanicCredentials,
} from '../helpers/fixtures.js';

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

describe('authService.loginCustomer', () => {
  it('returns a JWT carrying the customer id and customer role for valid credentials', async () => {
    const customer = await createCustomer();

    const { token } = await loginCustomer(customerCredentials);

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    expect(payload.sub).toBe(customer._id.toString());
    expect(payload.role).toBe('customer');
  });

  it('returns the customer profile without the password hash', async () => {
    const customer = await createCustomer();

    const result = await loginCustomer(customerCredentials);

    expect(result.customer).toEqual({ id: customer._id.toString(), name: customer.name });
  });

  it('matches the email case-insensitively', async () => {
    await createCustomer();

    const { token } = await loginCustomer({
      email: customerCredentials.email.toUpperCase(),
      password: customerCredentials.password,
    });

    expect(typeof token).toBe('string');
  });

  it('rejects a wrong password with a 401', async () => {
    await createCustomer();

    await expect(
      loginCustomer({ email: customerCredentials.email, password: 'wrong-password' }),
    ).rejects.toMatchObject(INVALID_CREDENTIALS);
  });

  it('rejects an unknown email with the same 401 as a wrong password', async () => {
    await createCustomer();

    await expect(
      loginCustomer({ email: 'nobody@example.test', password: customerCredentials.password }),
    ).rejects.toMatchObject(INVALID_CREDENTIALS);
  });

  it("rejects a mechanic's credentials with the same 401", async () => {
    await createMechanic();

    await expect(loginCustomer(mechanicCredentials)).rejects.toMatchObject(INVALID_CREDENTIALS);
  });
});
