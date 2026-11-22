import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function start() {
  await connectDb(env.mongoUri);
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`AutoTrack API listening on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
