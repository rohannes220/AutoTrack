import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
};

// Fail fast: never sign tokens with a missing secret.
if (!env.jwtSecret && nodeEnv !== 'test') {
  throw new Error('JWT_SECRET is not set');
}
