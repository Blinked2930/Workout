// Import test environment setup
import { setupTestEnvironment } from './test/test-environment';
import { beforeAll, afterEach } from 'vitest';

// Set up the test environment before all tests
beforeAll(() => {
  setupTestEnvironment();
});

// Clean up after each test
afterEach(async () => {
  // Clean up any remaining database connections
  if (globalThis.indexedDB?.databases) {
    try {
      const databases = await globalThis.indexedDB.databases();
      for (const { name } of databases) {
        if (name) {
          await new Promise((resolve, reject) => {
            const request = globalThis.indexedDB.deleteDatabase(name);
            request.onsuccess = resolve;
            request.onerror = reject;
          });
        }
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
});
