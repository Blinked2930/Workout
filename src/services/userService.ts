import { User } from 'firebase/auth';
import { db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { showError } from '../utils/errorHandler';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
}

export const createUserDocument = async (user: User): Promise<void> => {
  if (!user.uid) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  
  // If user document doesn't exist, create it
  if (!userDoc.exists()) {
    const userData: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    try {
      await setDoc(userRef, userData);
    } catch (error) {
      console.error('Error creating user document:', error);
      throw new Error(showError(error, 'Failed to create user profile'));
    }
  } else {
    // Update existing user document if needed
    const userData = userDoc.data() as UserProfile;
    const updates: Partial<UserProfile> = {
      displayName: user.displayName || userData.displayName,
      photoURL: user.photoURL || userData.photoURL,
      updatedAt: serverTimestamp(),
    };
    
    // Only update if something changed
    if (JSON.stringify(updates) !== JSON.stringify(userData)) {
      try {
        await setDoc(userRef, updates, { merge: true });
      } catch (error) {
        console.error('Error updating user document:', error);
        throw new Error(showError(error, 'Failed to update user profile'));
      }
    }
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  
  return null;
};
