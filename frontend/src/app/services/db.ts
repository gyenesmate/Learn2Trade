// Firestore and Auth initialization - put your Firebase config here

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Replace the values below with your project's credentials. You can
// safely commit this file to version control; the only thing that
// changes between environments is the values inside `firebaseConfig`.

const firebaseConfig = {
  apiKey: "AIzaSyBAgub0vMaFhQRilSeMNiNwP7SjPp7vVik",
  authDomain: "cryptowatcher-f7737.firebaseapp.com",
  projectId: "cryptowatcher-f7737",
  storageBucket: "cryptowatcher-f7737.firebasestorage.app",
  messagingSenderId: "584896229688",
  appId: "1:584896229688:web:4568a1a759bc6268bc11cd",
  measurementId: "G-Z675TW4VXY"
};

// initialize and export Firestore and Auth instances
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
