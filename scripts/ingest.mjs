import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

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

// Helper to recursively find JSON files
function findJsonFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findJsonFiles(filePath, fileList);
    } else if (filePath.endsWith('.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function ingest() {
  console.log("Starting artifact ingestion...");

  // 1. Authenticate using environment variables (No hardcoded credentials)
  const email = process.env.INGEST_EMAIL;
  const password = process.env.INGEST_PASSWORD;
  
  if (!email || !password) {
    console.error("ERROR: Missing INGEST_EMAIL or INGEST_PASSWORD environment variables.");
    process.exit(1);
  }

  const orgId = "org-nexaone";
  const appId = "app-nexaone";

  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
    console.log("Created ingest admin account.");
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log("Signed in with existing ingest admin account.");
    } else {
      throw e;
    }
  }

  // 2. Setup DB context (org and app) to satisfy security rules
  await setDoc(doc(db, "users", uid), {
    id: uid,
    email: email,
    organizationId: orgId,
    role: 'admin'
  }, { merge: true });

  await setDoc(doc(db, "applications", appId), {
    id: appId,
    organizationId: orgId,
    name: "NexaOne Customer Portal",
    description: "Enterprise customer portal prototype.",
    status: "active",
    createdAt: new Date().toISOString()
  }, { merge: true });

  console.log(`Verified application context (App: ${appId}, Org: ${orgId}).`);

  // 3. Find and read demo artifacts
  const demoDataDir = path.join(process.cwd(), 'demo-data', 'nexaone');
  const files = findJsonFiles(demoDataDir);
  console.log(`Found ${files.length} artifacts to ingest.`);

  // 4. Ingest artifacts
  let ingested = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const artifact = JSON.parse(content);
    
    // Strict validation: Reject missing fields
    if (!artifact.id || !artifact.applicationId || !artifact.type || !artifact.name) {
      console.warn(`Skipping ${file}: Missing required fields.`);
      continue;
    }
    
    // Strict validation: Prevent malicious cross-application ingestion
    if (artifact.applicationId !== appId) {
      console.warn(`SECURITY REJECTION: ${file} attempted to ingest into unauthorized application (${artifact.applicationId}). Target is strictly ${appId}.`);
      continue;
    }

    artifact.createdAt = artifact.createdAt || new Date().toISOString();
    
    // Use the explicitly defined ID for idempotency (prevents duplication)
    const docRef = doc(db, "artifacts", artifact.id);
    
    try {
      await setDoc(docRef, artifact, { merge: true });
      ingested++;
      console.log(`Ingested: [${artifact.type}] ${artifact.name} (${artifact.id})`);
    } catch (e) {
      console.error(`Failed to ingest ${artifact.id}:`, e.message);
    }
  }

  console.log(`Ingestion complete! ${ingested}/${files.length} artifacts upserted successfully.`);
  process.exit(0);
}

ingest().catch(console.error);
