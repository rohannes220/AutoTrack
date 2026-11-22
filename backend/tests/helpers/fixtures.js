import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

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
