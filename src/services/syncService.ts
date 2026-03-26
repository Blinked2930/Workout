import { db } from './database';
import { auth, db as firestore } from './firebase';
import { doc, getDoc, collection, onSnapshot, Timestamp, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { Table } from 'dexie';

type SyncOperation = 'create' | 'update' | 'delete';

interface SyncChange {
  table: string;
  key: any;
  operation: SyncOperation;
  data?: any;
  timestamp: number;
  source: 'local' | 'remote';
}

// Track if changes are from remote to prevent sync loops
let isProcessingRemoteChange = false;

// Collection names in Firestore
const COLLECTIONS = {
  LIFTS: 'lifts',
  EXERCISES: 'exercises',
  SUBCATEGORIES: 'subcategories',
  MAIN_CATEGORIES: 'mainCategories',
  CARDIO_SESSIONS: 'cardioSessions',
  TIME_GOALS: 'timeGoals',
} as const;

// Convert Firestore timestamp to number
export const firestoreTimestampToNumber = (timestamp: Timestamp | Date | number | null | undefined): number => {
  if (!timestamp) return Date.now();
  if (timestamp instanceof Timestamp) return timestamp.toMillis();
  if (timestamp instanceof Date) return timestamp.getTime();
  return timestamp;
};

// Convert local timestamp to Firestore timestamp
export const toFirestoreTimestamp = (timestamp: number | Date): Timestamp => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Timestamp.fromDate(date);
};

// Format document data for Firestore
const formatForFirestore = (data: any): any => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(formatForFirestore);
  }
  
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip undefined values and internal fields
      if (value === undefined || key.startsWith('_')) continue;
      
      // Convert Date objects to Firestore timestamps
      if (value instanceof Date) {
        result[key] = toFirestoreTimestamp(value);
      } 
      // Handle nested objects and arrays
      else if (value && typeof value === 'object') {
        result[key] = formatForFirestore(value);
      } 
      // Handle primitive values
      else {
        result[key] = value;
      }
    }
    return result;
  }
  
  return data;
};

// Format document data from Firestore
const formatFromFirestore = (data: any): any => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(formatFromFirestore);
  }
  
  if (typeof data === 'object' && data !== null) {
    // Convert Firestore timestamps to Date objects
    if ('toDate' in data && typeof data.toDate === 'function') {
      return data.toDate();
    }
    
    // Handle nested objects
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = formatFromFirestore(value);
    }
    return result;
  }
  
  return data;
};

// Push local changes to Firestore
const pushToCloud = async (changes: SyncChange[], userId: string) => {
  if (isProcessingRemoteChange || !userId) return;
  
  try {
    const batch = writeBatch(firestore);
    
    for (const change of changes) {
      const { table, key, operation, data } = change;
      const docRef = doc(firestore, `users/${userId}/${table}/${key}`);
      
      switch (operation) {
        case 'create':
        case 'update':
          batch.set(docRef, {
            ...formatForFirestore(data),
            updatedAt: toFirestoreTimestamp(Date.now()),
          }, { merge: true });
          break;
          
        case 'delete':
          batch.delete(docRef);
          break;
      }
    }
    
    await batch.commit();
    console.log(`Pushed ${changes.length} changes to Firestore`);
  } catch (error) {
    console.error('Error pushing changes to Firestore:', error);
    // The changes will be synced on the next connection
  }
};

// Pull changes from Firestore to local DB
const pullFromCloud = async (userId: string) => {
  if (!userId) return;
  
  try {
    // Pull all collections in parallel
    await Promise.all(
      Object.values(COLLECTIONS).map(collectionName => 
        syncCollection(collectionName, userId)
      )
    );
    
    console.log('Initial sync completed');
  } catch (error) {
    console.error('Error during initial sync:', error);
  }
};

// Sync a single collection
const syncCollection = async (collectionName: string, userId: string) => {
  const collectionRef = collection(firestore, `users/${userId}/${collectionName}`);
  const snapshot = await getDoc(doc(collectionRef, 'dummy')); // Get a dummy document to check if collection exists
  
  if (!snapshot.exists()) return;
  
  const remoteData = snapshot.data();
  const localTable = (db as any)[collectionName] as Table<any, any> | undefined;
  
  if (!localTable || typeof localTable.bulkPut !== 'function') {
    console.warn(`No valid local table found for collection: ${collectionName}`);
    return;
  }
  
  // Convert Firestore data to local format
  const formattedData = formatFromFirestore(remoteData);
  
  // Update local DB
  await localTable.bulkPut([formattedData]);
};

// Setup real-time listeners for Firestore changes
const setupRealtimeListeners = (userId: string) => {
  if (!userId) return () => {};
  
  const unsubscribeCallbacks = Object.values(COLLECTIONS).map(collectionName => {
    const collectionRef = collection(firestore, `users/${userId}/${collectionName}`);
    
    return onSnapshot(collectionRef, (snapshot) => {
      if (isProcessingRemoteChange) return;
      
      isProcessingRemoteChange = true;
      
      snapshot.docChanges().forEach(async (change) => {
        const data = formatFromFirestore({
          id: change.doc.id,
          ...change.doc.data(),
        });
        
        const localTable = (db as any)[collectionName] as Table<any, any> | undefined;
        if (!localTable) return;
        
        try {
          if (change.type === 'removed') {
            if (typeof localTable.delete === 'function') {
              await localTable.delete(data.id);
            }
          } else if (typeof localTable.put === 'function') {
            await localTable.put(data);
          }
        } catch (error) {
          console.error(`Error applying remote change to ${collectionName}:`, error);
        }
      });
      
      isProcessingRemoteChange = false;
    });
  });
  
  // Return a function to unsubscribe all listeners
  return () => {
    unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
  };
};

// Setup Dexie change tracking
const setupDexieHooks = (userId: string) => {
  // Track changes to all tables
  Object.values(COLLECTIONS).forEach(tableName => {
    const table = (db as any)[tableName] as Table<any, any> | undefined;
    if (!table || typeof table.hook !== 'function') return;
    
    table.hook('creating', (primKey: any, obj: any) => {
      if (isProcessingRemoteChange) return;
      
      pushToCloud([{
        table: tableName,
        key: primKey,
        operation: 'create',
        data: obj,
        timestamp: Date.now(),
        source: 'local',
      }], userId);
    });
    
    table.hook('updating', (modifications: any, primKey: any, obj: any) => {
      if (isProcessingRemoteChange) return;
      
      pushToCloud([{
        table: tableName,
        key: primKey,
        operation: 'update',
        data: { ...obj, ...modifications },
        timestamp: Date.now(),
        source: 'local',
      }], userId);
    });
    
    table.hook('deleting', (primKey: any, obj: any) => {
      if (isProcessingRemoteChange) return;
      
      pushToCloud([{
        table: tableName,
        key: primKey,
        operation: 'delete',
        data: obj,
        timestamp: Date.now(),
        source: 'local',
      }], userId);
    });
  });
};

// Flag to enable/disable Firebase sync
const ENABLE_FIREBASE_SYNC = false;

// Initialize sync service
let unsubscribeAuth: (() => void) | null = null;
let unsubscribeListeners: (() => void) | null = null;

export const initializeSync = () => {
  if (!ENABLE_FIREBASE_SYNC) {
    console.log('Firebase sync is disabled. To enable, set ENABLE_FIREBASE_SYNC to true in syncService.ts');
    return;
  }
  
  // Clean up any existing listeners
  cleanupSync();
  
  // Set up auth state change listener
  unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('User authenticated, initializing sync...');
      try {
        // Initial sync
        await pullFromCloud(user.uid);
        
        // Set up real-time listeners
        unsubscribeListeners = setupRealtimeListeners(user.uid);
        
        // Set up Dexie hooks for local changes
        setupDexieHooks(user.uid);
        
        console.log('Sync service initialized');
      } catch (error) {
        console.error('Error initializing sync:', error);
      }
    } else {
      // User signed out, clean up
      cleanupSync();
      console.log('User signed out, sync service stopped');
    }
  });
};

// Clean up sync service
export const cleanupSync = () => {
  if (unsubscribeAuth) {
    unsubscribeAuth();
    unsubscribeAuth = null;
  }
  
  if (unsubscribeListeners) {
    unsubscribeListeners();
    unsubscribeListeners = null;
  }
};

// Export a function to manually trigger a sync
export const triggerSync = async () => {
  const user = auth.currentUser;
  if (!user) return;
  
  await pullFromCloud(user.uid);
};
