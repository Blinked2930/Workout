import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// Static Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBFF3wFcJ2YupEFeiMR4h_bDZbimtHW894",
    authDomain: "sample-firebase-ai-app-ee789.firebaseapp.com",
    projectId: "sample-firebase-ai-app-ee789",
    storageBucket: "sample-firebase-ai-app-ee789.firebasestorage.app",
    messagingSenderId: "298244479298",
    appId: "1:298244479298:web:1bb81cb10c35ccd24090db",
    measurementId: "G-6R4B8LDSR8"
};
try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    console.log('Firebase initialized successfully');
}
catch (error) {
    console.error('Firebase initialization error:', error);
}
