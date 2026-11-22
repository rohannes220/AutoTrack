import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb.js';
import { createMechanic, mechanicCredentials } from '../helpers/fixtures.js';

const LOGIN_PATH = '/api/auth/mechanic/login';
const INVALID_CREDENTIALS_BODY = { error: { message: 'Invalid email or password' } };

let app;

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('POST /api/auth/mechanic/login', () => {
  it('returns 200 with a token and mechanic profile for valid credentials', async () => {
    const mechanic = await createMechanic();

    const res = await request(app).post(LOGIN_PATH).send(mechanicCredentials);

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.mechanic).toEqual({
      id: mechanic._id.toString(),
      name: mechanic.name,
      position: mechanic.position,
    });
  });

  it('never exposes the password hash', async () => {
    const mechanic = await createMechanic();

    const res = await request(app).post(LOGIN_PATH).send(mechanicCredentials);

    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain(mechanic.passwordHash);
  });

  it('returns 401 and no token for a wrong password', async () => {
    await createMechanic();

    const res = await request(app)
      .post(LOGIN_PATH)
      .send({ email: mechanicCredentials.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(INVALID_CREDENTIALS_BODY);
  });

  it('returns the same 401 for an unknown email', async () => {
    await createMechanic();

    const res = await request(app)
      .post(LOGIN_PATH)
      .send({ email: 'nobody@autotrack.test', password: mechanicCredentials.password });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(INVALID_CREDENTIALS_BODY);
  });

  it.each([
    ['missing email', { password: 'whatever' }],
    ['missing password', { email: mechanicCredentials.email }],
    ['empty body', {}],
    ['non-string password', { email: mechanicCredentials.email, password: 12345 }],
  ])('returns 400 for %s', async (_label, body) => {
    const res = await request(app).post(LOGIN_PATH).send(body);

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects a MongoDB operator in the email field with 400', async () => {
    await createMechanic();

    const res = await request(app)
      .post(LOGIN_PATH)
      .send({ email: { $ne: null }, password: mechanicCredentials.password });

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });
});
