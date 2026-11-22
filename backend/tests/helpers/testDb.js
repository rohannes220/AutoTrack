import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
// Connect through the app's db module so tests get the same mongoose settings
// (including sanitizeFilter) as the real server.
import { connectDb, disconnectDb } from '../../src/config/db.js';

let mongod;

export async function connectTestDb() {
  mongod = await MongoMemoryServer.create();
  await connectDb(mongod.getUri());
}

export async function clearTestDb() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function closeTestDb() {
  await disconnectDb();
  await mongod?.stop();
}
