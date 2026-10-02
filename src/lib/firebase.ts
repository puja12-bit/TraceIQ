import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "traceiq-ab468",
  appId: "1:80299946571:web:9dd229d9c3bd477064d3ce",
  storageBucket: "traceiq-ab468.firebasestorage.app",
  apiKey: "AIzaSyD_8qJzvMhYUxk-rmdpKnVGNDGvrRgmscA",
  authDomain: "traceiq-ab468.firebaseapp.com",
  messagingSenderId: "80299946571",
  measurementId: "G-ZQVPJ7SKF7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
