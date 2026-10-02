import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeRetrievalService } from '../src/lib/intelligence/KnowledgeRetrievalService.ts';
import { TraceIQReasoningService } from '../src/lib/intelligence/TraceIQReasoningService.ts';

// 1. Fixed Evaluation Dataset
const SCENARIOS = [
  {
    id: "eval-001",
    scenario: "General application understanding",
    question: "How does the React catalog component work?",
    expectedConclusion: undefined,
    expectedArtifacts: ["code-prod-catalog"],
    failureConditions: ["forces a capabilityConclusion when it shouldn't"]
  },
  {
    id: "eval-002",
    scenario: "Six-month B2B eligibility feasibility",
    question: "Can we lower the B2B threshold to 6 months?",
    expectedConclusion: "proposed",
    expectedArtifacts: ["req-b2b-6mo", "def-b2b-comp"],
    failureConditions: ["describes the 6-month threshold as active or supported"]
  },
  {
    id: "eval-003",
    scenario: "Cross-client payment-routing comparison",
    question: "Compare payment routing for Client B and Client C.",
    expectedConclusion: "configurable", // or supported depending on model nuance, but let's check retrieval mostly
    expectedArtifacts: ["cfg-client-b", "cfg-client-c"],
    failureConditions: ["generalizes one client's routing to the other", "fails to retrieve both clients"]
  },
  {
    id: "eval-004",
    scenario: "Historical B2B rule",
    question: "What was the B2B threshold in release 3.1?",
    expectedConclusion: "unknown", // Historical, not currently supported baseline
    expectedArtifacts: ["req-b2b-stale", "rel-3.1"],
    failureConditions: ["treats the stale 3.1 rule as the current active behavior"]
  },
  {
    id: "eval-005",
    scenario: "Missing ownership information",
    question: "Who owns the onboarding approval workflow?",
    expectedConclusion: "unknown",
    expectedArtifacts: ["rule-approval"],
    failureConditions: ["invents an owner or team that doesn't exist in metadata"]
  },
  {
    id: "eval-006",
    scenario: "Version-specific capability validation",
    question: "What changed in release 3.5?",
    expectedConclusion: "supported",
    expectedArtifacts: ["rel-3.5"],
    failureConditions: ["cites changes from other releases"]
  },
  {
    id: "eval-007",
    scenario: "Insufficient evidence",
    question: "Does the system support quantum cryptography?",
    expectedConclusion: "unknown",
    expectedArtifacts: [],
    failureConditions: ["hallucinates a technical constraint or capability"]
  },
  {
    id: "eval-008",
    scenario: "Payment-rule dependency and impact analysis",
    question: "If I change the payable invoice rule, what is affected?",
    expectedConclusion: "supported", // The impact analysis itself is supported
    expectedArtifacts: ["rule-inv-payable", "code-inv-svc"],
    failureConditions: ["fails to traverse the dependsOn relationships"]
  }
];

async function runEvaluation() {
  console.log("--- Starting Live Intelligence Evaluation ---");
  
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.VERTEX_LOCATION) {
    console.warn("[WARNING] Running without explicit GOOGLE_APPLICATION_CREDENTIALS. Relying on ADC.");
  }

  // Initialize Firebase Admin (relies on ADC in production)
  try {
    admin.initializeApp({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'traceiq-ab468'
    });
  } catch (e: any) {
    if (e.code !== 'app/duplicate-app') throw e;
  }

  const appId = "app-nexaone";
  const report: any[] = [];
  let passed = 0;
  let failed = 0;

  for (const tc of SCENARIOS) {
    console.log(`\nEvaluating [${tc.id}]: ${tc.scenario}`);
    const result: any = {
      scenarioId: tc.id,
      question: tc.question,
      expectedConclusion: tc.expectedConclusion,
      expectedArtifacts: tc.expectedArtifacts,
      automatedChecks: {
        retrievalComplete: false,
        validConclusion: false,
        evidenceTraceability: false,
        noHallucinatedCitations: true
      },
      retrievedIds: [],
      actualConclusion: null,
      fullAnswer: "",
      error: null,
      humanReviewRequired: true
    };

    try {
      // 1. Live Retrieval
      const context = await KnowledgeRetrievalService.retrieve(appId, tc.question);
      const retrievedIds = context.retrievedArtifacts.map((a: any) => a.id);
      result.retrievedIds = retrievedIds;
      
      // Check Retrieval Completeness
      const missing = tc.expectedArtifacts.filter(id => !retrievedIds.includes(id));
      result.automatedChecks.retrievalComplete = missing.length === 0;
      if (missing.length > 0) {
         result.automatedChecks.retrievalMissing = missing;
      }

      // 2. Live Reasoning
      const reasoning = await TraceIQReasoningService.reason(tc.question, context);
      result.actualConclusion = reasoning.capabilityConclusion || undefined;
      result.fullAnswer = reasoning.answer;
      result.claims = reasoning.claims;

      // Check Conclusion Validity
      if (tc.expectedConclusion === undefined) {
        result.automatedChecks.validConclusion = (result.actualConclusion === undefined);
      } else {
        result.automatedChecks.validConclusion = (result.actualConclusion === tc.expectedConclusion);
      }

      // Check Evidence Traceability
      let traceabilityOk = true;
      if (reasoning.claims) {
        for (const claim of reasoning.claims) {
          if (claim.evidenceArtifactIds) {
            for (const id of claim.evidenceArtifactIds) {
              if (!retrievedIds.includes(id)) {
                traceabilityOk = false;
                result.automatedChecks.noHallucinatedCitations = false;
              }
            }
          }
        }
      }
      result.automatedChecks.evidenceTraceability = traceabilityOk;

      const allChecksPass = result.automatedChecks.retrievalComplete && 
                            result.automatedChecks.validConclusion && 
                            result.automatedChecks.evidenceTraceability && 
                            result.automatedChecks.noHallucinatedCitations;
      
      if (allChecksPass) passed++; else failed++;

    } catch (e: any) {
      console.error(`[ERROR] ${tc.id} failed during execution: ${e.message}`);
      result.error = e.message;
      failed++;
    }

    report.push(result);
  }

  // Write report
  const reportDir = path.join(process.cwd(), 'demo-data');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);
  const reportPath = path.join(reportDir, 'evaluation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\nEvaluation complete. Results written to ${reportPath}`);
  console.log(`Automated Checks: ${passed} fully passed, ${failed} failed or errored.`);
  console.log("NOTE: All responses require human review to validate qualitative constraints (e.g. tone, hallucinated rules).");
}

runEvaluation().catch(console.error);
