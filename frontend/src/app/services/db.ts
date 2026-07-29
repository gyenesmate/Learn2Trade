// Firestore and Auth initialization - put your Firebase config here

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import secrets from '../../../secrets.json';
// Replace the values below with your project's credentials. You can
// safely commit this file to version control; the only thing that
// changes between environments is the values inside `firebaseConfig`.

const firebaseConfig = secrets.firebaseConfig;

// initialize and export Firestore and Auth instances
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
