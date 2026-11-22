import mongoose from 'mongoose';

// Strip `$`-prefixed keys from query filters to block operator injection.
mongoose.set('sanitizeFilter', true);

export async function connectDb(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  await mongoose.connect(uri);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
