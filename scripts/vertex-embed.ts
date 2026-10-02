import { GoogleAuth } from 'google-auth-library';

let authClient: any = null;

async function getAccessToken() {
  if (!authClient) {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    authClient = await auth.getClient();
  }
  const token = await authClient.getAccessToken();
  return token.token;
}

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const token = await getAccessToken();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'traceiq-ab468';
    const location = process.env.VERTEX_LOCATION || 'us-central1';
    
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/text-embedding-004:predict`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{ content: text }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Vertex AI error: ${await response.text()}`);
    }
    
    const data = await response.json() as any;
    return data.predictions[0].embeddings.values;
  } catch (e) {
    console.error("Embedding failed:", e);
    return new Array(768).fill(0);
  }
}
