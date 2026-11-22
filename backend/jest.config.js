export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/helpers/setupEnv.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
};
