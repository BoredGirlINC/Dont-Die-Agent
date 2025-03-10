import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for the actual project
const firebaseConfig = {
  apiKey: "AIzaSyAAHm86mAhNlb6kmU8jzNw3UM_K5QxcaB0",
  authDomain: "don-t-die-d6e56.firebaseapp.com",
  projectId: "don-t-die-d6e56",
  storageBucket: "don-t-die-d6e56.appspot.com",
  messagingSenderId: "662578966424",
  appId: "1:662578966424:web:d3ae9f7c7651da7b7a05ed"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 