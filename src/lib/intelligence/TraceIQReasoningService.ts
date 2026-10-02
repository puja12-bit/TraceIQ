import { GoogleAuth } from 'google-auth-library';

const responseSchema = {
  type: 'OBJECT',
  properties: {
    answer: { type: 'STRING' },
    confidence: { type: 'STRING' },
    claims: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          statement: { type: 'STRING' },
          evidenceArtifactIds: { type: 'ARRAY', items: { type: 'STRING' } }
        }
      }
    },
    trace: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          fromArtifactId: { type: 'STRING' },
          relationship: { type: 'STRING' },
          toArtifactId: { type: 'STRING' }
        }
      }
    },
    conflicts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          artifactIds: { type: 'ARRAY', items: { type: 'STRING' } },
          explanation: { type: 'STRING' }
        }
      }
    },
    knowledgeGaps: { type: 'ARRAY', items: { type: 'STRING' } },
    capabilityConclusion: {
      type: 'STRING',
      description: "Optional. Only if question asks about feasibility, select: supported, configurable, requires_development, proposed, unknown.",
      enum: ["supported", "configurable", "requires_development", "proposed", "unknown"]
    }
  }
};

export class TraceIQReasoningService {
  static _authClient: any = null;
  static _fetchFn: any = null;

  static setDependencies(authClient: any, fetchFn: any) {
    this._authClient = authClient;
    this._fetchFn = fetchFn;
  }

  static async getAccessToken() {
    if (this._authClient) {
      if (this._authClient.getAccessToken) {
         const token = await this._authClient.getAccessToken();
         return token.token;
      }
      return "mock-token";
    }
    
    // Default production behavior
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  }

  static async reason(question: string, context: any) {
    const prompt = `
You are TraceIQ, an intelligence layer for the NexaOne Customer Portal.
Your task is to answer the user's question using ONLY the provided evidence.

Evidence Policy:
1. Use ONLY supplied evidence.
2. Do not invent business rules or historical reasons.
3. Distinguish documented fact from inference.
4. If evidence conflicts, explicitly report it.
5. If evidence is insufficient, say what is missing.
6. Cite artifact IDs for every substantive claim.
7. Prefer current artifacts over superseded ones.
8. Use release history when asking "why" or "when".
9. Do not treat a stale document as current merely because it is semantically relevant.
10. Never present a proposed feature as implemented.
11. Never present deprecated behavior as current without supporting evidence.
12. Do not assume that 'status: active' means a capability is enabled for every client.
13. Clearly distinguish baseline product capabilities from client-specific overrides.
14. When asked for owners or teams, strictly use the provided ownership metadata.
15. Treat missing metadata as unknown rather than inferring a value.

Answer Structure:
If the question is about feature feasibility or support, structure your \`answer\` as follows:
- Conclusion: What can be established from current evidence?
- Scope: Baseline, specific client, application, and version.
- Evidence: Facts supporting the conclusion (cite Artifact IDs).
- Conditions: Configuration, dependencies, or prerequisites.
- Limitations: Missing information, conflicts, or unsupported assumptions.
- Next action: What the employee should verify or whom they should contact.

User Question: ${question}

Context (Retrieved Artifacts and Relationship Paths):
${JSON.stringify(context, null, 2)}
`;

    const token = await this.getAccessToken();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'traceiq-ab468';
    const location = process.env.VERTEX_LOCATION || 'us-central1';
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
    
    const response = await (this._fetchFn || fetch)(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Vertex AI error: ${await response.statusText} ${await response.text()}`);
    }
    
    const result = await response.json() as any;
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error("Gemini returned no candidates");
    }
    
    let txt = result.candidates[0].content.parts[0].text;
    return JSON.parse(txt);
  }
}
