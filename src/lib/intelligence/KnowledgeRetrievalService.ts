import { getFirestore } from 'firebase-admin/firestore';


function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const sim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Number.isFinite(sim) ? sim : 0;
}

import { getEmbeddings } from '../../../scripts/vertex-embed.ts';

export class KnowledgeRetrievalService {
  
  static _db: any = null;
  static _embedFn: any = null;

  static setDependencies(db: any, embedFn: any) {
    this._db = db;
    this._embedFn = embedFn;
  }
  
  static getDb() {
    return this._db || getFirestore();
  }

  static async embed(text: string): Promise<number[]> {
    if (this._embedFn) return await this._embedFn(text);
    return await getEmbeddings(text);
  }

  static async retrieve(applicationId: string, question: string) {
    // 1. Get embedding for question
    const qVector = await this.embed(question);
    
    // 2. Fetch all chunks for application (Metadata filtering)
    // NOTE: This respects the boundaries without fetching unrelated tenant data
    const chunksQuery = this.getDb().collection("knowledge_chunks").where("applicationId", "==", applicationId);
    const snap = await chunksQuery.get();
    
    // 3. Local semantic retrieval
    let results: any[] = [];
    snap.docs.forEach((d: any) => {
      const data = d.data();
      const sim = cosineSimilarity(qVector, data.embedding);
      results.push({ ...data, similarity: sim });
    });
    
    // Sort and take top 5 semantic matches
    results.sort((a, b) => b.similarity - a.similarity);
    const topChunks = results.slice(0, 5);
    
    // 4. Artifact Retrieval & Relationship Expansion
    const artifactsMap = new Map();
    const paths: any[] = [];
    
    // Impact queries need 2-hop traversal to follow req -> rule -> code
    const isImpactAnalysis = /impact|affect|change|dependency/i.test(question);
    const maxDepth = isImpactAnalysis ? 2 : 1;
    
    async function fetchArtifact(id: string, depth: number = 0, fromId?: string, relType?: string) {
      if (artifactsMap.has(id)) return;
      const docRef = KnowledgeRetrievalService.getDb().collection("artifacts").doc(id);
      const aSnap = await docRef.get();
      if (!aSnap.exists) return;
      
      const artifact = aSnap.data() as any;
      
      // Enforce tenant boundaries during graph expansion
      if (artifact.applicationId !== applicationId) {
        return;
      }
      
      artifactsMap.set(id, artifact);
      
      if (fromId) {
        paths.push({ fromArtifactId: fromId, relationship: relType, toArtifactId: id });
      }

      if (depth < maxDepth) {
        // 1. Outward expansion
        const relFields = ['relatedArtifactIds', 'implements', 'dependsOn', 'supersedes', 'contradicts', 'validates', 'affects'];
        for (const field of relFields) {
          if (artifact[field] && Array.isArray(artifact[field])) {
            for (const relatedId of artifact[field]) {
              await fetchArtifact(relatedId, depth + 1, id, field);
            }
          }
        }
        
        // 2. Inward (reverse) expansion
        const reverseFields = ['dependsOn', 'implements'];
        for (const field of reverseFields) {
          try {
            const revSnap = await KnowledgeRetrievalService.getDb().collection("artifacts")
              .where("applicationId", "==", applicationId)
              .where(field, "array-contains", id)
              .get();
              
            for (const rDoc of revSnap.docs) {
              await fetchArtifact(rDoc.id, depth + 1, id, `referenced_by_${field}`);
            }
          } catch (e: any) {
             console.error(`Reverse lookup failed for field ${field}: ${e.message}`);
             throw e; // Do not silently skip on failure
          }
        }
      }
    }

    for (const chunk of topChunks) {
      await fetchArtifact(chunk.artifactId, 0);
    }
    
    const artifactsArray = Array.from(artifactsMap.values());
    
    // Group and label evidence for reasoning layer
    const evidenceGrouping = {
      baselineProduct: artifactsArray.filter(a => a.isBaseline === true),
      clientSpecific: artifactsArray.filter(a => a.clientId || a.isBaseline === false),
      unknownScope: artifactsArray.filter(a => !a.clientId && a.isBaseline !== true && a.isBaseline !== false),
      byLifecycleStatus: {
        active: artifactsArray.filter(a => a.status === 'active'),
        deprecated: artifactsArray.filter(a => a.status === 'deprecated'),
        proposed: artifactsArray.filter(a => a.status === 'proposed'),
        draft: artifactsArray.filter(a => a.status === 'draft'),
        unknown: artifactsArray.filter(a => !a.status)
      },
      byVersion: {} as Record<string, any[]>,
      byApplication: {} as Record<string, any[]>
    };

    artifactsArray.forEach(a => {
      const v = a.version || 'unversioned';
      if (!evidenceGrouping.byVersion[v]) evidenceGrouping.byVersion[v] = [];
      evidenceGrouping.byVersion[v].push(a);

      const app = a.applicationId || 'unknown';
      if (!evidenceGrouping.byApplication[app]) evidenceGrouping.byApplication[app] = [];
      evidenceGrouping.byApplication[app].push(a);
    });

    return {
      metadata: {
        applicationId,
        query: question,
        semanticMatches: topChunks.length,
        graphExpansions: artifactsMap.size - topChunks.length
      },
      retrievedArtifacts: artifactsArray,
      evidenceGrouping,
      relationshipPaths: paths
    };
  }
}
