import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCFNj2AhRE8qLS0o_9ir8nM6xLg83BQ4Aw",
  authDomain: "neuro-5b180.firebaseapp.com",
  projectId: "neuro-5b180",
  storageBucket: "neuro-5b180.appspot.com",
  messagingSenderId: "781267118248",
  appId: "1:781267118248:web:7c32d4e55e7e7ce88f3a9d",
  measurementId: "G-CB5GQW1DZ3"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
