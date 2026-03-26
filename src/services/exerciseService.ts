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
  Timestamp
} from 'firebase/firestore';
import { showError } from '../utils/errorHandler';

export interface Exercise {
  id?: string;
  userId: string;
  name: string;
  subCategoryId: string;
  exerciseType?: string;
  defaultRestTime?: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

const EXERCISES_COLLECTION = 'exercises';

export const createExercise = async (exerciseData: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const exercisesRef = collection(db, EXERCISES_COLLECTION);
    const newExerciseRef = doc(exercisesRef);
    
    const newExercise: Exercise = {
      ...exerciseData,
      id: newExerciseRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setDoc(newExerciseRef, newExercise);
    return newExerciseRef.id;
  } catch (error) {
    console.error('Error creating exercise:', error);
    throw new Error(showError(error, 'Failed to create exercise'));
  }
};

export const updateExercise = async (exerciseId: string, updates: Partial<Exercise>): Promise<void> => {
  try {
    const exerciseRef = doc(db, EXERCISES_COLLECTION, exerciseId);
    
    await updateDoc(exerciseRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    throw new Error(showError(error, 'Failed to update exercise'));
  }
};

export const deleteExercise = async (exerciseId: string): Promise<void> => {
  try {
    const exerciseRef = doc(db, EXERCISES_COLLECTION, exerciseId);
    await deleteDoc(exerciseRef);
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw new Error(showError(error, 'Failed to delete exercise'));
  }
};

export const getExercise = async (exerciseId: string): Promise<Exercise | null> => {
  try {
    const exerciseRef = doc(db, EXERCISES_COLLECTION, exerciseId);
    const exerciseDoc = await getDoc(exerciseRef);
    
    if (exerciseDoc.exists()) {
      return { id: exerciseDoc.id, ...exerciseDoc.data() } as Exercise;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting exercise:', error);
    throw new Error(showError(error, 'Failed to get exercise'));
  }
};

export const getUserExercises = async (userId: string): Promise<Exercise[]> => {
  try {
    const exercisesRef = collection(db, EXERCISES_COLLECTION);
    const q = query(
      exercisesRef,
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Exercise));
  } catch (error) {
    console.error('Error getting user exercises:', error);
    throw new Error(showError(error, 'Failed to get exercises'));
  }
};

export const getExercisesByCategory = async (userId: string, subCategoryId: string): Promise<Exercise[]> => {
  try {
    const exercisesRef = collection(db, EXERCISES_COLLECTION);
    const q = query(
      exercisesRef,
      where('userId', '==', userId),
      where('subCategoryId', '==', subCategoryId),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Exercise));
  } catch (error) {
    console.error('Error getting exercises by category:', error);
    throw new Error(showError(error, 'Failed to get exercises by category'));
  }
};
