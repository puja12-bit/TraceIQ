import { KnowledgeRetrievalService } from '../src/lib/intelligence/KnowledgeRetrievalService.ts';

function createMockFirestore(chunks: any[], artifacts: any[]) {
  return {
    collection: (colName: string) => {
      const qBuilder = (currentFilters: any[]) => ({
        where: (field: string, op: string, value: string) => {
          return qBuilder([...currentFilters, { field, op, value }]);
        },
        get: async () => {
          if (colName === 'knowledge_chunks') {
            const filtered = chunks.filter(c => {
              return currentFilters.every(f => {
                if (f.op === "==" && f.field === "applicationId") return c.applicationId === f.value;
                return false;
              });
            });
            return { docs: filtered.map(c => ({ data: () => c })) };
          }
          if (colName === 'artifacts') {
            const filtered = artifacts.filter(a => {
              return currentFilters.every(f => {
                if (f.op === "==" && f.field === "applicationId") return a.applicationId === f.value;
                if (f.op === "array-contains") {
                  const arr = a[f.field];
                  return Array.isArray(arr) && arr.includes(f.value);
                }
                return false;
              });
            });
            return { docs: filtered.map(a => ({ id: a.id, data: () => a })) };
          }
          return { docs: [] };
        }
      });
      return {
        ...qBuilder([]),
        doc: (docId: string) => ({
          get: async () => {
            if (colName !== 'artifacts') return { exists: false };
            const art = artifacts.find(a => a.id === docId);
            if (art) return { exists: true, data: () => art };
            return { exists: false };
          }
        })
      };
    }
  };
}

const mockEmbedFn = async (_text: string) => {
  // Return a dummy vector. Cosine similarity of [1,1] with [1,1] is 1.
  return [1, 1];
};

async function runTests() {
  console.log("--- Starting Isolated Retrieval Tests ---");
  
  // Setup Fixtures
  let passed = 0;
  let failed = 0;
  const appId = "app-nexaone";

  async function assertCase(name: string, chunks: any[], artifacts: any[], fn: () => Promise<void>) {
    const db = createMockFirestore(chunks, artifacts);
    KnowledgeRetrievalService.setDependencies(db, mockEmbedFn);
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`[FAIL] ${name}\n       ${e.message}`);
      failed++;
    }
  }

  await assertCase("Test 1: Baseline capability classification", 
    [{ id: 'c1', artifactId: 'req-baseline', applicationId: 'app-nexaone', embedding: [1, 1] }],
    [{ id: 'req-baseline', applicationId: 'app-nexaone', isBaseline: true, status: 'active' }],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "test");
      const baseline = res.evidenceGrouping.baselineProduct.find(a => a.id === 'req-baseline');
      if (!baseline) throw new Error("Baseline not found");
  });

  await assertCase("Test 2: Client-specific override classification", 
    [{ id: 'c2', artifactId: 'cfg-client-override', applicationId: 'app-nexaone', embedding: [1, 1] }],
    [{ id: 'cfg-client-override', applicationId: 'app-nexaone', isBaseline: false, clientId: 'client-a' }],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "test");
      const isBaseline = res.evidenceGrouping.baselineProduct.some(a => a.id === 'cfg-client-override');
      const isClient = res.evidenceGrouping.clientSpecific.some(a => a.id === 'cfg-client-override');
      if (isBaseline) throw new Error("Client config misclassified as baseline");
      if (!isClient) throw new Error("Client config not found in clientSpecific group");
  });

  await assertCase("Test 3: Retrieval of two authorized client implementations for comparison",
    [
      { id: 'c3', artifactId: 'cfg-client-b', applicationId: 'app-nexaone', embedding: [1, 1] },
      { id: 'c4', artifactId: 'cfg-client-c', applicationId: 'app-nexaone', embedding: [1, 1] }
    ],
    [
      { id: 'cfg-client-b', applicationId: 'app-nexaone', isBaseline: false, clientId: 'client-b' },
      { id: 'cfg-client-c', applicationId: 'app-nexaone', isBaseline: false, clientId: 'client-c' }
    ],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "test");
      const hasB = res.evidenceGrouping.clientSpecific.some(a => a.id === 'cfg-client-b');
      const hasC = res.evidenceGrouping.clientSpecific.some(a => a.id === 'cfg-client-c');
      if (!hasB || !hasC) throw new Error("Failed to retrieve both client configurations");
  });

  await assertCase("Test 4: Historical retrieval of deprecated artifacts",
    [{ id: 'c5', artifactId: 'req-deprecated', applicationId: 'app-nexaone', embedding: [1, 1] }],
    [{ id: 'req-deprecated', applicationId: 'app-nexaone', isBaseline: true, status: 'deprecated' }],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "test");
      const stale = res.evidenceGrouping.byLifecycleStatus.deprecated.some(a => a.id === 'req-deprecated');
      if (!stale) throw new Error("Deprecated artifact not grouped correctly");
  });

  await assertCase("Test 5: Identification of proposed features as proposed",
    [{ id: 'c6', artifactId: 'req-proposed', applicationId: 'app-nexaone', embedding: [1, 1] }],
    [{ id: 'req-proposed', applicationId: 'app-nexaone', isBaseline: true, status: 'proposed' }],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "test");
      const proposed = res.evidenceGrouping.byLifecycleStatus.proposed.some(a => a.id === 'req-proposed');
      if (!proposed) throw new Error("Proposed feature not grouped correctly");
  });

  await assertCase("Test 6: Graceful handling of legacy artifacts with missing metadata",
    [{ id: 'c7', artifactId: 'req-legacy', applicationId: 'app-nexaone', embedding: [1, 1] }],
    [{ id: 'req-legacy', applicationId: 'app-nexaone' }],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "test");
      const unknown = res.evidenceGrouping.unknownScope.some(a => a.id === 'req-legacy');
      if (!unknown) throw new Error("Legacy artifact failed to fall back to unknownScope");
  });

  await assertCase("Test 7: Blocking of unauthorized cross-tenant or cross-application data",
    [{ id: 'c1', artifactId: 'req-baseline', applicationId: 'app-nexaone', embedding: [1, 1] }],
    [{ id: 'req-baseline', applicationId: 'app-nexaone' }],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve("app-unauthorized", "test");
      if (res.retrievedArtifacts.length > 0) throw new Error("Returned data for unauthorized application");
  });

  await assertCase("Test 8: Enforcement of authorization during graph expansion",
    [{ id: 'c-attack', artifactId: 'req-attack', applicationId: 'app-nexaone', embedding: [1,1] }],
    [
      { id: 'req-attack', applicationId: 'app-nexaone', dependsOn: ['auth-violation'] },
      { id: 'auth-violation', applicationId: 'app-secret', isBaseline: true }
    ],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "test");
      const violation = res.retrievedArtifacts.some(a => a.id === 'auth-violation');
      if (violation) throw new Error("Graph expansion bypassed application boundaries and fetched auth-violation");
  });

  await assertCase("Test 9: Deduplication of evidence belonging to the same artifact",
    [
      { id: 'c1', artifactId: 'req-baseline', applicationId: 'app-nexaone', embedding: [1, 1] },
      { id: 'c8', artifactId: 'req-baseline', applicationId: 'app-nexaone', embedding: [1, 1] }
    ],
    [{ id: 'req-baseline', applicationId: 'app-nexaone' }],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "test");
      const counts = res.retrievedArtifacts.filter(a => a.id === 'req-baseline').length;
      if (counts > 1) throw new Error(`Found ${counts} instances of req-baseline, expected 1`);
  });

  await assertCase("Test 10: Preservation of existing semantic retrieval behavior",
    [{ id: 'c1', artifactId: 'req-baseline', applicationId: 'app-nexaone', embedding: [1, 1] }],
    [{ id: 'req-baseline', applicationId: 'app-nexaone' }],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "test");
      if (res.retrievedArtifacts.length === 0) throw new Error("Failed to retrieve chunks");
  });

  await assertCase("Test 11: Reverse graph expansion retrieves dependent artifacts (1-hop)", 
    [{ id: 'c1', artifactId: 'rule-inv-payable', applicationId: 'app-nexaone', embedding: [1, 1] }],
    [
      { id: 'rule-inv-payable', applicationId: 'app-nexaone' },
      { id: 'code-inv-svc', applicationId: 'app-nexaone', dependsOn: ['rule-inv-payable'] },
      { id: 'code-other-svc', applicationId: 'app-other', dependsOn: ['rule-inv-payable'] }, // cross-app isolation check
      { id: 'rule-unrelated', applicationId: 'app-nexaone' }
    ],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "test");
      const retrievedIds = res.retrievedArtifacts.map(a => a.id);
      if (!retrievedIds.includes('code-inv-svc')) throw new Error("Failed to reverse expand code-inv-svc");
      if (retrievedIds.includes('code-other-svc')) throw new Error("Cross-application isolation failed");
      if (retrievedIds.includes('rule-unrelated')) throw new Error("Retrieved unrelated artifact");
  });

  await assertCase("Test 12: Two-hop reverse expansion for impact analysis", 
    [{ id: 'c2', artifactId: 'req-inv-states', applicationId: 'app-nexaone', embedding: [1, 1] }],
    [
      { id: 'req-inv-states', applicationId: 'app-nexaone' },
      { id: 'rule-inv-payable', applicationId: 'app-nexaone', implements: ['req-inv-states'] },
      { id: 'code-inv-svc', applicationId: 'app-nexaone', dependsOn: ['rule-inv-payable'] },
      { id: 'code-other-app', applicationId: 'app-other', dependsOn: ['rule-inv-payable'] }
    ],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "What is affected by this?");
      const retrievedIds = res.retrievedArtifacts.map(a => a.id);
      if (!retrievedIds.includes('code-inv-svc')) throw new Error("Failed 2-hop reverse expansion");
      if (retrievedIds.includes('code-other-app')) throw new Error("Cross-application isolation failed on 2nd hop");
  });

  await assertCase("Test 13: Ordinary queries remain one-hop", 
    [{ id: 'c3', artifactId: 'req-inv-states', applicationId: 'app-nexaone', embedding: [1, 1] }],
    [
      { id: 'req-inv-states', applicationId: 'app-nexaone' },
      { id: 'rule-inv-payable', applicationId: 'app-nexaone', implements: ['req-inv-states'] },
      { id: 'code-inv-svc', applicationId: 'app-nexaone', dependsOn: ['rule-inv-payable'] }
    ],
    async () => {
      const res = await KnowledgeRetrievalService.retrieve(appId, "How does it work?");
      const retrievedIds = res.retrievedArtifacts.map(a => a.id);
      if (!retrievedIds.includes('rule-inv-payable')) throw new Error("Failed 1-hop reverse expansion");
      if (retrievedIds.includes('code-inv-svc')) throw new Error("Incorrectly performed 2-hop expansion for non-impact query");
  });

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
}

runTests().catch(console.error);
