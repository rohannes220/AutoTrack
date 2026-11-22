import mongoose from 'mongoose';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb.js';

// Guards the test setup itself: tests must run with the same operator-injection
// protection as the real server, or injection tests prove nothing.
// Mixed type so schema casting can't reject the filter; only sanitizeFilter is under test.
const Probe = mongoose.model(
  'SanitizeProbe',
  new mongoose.Schema({ name: mongoose.Schema.Types.Mixed }),
);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('test database connection', () => {
  it('neutralizes $-operators in query filters (sanitizeFilter is on)', async () => {
    await Probe.create({ name: 'secret' });

    const found = await Probe.findOne({ name: { $ne: null } });

    expect(found).toBeNull();
  });
});
