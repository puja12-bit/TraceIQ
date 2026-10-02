import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

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

async function runAuthTest() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log("Setting up onAuthStateChanged listener...");
  
  let authStateFired = false;
  
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log(`onAuthStateChanged: User is signed in (${user.uid})`);
      authStateFired = true;
    } else {
      console.log("onAuthStateChanged: User is signed out");
    }
  });

  try {
    console.log(`Attempting to create user: ${email}...`);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`createUserWithEmailAndPassword SUCCESS (UID: ${cred.user.uid})`);
    
    console.log("Attempting to sign out...");
    await auth.signOut();
    
    console.log(`Attempting to sign in user: ${email}...`);
    const signinCred = await signInWithEmailAndPassword(auth, email, password);
    console.log(`signInWithEmailAndPassword SUCCESS (UID: ${signinCred.user.uid})`);
    
    // Give auth state a moment to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (authStateFired) {
      console.log("onAuthStateChanged test result: PASS");
    } else {
      console.log("onAuthStateChanged test result: FAIL");
    }
    
    console.log("Authentication test result: PASS");
    
  } catch (error) {
    console.log("Authentication test result: FAIL");
    console.log(`Exact Error: [${error.code}] ${error.message}`);
    // Check if it's the configuration not found error
    if (error.code === 'auth/configuration-not-found') {
      console.log("DIAGNOSIS: Identity Toolkit API (Authentication) is not configured/enabled for this project.");
    }
  }
  
  unsubscribe();
  process.exit(0);
}

runAuthTest();
