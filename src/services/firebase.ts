// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
  NextOrObserver,
  UserCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  FirestoreError
} from 'firebase/firestore';
import { showError } from '../utils/errorHandler';
import { createUserDocument } from './userService';

// Static Firebase config for testing to rule out env issues
const firebaseConfig = {
  apiKey: "AIzaSyBFF3wFcJ2YupEFeiMR4h_bDZbimtHW894",
  authDomain: "sample-firebase-ai-app-ee789.firebaseapp.com",
  projectId: "sample-firebase-ai-app-ee789",
  storageBucket: "sample-firebase-ai-app-ee789.firebasestorage.app",
  messagingSenderId: "298244479298",
  appId: "1:298244479298:web:1bb81cb10c35ccd24090db",
  measurementId: "G-6R4B8LDSR8"
};

// Initialize Firebase app
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

// Auth functions
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;
    
    // Create or update user document in Firestore
    await createUserDocument(user);
    
    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const onAuthStateChangedListener = (callback: NextOrObserver<User | null>) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

export { auth, googleProvider };
