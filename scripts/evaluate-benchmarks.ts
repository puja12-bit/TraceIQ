import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { KnowledgeRetrievalService } from '../src/lib/intelligence/KnowledgeRetrievalService.ts';
import { TraceIQReasoningService } from '../src/lib/intelligence/TraceIQReasoningService.ts';

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

const questions = [
  "Why does an 8-month-old telecom customer not see B2B?",
  "Why did one payment produce two receipts?",
  "Why does Client B not have B2B?",
  "Why was the 12-month B2B rule introduced?",
  "Is the B2B requirement consistent with the current implementation?",
  "What would be affected if B2B eligibility changed from 12 months to 6 months?",
  "What information is missing to determine why this particular payment was split?"
];

async function run() {
  console.log("Authenticating as authorized user...");
  await signInWithEmailAndPassword(auth, "ingest_admin@nexaone.com", "Password123!");

  const appId = "app-nexaone";

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n===========================================`);
    console.log(`Question ${i + 1}: ${q}`);
    
    // Retrieval & Expansion
    const retrieval = await KnowledgeRetrievalService.retrieve(appId, q);
    console.log(`[Retrieval] Found ${retrieval.metadata.semanticMatches} chunks via semantics, expanded to ${retrieval.retrievedArtifacts.length} total artifacts via relationships.`);
    console.log(`[Retrieval] Relationship paths traversed: ${retrieval.relationshipPaths.length}`);
    
    // Reasoning
    const response = await TraceIQReasoningService.reason(q, retrieval);
    
    console.log(`\nAnswer: ${response.answer}`);
    console.log(`Confidence: ${response.confidence}`);
    console.log(`\nClaims:`);
    response.claims.forEach((c: any) => console.log(` - ${c.statement} [Evidence: ${c.evidenceArtifactIds.join(', ')}]`));
    
    if (response.conflicts.length > 0) {
      console.log(`\nConflicts detected:`);
      response.conflicts.forEach((c: any) => console.log(` - ${c.explanation} (Artifacts: ${c.artifactIds.join(', ')})`));
    }

    if (response.knowledgeGaps.length > 0) {
      console.log(`\nKnowledge Gaps:`);
      response.knowledgeGaps.forEach((g: string) => console.log(` - ${g}`));
    }
  }

  process.exit(0);
}

run().catch(console.error);
