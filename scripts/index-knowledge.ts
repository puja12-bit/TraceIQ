import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';

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

import { getEmbeddings } from './vertex-embed.ts';

async function embed(text: string): Promise<number[]> {
  return await getEmbeddings(text);
}

async function index() {
  console.log("Authenticating...");
  await signInWithEmailAndPassword(auth, "ingest_admin@nexaone.com", "Password123!");

  console.log("Fetching artifacts...");
  const artifactsSnap = await getDocs(query(collection(db, "artifacts"), where("applicationId", "==", "app-nexaone")));
  
  let successCount = 0;
  let failCount = 0;
  
  for (const aDoc of artifactsSnap.docs) {
    const artifact = aDoc.data();
    
    // Chunking logic: For now, artifacts are small enough to be single chunks
    const chunkContent = `Type: ${artifact.type}\nTitle: ${artifact.name}\nDescription: ${artifact.description}\nContent: ${artifact.content}`;
    
    const chunk = {
      id: `${artifact.id}-chunk-0`,
      artifactId: artifact.id,
      applicationId: artifact.applicationId,
      content: chunkContent,
      chunkIndex: 0,
      metadata: {
        type: artifact.type,
        tags: artifact.tags || [],
        clientId: artifact.clientId || null,
        featureId: artifact.featureId || null,
        status: artifact.status || null,
        owner: artifact.owner || null,
        team: artifact.team || null,
        isBaseline: artifact.isBaseline !== undefined ? artifact.isBaseline : null,
        lastVerifiedAt: artifact.lastVerifiedAt || null,
        sourceArtifactIds: artifact.sourceArtifactIds || null
      }
    };

    console.log(`Embedding ${artifact.id}...`);
    try {
      const vector = await embed(chunkContent);
      
      // Store in knowledge_chunks
      await setDoc(doc(db, "knowledge_chunks", chunk.id), {
        ...chunk,
        embedding: vector
      }, { merge: true });
      successCount++;
    } catch (e: any) {
      console.error(`Failed to embed ${artifact.id}: ${e.message}`);
      failCount++;
    }
  }
  
  console.log(`\nIndexing Complete. Success: ${successCount}, Failed: ${failCount}`);
  process.exit(0);
}

index().catch(console.error);
