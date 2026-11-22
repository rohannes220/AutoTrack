import mongoose from 'mongoose';
import * as vehicleService from '../../src/services/vehicleService.js';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb.js';
import { createCustomer, createVehicle } from '../helpers/fixtures.js';

const UNKNOWN_ID = '64b7f0c2a1b2c3d4e5f60718';

let customer;

function input(overrides = {}) {
  return {
    make: 'Ford',
    model: 'F-150',
    year: 2015,
    color: 'White',
    state: 'ny',
    licensePlate: 'trk 501',
    owner: customer._id.toString(),
    ...overrides,
  };
}

beforeAll(async () => {
  await connectTestDb();
  await mongoose.syncIndexes();
});
beforeEach(async () => {
  customer = await createCustomer();
});
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('vehicleService.createVehicle', () => {
  it('stores the vehicle with an uppercase state and plate', async () => {
    const vehicle = await vehicleService.createVehicle(input());

    expect(vehicle.id).toEqual(expect.any(String));
    expect(vehicle.state).toBe('NY');
    expect(vehicle.licensePlate).toBe('TRK 501');
    expect(String(vehicle.owner)).toBe(customer._id.toString());

    const stored = await mongoose.connection
      .collection('vehicles')
      .findOne({ _id: new mongoose.Types.ObjectId(vehicle.id) });
    expect(stored).toMatchObject({ make: 'Ford', state: 'NY', licensePlate: 'TRK 501' });
  });

  it('accepts next year as a model year', async () => {
    const nextYear = new Date().getFullYear() + 1;

    const vehicle = await vehicleService.createVehicle(input({ year: nextYear }));

    expect(vehicle.year).toBe(nextYear);
  });

  it('rejects a duplicate state + plate with a 409', async () => {
    await createVehicle(customer, { state: 'NY', licensePlate: 'TRK 501' });

    await expect(vehicleService.createVehicle(input())).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('rejects an owner that is not an existing customer with a 400', async () => {
    await expect(vehicleService.createVehicle(input({ owner: UNKNOWN_ID }))).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects a missing field with a 400 naming the field', async () => {
    const rest = input();
    delete rest.model;

    await expect(vehicleService.createVehicle(rest)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('model'),
    });
  });

  it('rejects input that is not an object with a 400', async () => {
    await expect(vehicleService.createVehicle(null)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('vehicleService.listVehicles', () => {
  it('returns all vehicles', async () => {
    await createVehicle(customer, { licensePlate: 'ONE111' });
    await createVehicle(customer, { licensePlate: 'TWO222' });

    const vehicles = await vehicleService.listVehicles();

    expect(vehicles.map((v) => v.licensePlate).sort()).toEqual(['ONE111', 'TWO222']);
  });
});

describe('vehicleService.updateVehicle', () => {
  it('applies a partial update and normalizes the plate', async () => {
    const existing = await createVehicle(customer);

    const vehicle = await vehicleService.updateVehicle(existing._id.toString(), {
      year: 2019,
      licensePlate: 'upd 77',
    });

    expect(vehicle.year).toBe(2019);
    expect(vehicle.licensePlate).toBe('UPD 77');
    expect(vehicle.make).toBe(existing.make);
  });

  it('rejects an unknown vehicle id with a 404', async () => {
    await expect(
      vehicleService.updateVehicle(UNKNOWN_ID, { color: 'Green' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects a malformed vehicle id with a 400', async () => {
    await expect(vehicleService.updateVehicle('nope', { color: 'Green' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects an empty update with a 400', async () => {
    const existing = await createVehicle(customer);

    await expect(vehicleService.updateVehicle(existing._id.toString(), {})).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects a change that duplicates a plate in the same state with a 409', async () => {
    await createVehicle(customer, { state: 'MA', licensePlate: 'TAKEN1' });
    const existing = await createVehicle(customer, { state: 'MA', licensePlate: 'FREE22' });

    await expect(
      vehicleService.updateVehicle(existing._id.toString(), { licensePlate: 'TAKEN1' }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
