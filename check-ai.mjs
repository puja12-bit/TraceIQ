import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel } from 'firebase/ai';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
const ai = getAI(app);
const auth = getAuth(app);

async function check() {
  try {
    await signInWithEmailAndPassword(auth, "ingest_admin@nexaone.com", "Password123!");
    const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });
    const res = await model.generateContent("Say hello");
    console.log("Success:", res.response.text());
  } catch (e) {
    console.error("Failed:", e.message);
  }
  process.exit();
}
check();
