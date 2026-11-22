import { defineConfig } from '@playwright/test';

// E2E tests must run against a test database, never a real one (see CLAUDE.md).
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
});
