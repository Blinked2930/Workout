import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { showError } from '../utils/errorHandler';

export interface Lift {
  id?: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  sets: number;
  rir?: number;
  notes?: string;
  isEachSide: boolean;
  date: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

const LIFTS_COLLECTION = 'lifts';

export const createLift = async (liftData: Omit<Lift, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const liftsRef = collection(db, LIFTS_COLLECTION);
    const newLiftRef = doc(liftsRef);
    
    const newLift: Lift = {
      ...liftData,
      id: newLiftRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setDoc(newLiftRef, newLift);
    return newLiftRef.id;
  } catch (error) {
    console.error('Error creating lift:', error);
    throw new Error(showError(error, 'Failed to save lift'));
  }
};

export const updateLift = async (liftId: string, updates: Partial<Lift>): Promise<void> => {
  try {
    const liftRef = doc(db, LIFTS_COLLECTION, liftId);
    
    await updateDoc(liftRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating lift:', error);
    throw new Error(showError(error, 'Failed to update lift'));
  }
};

export const deleteLift = async (liftId: string): Promise<void> => {
  try {
    const liftRef = doc(db, LIFTS_COLLECTION, liftId);
    await deleteDoc(liftRef);
  } catch (error) {
    console.error('Error deleting lift:', error);
    throw new Error(showError(error, 'Failed to delete lift'));
  }
};

export const getLift = async (liftId: string): Promise<Lift | null> => {
  try {
    const liftRef = doc(db, LIFTS_COLLECTION, liftId);
    const liftDoc = await getDoc(liftRef);
    
    if (liftDoc.exists()) {
      return { id: liftDoc.id, ...liftDoc.data() } as Lift;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting lift:', error);
    throw new Error(showError(error, 'Failed to get lift'));
  }
};

export const getUserLifts = async (userId: string): Promise<Lift[]> => {
  try {
    const liftsRef = collection(db, LIFTS_COLLECTION);
    const q = query(
      liftsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Lift));
  } catch (error) {
    console.error('Error getting user lifts:', error);
    throw new Error(showError(error, 'Failed to get lifts'));
  }
};

export const getRecentLifts = async (userId: string, limitCount = 5): Promise<Lift[]> => {
  try {
    const liftsRef = collection(db, LIFTS_COLLECTION);
    const q = query(
      liftsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Lift));
  } catch (error) {
    console.error('Error getting recent lifts:', error);
    throw new Error(showError(error, 'Failed to get recent lifts'));
  }
};
