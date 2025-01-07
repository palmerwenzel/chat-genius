/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [
      './src/tests/setup/database.ts',
      './src/tests/setup/react.ts'
    ],
    env: loadEnv('test', process.cwd(), ''),
    testTimeout: 15000, // Increased timeout for database operations
  },
}); 