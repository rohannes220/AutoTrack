import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { signAccessToken } from '../../src/utils/jwt.js';

// Low cost factor keeps tests fast; production cost is set in the service.
const TEST_BCRYPT_ROUNDS = 4;

export const mechanicCredentials = {
  email: 'alex.rivera@autotrack.test',
  password: 'correct-horse-battery',
};

// Inserts directly into the collection so fixtures don't depend on the model under test.
export async function createMechanic(overrides = {}) {
  const { password = mechanicCredentials.password, ...fields } = overrides;
  const doc = {
    name: 'Alex Rivera',
    position: 'Lead Technician',
    email: mechanicCredentials.email,
    passwordHash: await bcrypt.hash(password, TEST_BCRYPT_ROUNDS),
    role: 'mechanic',
    assignedRepairs: [],
    ...fields,
  };
  const { insertedId } = await mongoose.connection.collection('mechanics').insertOne(doc);
  return { ...doc, _id: insertedId };
}

export const customerCredentials = {
  email: 'jordan.lee@example.test',
  password: 'temporary-pass-123',
};

// Inserts a customer account as if a mechanic had created it with a temporary password.
export async function createCustomer(overrides = {}) {
  const { password = customerCredentials.password, ...fields } = overrides;
  const doc = {
    name: 'Jordan Lee',
    email: customerCredentials.email,
    phone: '555-0100',
    passwordHash: await bcrypt.hash(password, TEST_BCRYPT_ROUNDS),
    role: 'customer',
    ...fields,
  };
  const { insertedId } = await mongoose.connection.collection('customers').insertOne(doc);
  return { ...doc, _id: insertedId };
}

// Inserts a vehicle owned by `owner` (a customer document or id).
export async function createVehicle(owner, overrides = {}) {
  const doc = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2018,
    color: 'Blue',
    state: 'MA',
    licensePlate: 'ABC123',
    owner: owner._id ?? owner,
    ...overrides,
  };
  const { insertedId } = await mongoose.connection.collection('vehicles').insertOne(doc);
  return { ...doc, _id: insertedId };
}

// Authorization header for a fixture user (mechanic or customer document).
export function authHeader(user) {
  const token = signAccessToken({ sub: user._id.toString(), role: user.role });
  return { Authorization: `Bearer ${token}` };
}
