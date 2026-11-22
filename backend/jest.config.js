export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/helpers/setupEnv.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  // Each DB suite starts its own in-memory MongoDB; parallel startup can exceed the 5 s default.
  testTimeout: 30000,
};
