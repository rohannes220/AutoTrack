import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb.js';
import { authHeader, createCustomer, createMechanic, createVehicle } from '../helpers/fixtures.js';

const ME_VEHICLES_PATH = '/api/me/vehicles';
const UNKNOWN_ID = '64b7f0c2a1b2c3d4e5f60718';
const NOT_FOUND_BODY = { error: { message: 'Vehicle not found' } };

let app;
let mechanic;
let jordan;
let sam;
let jordanSedan;
let jordanTruck;
let samCoupe;

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
beforeEach(async () => {
  mechanic = await createMechanic();
  jordan = await createCustomer();
  sam = await createCustomer({ name: 'Sam Patel', email: 'sam.patel@example.test' });
  jordanSedan = await createVehicle(jordan, { licensePlate: 'JRD100' });
  jordanTruck = await createVehicle(jordan, {
    make: 'Ford',
    model: 'F-150',
    licensePlate: 'JRD200',
  });
  samCoupe = await createVehicle(sam, { make: 'Mazda', model: 'MX-5', licensePlate: 'SAM300' });
});
afterEach(clearTestDb);
afterAll(closeTestDb);

function idsOf(vehicles) {
  return vehicles.map((vehicle) => vehicle.id).sort();
}

describe('GET /api/me/vehicles', () => {
  it("returns only the authenticated customer's vehicles", async () => {
    const res = await request(app).get(ME_VEHICLES_PATH).set(authHeader(jordan));

    expect(res.status).toBe(200);
    expect(idsOf(res.body.vehicles)).toEqual(
      [jordanSedan._id.toString(), jordanTruck._id.toString()].sort(),
    );
    for (const vehicle of res.body.vehicles) {
      expect(vehicle.owner).toBe(jordan._id.toString());
    }
  });

  it('ignores an owner query parameter naming another customer', async () => {
    const res = await request(app)
      .get(ME_VEHICLES_PATH)
      .query({ owner: sam._id.toString() })
      .set(authHeader(jordan));

    expect(res.status).toBe(200);
    expect(idsOf(res.body.vehicles)).toEqual(
      [jordanSedan._id.toString(), jordanTruck._id.toString()].sort(),
    );
    expect(JSON.stringify(res.body)).not.toContain('SAM300');
  });

  it('returns an empty list for a customer with no vehicles', async () => {
    const riley = await createCustomer({ name: 'Riley Chen', email: 'riley.chen@example.test' });

    const res = await request(app).get(ME_VEHICLES_PATH).set(authHeader(riley));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ vehicles: [] });
  });
});

describe('GET /api/me/vehicles/:vehicleId', () => {
  it("returns the customer's own vehicle", async () => {
    const res = await request(app)
      .get(`${ME_VEHICLES_PATH}/${jordanTruck._id}`)
      .set(authHeader(jordan));

    expect(res.status).toBe(200);
    expect(res.body.vehicle).toMatchObject({
      id: jordanTruck._id.toString(),
      make: 'Ford',
      model: 'F-150',
      licensePlate: 'JRD200',
      owner: jordan._id.toString(),
    });
  });

  it("returns 404 with no vehicle data for another customer's vehicle", async () => {
    const res = await request(app)
      .get(`${ME_VEHICLES_PATH}/${samCoupe._id}`)
      .set(authHeader(jordan));

    expect(res.status).toBe(404);
    expect(res.body).toEqual(NOT_FOUND_BODY);
  });

  it('returns 404 for an unknown vehicle id', async () => {
    const res = await request(app).get(`${ME_VEHICLES_PATH}/${UNKNOWN_ID}`).set(authHeader(jordan));

    expect(res.status).toBe(404);
    expect(res.body).toEqual(NOT_FOUND_BODY);
  });

  it('returns 404 for a malformed vehicle id', async () => {
    const res = await request(app).get(`${ME_VEHICLES_PATH}/not-an-id`).set(authHeader(jordan));

    expect(res.status).toBe(404);
    expect(res.body).toEqual(NOT_FOUND_BODY);
  });
});

describe('authorization', () => {
  const paths = () => [ME_VEHICLES_PATH, `${ME_VEHICLES_PATH}/${jordanSedan._id}`];

  it('rejects requests without a token with 401', async () => {
    for (const path of paths()) {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    }
  });

  it('rejects a mechanic token with 403', async () => {
    for (const path of paths()) {
      const res = await request(app).get(path).set(authHeader(mechanic));
      expect(res.status).toBe(403);
    }
  });
});
