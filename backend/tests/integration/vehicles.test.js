import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb.js';
import { authHeader, createCustomer, createMechanic, createVehicle } from '../helpers/fixtures.js';

const VEHICLES_PATH = '/api/vehicles';
const UNKNOWN_ID = '64b7f0c2a1b2c3d4e5f60718';

let app;
let mechanic;
let customer;

function validBody(overrides = {}) {
  return {
    make: 'Honda',
    model: 'Civic',
    year: 2020,
    color: 'Red',
    state: 'MA',
    licensePlate: '7xyz42',
    owner: customer._id.toString(),
    ...overrides,
  };
}

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
  // Build every registered model's indexes (including the state + plate unique index).
  await mongoose.syncIndexes();
});
beforeEach(async () => {
  mechanic = await createMechanic();
  customer = await createCustomer();
});
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('POST /api/vehicles', () => {
  it('creates a vehicle linked to the owner and returns 201', async () => {
    const res = await request(app).post(VEHICLES_PATH).set(authHeader(mechanic)).send(validBody());

    expect(res.status).toBe(201);
    expect(res.body.vehicle).toMatchObject({
      id: expect.any(String),
      make: 'Honda',
      model: 'Civic',
      year: 2020,
      color: 'Red',
      state: 'MA',
      owner: customer._id.toString(),
    });
  });

  it('normalizes the license plate and state to uppercase', async () => {
    const res = await request(app)
      .post(VEHICLES_PATH)
      .set(authHeader(mechanic))
      .send(validBody({ state: 'ma', licensePlate: ' 7xyz42 ' }));

    expect(res.status).toBe(201);
    expect(res.body.vehicle.state).toBe('MA');
    expect(res.body.vehicle.licensePlate).toBe('7XYZ42');
  });

  it('returns 409 for a plate already registered in the same state', async () => {
    await createVehicle(customer, { state: 'MA', licensePlate: '7XYZ42' });

    const res = await request(app)
      .post(VEHICLES_PATH)
      .set(authHeader(mechanic))
      .send(validBody({ state: 'MA', licensePlate: '7xyz42' }));

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/license plate/i);
  });

  it('allows the same plate in a different state', async () => {
    await createVehicle(customer, { state: 'MA', licensePlate: '7XYZ42' });

    const res = await request(app)
      .post(VEHICLES_PATH)
      .set(authHeader(mechanic))
      .send(validBody({ state: 'NH', licensePlate: '7XYZ42' }));

    expect(res.status).toBe(201);
  });

  it.each([
    ['missing make', { make: undefined }],
    ['empty model', { model: '  ' }],
    ['non-string color', { color: 42 }],
    ['non-integer year', { year: 2020.5 }],
    ['year as a string', { year: '2020' }],
    ['year before 1886', { year: 1885 }],
    ['year more than one year ahead', { year: new Date().getFullYear() + 2 }],
    ['unknown state code', { state: 'ZZ' }],
    ['missing license plate', { licensePlate: undefined }],
    ['malformed owner id', { owner: 'not-an-id' }],
    ['operator object as owner', { owner: { $ne: null } }],
    ['unknown field', { mileage: 12000 }],
    ['$-prefixed key', { $where: '1' }],
  ])('returns 400 for %s', async (_label, overrides) => {
    const res = await request(app)
      .post(VEHICLES_PATH)
      .set(authHeader(mechanic))
      .send(validBody(overrides));

    expect(res.status).toBe(400);
    expect(res.body.error.message).toEqual(expect.any(String));
    expect(await mongoose.connection.collection('vehicles').countDocuments()).toBe(0);
  });

  it('returns 400 when the owner is not an existing customer', async () => {
    const res = await request(app)
      .post(VEHICLES_PATH)
      .set(authHeader(mechanic))
      .send(validBody({ owner: UNKNOWN_ID }));

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/owner/i);
  });

  it('returns 400 when the owner id belongs to a mechanic, not a customer', async () => {
    const res = await request(app)
      .post(VEHICLES_PATH)
      .set(authHeader(mechanic))
      .send(validBody({ owner: mechanic._id.toString() }));

    expect(res.status).toBe(400);
  });
});

describe('GET /api/vehicles', () => {
  it('lists every vehicle for a mechanic', async () => {
    const other = await createCustomer({ email: 'sam.ortiz@example.test', name: 'Sam Ortiz' });
    const first = await createVehicle(customer, { licensePlate: 'AAA111' });
    const second = await createVehicle(other, { licensePlate: 'BBB222' });

    const res = await request(app).get(VEHICLES_PATH).set(authHeader(mechanic));

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(2);
    expect(res.body.vehicles.map((v) => v.id).sort()).toEqual(
      [first._id.toString(), second._id.toString()].sort(),
    );
  });

  it('returns an empty list when there are no vehicles', async () => {
    const res = await request(app).get(VEHICLES_PATH).set(authHeader(mechanic));

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toEqual([]);
  });
});

describe('PATCH /api/vehicles/:vehicleId', () => {
  it('updates the given fields and leaves the rest unchanged', async () => {
    const vehicle = await createVehicle(customer);

    const res = await request(app)
      .patch(`${VEHICLES_PATH}/${vehicle._id}`)
      .set(authHeader(mechanic))
      .send({ color: 'Black', licensePlate: 'new999' });

    expect(res.status).toBe(200);
    expect(res.body.vehicle).toMatchObject({
      id: vehicle._id.toString(),
      color: 'Black',
      licensePlate: 'NEW999',
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      state: vehicle.state,
    });
  });

  it('re-links the vehicle to another customer', async () => {
    const vehicle = await createVehicle(customer);
    const other = await createCustomer({ email: 'sam.ortiz@example.test', name: 'Sam Ortiz' });

    const res = await request(app)
      .patch(`${VEHICLES_PATH}/${vehicle._id}`)
      .set(authHeader(mechanic))
      .send({ owner: other._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.vehicle.owner).toBe(other._id.toString());
  });

  it('returns 409 when the change would duplicate a plate in the same state', async () => {
    await createVehicle(customer, { state: 'MA', licensePlate: 'TAKEN1' });
    const vehicle = await createVehicle(customer, { state: 'MA', licensePlate: 'FREE22' });

    const res = await request(app)
      .patch(`${VEHICLES_PATH}/${vehicle._id}`)
      .set(authHeader(mechanic))
      .send({ licensePlate: 'taken1' });

    expect(res.status).toBe(409);
  });

  it.each([
    ['an empty body', {}],
    ['an unknown field', { mileage: 12000 }],
    ['a $-prefixed key', { $set: { color: 'Green' } }],
    ['an invalid year', { year: 1700 }],
    ['an unknown state code', { state: 'XX' }],
    ['an unknown owner', { owner: UNKNOWN_ID }],
  ])('returns 400 for %s', async (_label, body) => {
    const vehicle = await createVehicle(customer);

    const res = await request(app)
      .patch(`${VEHICLES_PATH}/${vehicle._id}`)
      .set(authHeader(mechanic))
      .send(body);

    expect(res.status).toBe(400);
    const stored = await mongoose.connection.collection('vehicles').findOne({ _id: vehicle._id });
    expect(stored).toEqual(vehicle);
  });

  it('returns 404 for an unknown vehicle id', async () => {
    const res = await request(app)
      .patch(`${VEHICLES_PATH}/${UNKNOWN_ID}`)
      .set(authHeader(mechanic))
      .send({ color: 'Black' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Vehicle not found' } });
  });

  it('returns 400 for a malformed vehicle id', async () => {
    const res = await request(app)
      .patch(`${VEHICLES_PATH}/not-an-id`)
      .set(authHeader(mechanic))
      .send({ color: 'Black' });

    expect(res.status).toBe(400);
  });
});

describe('vehicle routes authorization', () => {
  const routes = [
    ['POST', (r) => r.post(VEHICLES_PATH)],
    ['GET', (r) => r.get(VEHICLES_PATH)],
    ['PATCH', (r) => r.patch(`${VEHICLES_PATH}/${UNKNOWN_ID}`)],
  ];

  it.each(routes)('%s returns 401 without a token', async (_method, send) => {
    const res = await send(request(app)).send({});

    expect(res.status).toBe(401);
  });

  it.each(routes)('%s returns 403 for a customer token', async (_method, send) => {
    const res = await send(request(app)).set(authHeader(customer)).send({});

    expect(res.status).toBe(403);
  });

  it('does not let a customer create a vehicle', async () => {
    await request(app).post(VEHICLES_PATH).set(authHeader(customer)).send(validBody());

    expect(await mongoose.connection.collection('vehicles').countDocuments()).toBe(0);
  });
});
