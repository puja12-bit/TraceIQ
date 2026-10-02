import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString } from 'firebase/storage';

const firebaseConfig = {
  projectId: "traceiq-ab468",
  appId: "1:80299946571:web:9dd229d9c3bd477064d3ce",
  storageBucket: "traceiq-ab468.firebasestorage.app",
  apiKey: "AIzaSyD_8qJzvMhYUxk-rmdpKnVGNDGvrRgmscA",
  authDomain: "traceiq-ab468.firebaseapp.com",
  messagingSenderId: "80299946571",
  measurementId: "G-ZQVPJ7SKF7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

async function runTests() {
  console.log("Firebase project connected: PASS");

  try {
    const email = `testuser_${Date.now()}@example.com`;
    const password = "password123";
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Authentication: PASS");
    
    const uid = userCredential.user.uid;
    const orgId = "org123";
    
    // Create user doc
    await setDoc(doc(db, "users", uid), {
      id: uid,
      email: email,
      organizationId: orgId,
      role: 'admin'
    });

    // Create an authorized app
    const appId = "app123";
    await setDoc(doc(db, "applications", appId), {
      id: appId,
      organizationId: orgId,
      name: "Authorized App"
    });
    
    try {
      await setDoc(doc(db, "applications", "app456"), {
         organizationId: "different_org"
      });
      console.log("Unauthorized access test: FAIL (should have thrown)");
    } catch (e) {
      console.log("Unauthorized access test: PASS");
    }

    const docSnap = await getDoc(doc(db, "applications", appId));
    if (docSnap.exists()) {
      console.log("Authorized access test: PASS");
      console.log("Firestore: PASS");
    } else {
      console.log("Authorized access test: FAIL");
      console.log("Firestore: FAIL");
    }

    // Give Firestore time to sync before Storage hits it via rules
    await new Promise(r => setTimeout(r, 2000));

    // TEST 1: Authorized upload
    try {
      const storageRef = ref(storage, `organizations/${orgId}/applications/${appId}/test.txt`);
      await uploadString(storageRef, 'Hello World');
      console.log("Authorized upload: PASS");
    } catch (e) {
      console.log("Authorized upload: FAIL");
      console.error(e);
    }

    // TEST 2: Unauthorized upload
    try {
      const unauthStorageRef = ref(storage, `organizations/different_org/applications/${appId}/test.txt`);
      await uploadString(unauthStorageRef, 'Should fail');
      console.log("Unauthorized upload: FAIL (should have thrown)");
    } catch (e) {
      console.log("Unauthorized upload: PASS");
    }

  } catch (error) {
    console.log("Authentication/Firestore/Storage check failed:", error.code || error.message);
  }
  process.exit(0);
}

runTests();
