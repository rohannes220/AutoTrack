import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb.js';
import {
  createCustomer,
  createMechanic,
  customerCredentials,
  mechanicCredentials,
} from '../helpers/fixtures.js';

const LOGIN_PATH = '/api/auth/customer/login';
const INVALID_CREDENTIALS_BODY = { error: { message: 'Invalid email or password' } };

let app;

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('POST /api/auth/customer/login', () => {
  it('returns 200 with a token and customer profile for valid credentials', async () => {
    const customer = await createCustomer();

    const res = await request(app).post(LOGIN_PATH).send(customerCredentials);

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.customer).toEqual({ id: customer._id.toString(), name: customer.name });
  });

  it('never exposes the password hash', async () => {
    const customer = await createCustomer();

    const res = await request(app).post(LOGIN_PATH).send(customerCredentials);

    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain(customer.passwordHash);
  });

  it('returns 401 and no token for a wrong password', async () => {
    await createCustomer();

    const res = await request(app)
      .post(LOGIN_PATH)
      .send({ email: customerCredentials.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(INVALID_CREDENTIALS_BODY);
  });

  it('returns the same 401 for an unknown email', async () => {
    await createCustomer();

    const res = await request(app)
      .post(LOGIN_PATH)
      .send({ email: 'nobody@example.test', password: customerCredentials.password });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(INVALID_CREDENTIALS_BODY);
  });

  it("returns the same 401 for a mechanic's credentials (roles are separate)", async () => {
    await createMechanic();

    const res = await request(app).post(LOGIN_PATH).send(mechanicCredentials);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(INVALID_CREDENTIALS_BODY);
  });

  it("does not let a customer's credentials log in on the mechanic endpoint", async () => {
    await createCustomer();

    const res = await request(app).post('/api/auth/mechanic/login').send(customerCredentials);

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it.each([
    ['missing email', { password: 'whatever' }],
    ['missing password', { email: customerCredentials.email }],
    ['empty body', {}],
    ['non-string password', { email: customerCredentials.email, password: 12345 }],
  ])('returns 400 for %s', async (_label, body) => {
    const res = await request(app).post(LOGIN_PATH).send(body);

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects a MongoDB operator in the email field with 400', async () => {
    await createCustomer();

    const res = await request(app)
      .post(LOGIN_PATH)
      .send({ email: { $ne: null }, password: customerCredentials.password });

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });
});
