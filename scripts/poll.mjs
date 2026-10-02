import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  projectId: "traceiq-ab468",
  appId: "1:80299946571:web:9dd229d9c3bd477064d3ce",
  storageBucket: "traceiq-ab468.firebasestorage.app",
  apiKey: "AIzaSyD_8qJzvMhYUxk-rmdpKnVGNDGvrRgmscA",
  authDomain: "traceiq-ab468.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const BASE_URL = 'https://traceiq-api-80299946571.us-central1.run.app';

async function test() {
  const cred = await signInWithEmailAndPassword(auth, "ingest_admin@nexaone.com", "Password123!");
  const token = await cred.user.getIdToken();
  const res = await fetch(`${BASE_URL}/api/retrieve`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ applicationId: 'app-nexaone', question: 'test' })
  });
  console.log(res.status, await res.text());
}
test();
