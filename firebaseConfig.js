// firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyARJI0DZgGwH9j2Hz318ddonBd55IieUBs",
  authDomain: "monthlymeetingapp.firebaseapp.com",
  projectId: "monthlymeetingapp",
  storageBucket: "monthlymeetingapp.appspot.com",
  messagingSenderId: "139941390700",
  appId: "1:139941390700:web:ab6aa16fcd8ca71bb52b49",
  measurementId: "G-26KEDXQKK9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Don't call getMessaging here directly!

function getFirebaseMessaging() {
  if (typeof window !== 'undefined') {
    return getMessaging(app);
  } else {
    return null; // On server return null or undefined
  }
}

export { db, storage, auth, getFirebaseMessaging };
