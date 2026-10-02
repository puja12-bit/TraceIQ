import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

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

async function runTests() {
  console.log("=== HEALTH TEST ===");
  const healthRes = await fetch(`${BASE_URL}/health`);
  console.log("Health Status:", healthRes.status, await healthRes.text());

  console.log("\n=== AUTH SETUP ===");
  const cred = await signInWithEmailAndPassword(auth, "ingest_admin@nexaone.com", "Password123!");
  const token = await cred.user.getIdToken();
  console.log("Got token.");

  console.log("\n=== UNAUTH TEST ===");
  const unauthRes = await fetch(`${BASE_URL}/api/retrieve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: 'app-nexaone', question: 'hi' })
  });
  console.log("Unauth Status:", unauthRes.status, await unauthRes.text());

  console.log("\n=== AUTH RETRIEVE TEST ===");
  const authRes = await fetch(`${BASE_URL}/api/retrieve`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ applicationId: 'app-nexaone', question: 'B2B eligibility' })
  });
  console.log("Auth Retrieve Status:", authRes.status);
  const authData = await authRes.json();
  console.log("Retrieved Items:", authData.retrievedArtifacts?.length);

  console.log("\n=== CROSS-TENANT TEST ===");
  const crossRes = await fetch(`${BASE_URL}/api/retrieve`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ applicationId: 'some-other-app', question: 'hi' })
  });
  console.log("Cross-tenant Status:", crossRes.status, await crossRes.text());

  console.log("\n=== REASONING TEST ===");
  const reasonRes = await fetch(`${BASE_URL}/api/reason`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      applicationId: 'app-nexaone', 
      question: 'B2B eligibility', 
      context: authData 
    })
  });
  console.log("Reasoning Status:", reasonRes.status);
  const reasonData = await reasonRes.json();
  console.log("Reasoning Keys:", Object.keys(reasonData));

  console.log("\n=== CORS TEST ===");
  const corsRes = await fetch(`${BASE_URL}/api/retrieve`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST'
    }
  });
  console.log("CORS localhost:", corsRes.headers.get('access-control-allow-origin'));

  const corsBadRes = await fetch(`${BASE_URL}/api/retrieve`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://evil.com',
      'Access-Control-Request-Method': 'POST'
    }
  });
  console.log("CORS evil:", corsBadRes.headers.get('access-control-allow-origin'));

  process.exit(0);
}

runTests().catch(console.error);
