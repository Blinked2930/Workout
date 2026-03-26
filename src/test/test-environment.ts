import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import Dexie from 'dexie';

// Mock IndexedDB
(global as any).indexedDB = indexedDB;
(global as any).IDBKeyRange = IDBKeyRange;

// Tell Dexie to use the fake IndexedDB
Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

// Create a function to set up the test environment
export function setupTestEnvironment() {
  // Reset the global state
  (global as any).indexedDB = indexedDB;
  (global as any).IDBKeyRange = IDBKeyRange;
  
  // Reset Dexie dependencies
  Dexie.dependencies.indexedDB = indexedDB;
  Dexie.dependencies.IDBKeyRange = IDBKeyRange;
  
  return {
    indexedDB,
    IDBKeyRange,
  };
}
