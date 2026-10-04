import * as fs from 'fs';
import * as path from 'path';
import { runEvaluation, SCENARIOS } from './evaluate-intelligence.ts';
import { KnowledgeRetrievalService } from '../src/lib/intelligence/KnowledgeRetrievalService.ts';
import { TraceIQReasoningService } from '../src/lib/intelligence/TraceIQReasoningService.ts';

let mockConfig = {
  eval008_retrievalMissing: false,
  eval008_missingComponent: false,
  eval008_unsupportedClaims: false,
  eval002_incorrectConclusion: false
};

// Mock dependencies to run evaluation completely offline and deterministically
KnowledgeRetrievalService.retrieve = async (_appId: string, query: string) => {
  const tc = SCENARIOS.find(s => s.question === query);
  if (!tc) return { retrievedArtifacts: [] } as any;

  if (tc.id === 'eval-008' && mockConfig.eval008_retrievalMissing) {
    // Missing code-inv-svc
    return { retrievedArtifacts: [{ id: 'rule-inv-payable' }] } as any;
  }

  return {
    retrievedArtifacts: tc.expectedArtifacts.map(id => ({ id }))
  } as any;
};

TraceIQReasoningService.reason = async (query: string, _context: any) => {
  const tc = SCENARIOS.find(s => s.question === query);
  if (!tc) return {} as any;

  if (tc.id === 'eval-002' && mockConfig.eval002_incorrectConclusion) {
    return {
      answer: "Generic answer",
      capabilityConclusion: "supported",
      claims: [{ statement: "Generic", evidenceArtifactIds: tc.expectedArtifacts }]
    } as any;
  }

  if (tc.id === 'eval-004') {
    return {
      answer: "Historical B2B threshold was...",
      capabilityConclusion: undefined,
      claims: [{ statement: "Historical", evidenceArtifactIds: tc.expectedArtifacts }]
    } as any;
  }

  if (tc.id === 'eval-001') {
    return {
      answer: "React component works by...",
      capabilityConclusion: undefined,
      claims: [{ statement: "UI", evidenceArtifactIds: tc.expectedArtifacts }]
    } as any;
  }

  if (tc.id === 'eval-008') {
    if (mockConfig.eval008_missingComponent) {
      return {
        answer: "It affects some downstream rule.",
        capabilityConclusion: undefined,
        claims: [{ statement: "Impact", evidenceArtifactIds: ["rule-inv-payable"] }]
      } as any;
    }
    if (mockConfig.eval008_unsupportedClaims) {
      return {
        answer: "It affects code-inv-svc.",
        capabilityConclusion: undefined,
        claims: [{ statement: "Impact", evidenceArtifactIds: ['hallucinated-doc'] }]
      } as any;
    }
    // Success scenario
    return {
      answer: "It affects code-inv-svc.",
      capabilityConclusion: undefined,
      claims: [{ statement: "Impact", evidenceArtifactIds: tc.expectedArtifacts }]
    } as any;
  }

  return {
    answer: "Generic answer",
    capabilityConclusion: tc.expectedConclusion !== null ? tc.expectedConclusion : undefined,
    claims: [{ statement: "Generic", evidenceArtifactIds: tc.expectedArtifacts }]
  } as any;
};

async function runAndGetReport() {
  const originalLog = console.log;
  console.log = () => {};
  await runEvaluation();
  console.log = originalLog;

  const reportPath = path.join(process.cwd(), 'demo-data', 'evaluation-report.json');
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

async function testEvaluation() {
  console.log("--- Starting Evaluation Logic Tests ---");
  let passed = 0;
  let failed = 0;

  try {
    const report = await runAndGetReport();

    // A. Evaluation serialization tests
    console.log("\n[TEST] Null expected and actual conclusions remain visible in JSON");
    const eval001 = report.find((r: any) => r.scenarioId === 'eval-001');
    if (eval001.expectedConclusion !== null) throw new Error("eval-001 expectedConclusion is not null in JSON");
    if (eval001.actualConclusion !== null) throw new Error("eval-001 actualConclusion is not null in JSON");
    passed++;

    console.log("[TEST] Not-applicable conclusions do not inflate the capability-validation pass count");
    const nonCapScenarios = ['eval-001', 'eval-003', 'eval-004', 'eval-005', 'eval-006', 'eval-008'];
    for (const id of nonCapScenarios) {
      const result = report.find((r: any) => r.scenarioId === id);
      if (result.automatedChecks.validConclusion !== "not_applicable") {
        throw new Error(`${id} validConclusion should be 'not_applicable'`);
      }
    }
    passed++;

    // B. Historical scenario tests
    console.log("[TEST] eval-004 passes its evidence requirements without requiring a capability conclusion");
    const eval004 = report.find((r: any) => r.scenarioId === 'eval-004');
    if (eval004.expectedConclusion !== null) throw new Error("eval-004 expectedConclusion must be null");
    if (!eval004.automatedChecks.retrievalComplete) throw new Error("eval-004 retrievalComplete must be true");
    if (eval004.automatedChecks.validConclusion !== "not_applicable") throw new Error("eval-004 validConclusion must be 'not_applicable'");
    passed++;

    // C. Capability evaluation tests
    console.log("\n--- Capability Evaluation (eval-002) Tests ---");
    console.log("[TEST] eval-002: expected 'proposed' and passes when actual is 'proposed'");
    const eval002 = report.find((r: any) => r.scenarioId === 'eval-002');
    if (eval002.expectedConclusion !== "proposed") throw new Error("eval-002 expectedConclusion must be 'proposed'");
    if (eval002.actualConclusion !== "proposed") throw new Error("eval-002 actualConclusion should mock 'proposed'");
    if (eval002.automatedChecks.validConclusion !== true) throw new Error("eval-002 validConclusion must be true for matching 'proposed'");
    passed++;

    console.log("[TEST] eval-002: fails when actual is an incorrect conclusion");
    mockConfig.eval002_incorrectConclusion = true;
    const reportIncorrectEval002 = await runAndGetReport();
    if (reportIncorrectEval002.find((r: any) => r.scenarioId === 'eval-002').automatedChecks.validConclusion === true) {
      throw new Error("validConclusion should be false if conclusion is incorrect");
    }
    mockConfig.eval002_incorrectConclusion = false;
    passed++;

    // D. Impact analysis tests
    console.log("\n--- Impact Analysis (eval-008) Tests ---");
    console.log("[TEST] Successful validation: retrieves dependencies and identifies component");
    const eval008 = report.find((r: any) => r.scenarioId === 'eval-008');
    if (eval008.expectedConclusion !== null) throw new Error("eval-008 expectedConclusion must be null");
    if (eval008.automatedChecks.validConclusion !== "not_applicable") throw new Error("eval-008 validConclusion must be 'not_applicable'");
    if (!eval008.automatedChecks.validImpactAnalysis) throw new Error("eval-008 validImpactAnalysis must be true");
    passed++;

    console.log("[TEST] Missing dependencies fails validImpactAnalysis");
    mockConfig.eval008_retrievalMissing = true;
    const reportMissing = await runAndGetReport();
    if (reportMissing.find((r: any) => r.scenarioId === 'eval-008').automatedChecks.validImpactAnalysis) {
      throw new Error("validImpactAnalysis should fail if dependencies are missing");
    }
    mockConfig.eval008_retrievalMissing = false;
    passed++;

    console.log("[TEST] Missing component identification fails validImpactAnalysis");
    mockConfig.eval008_missingComponent = true;
    const reportNoComponent = await runAndGetReport();
    if (reportNoComponent.find((r: any) => r.scenarioId === 'eval-008').automatedChecks.validImpactAnalysis) {
      throw new Error("validImpactAnalysis should fail if component is not identified");
    }
    mockConfig.eval008_missingComponent = false;
    passed++;

    console.log("[TEST] Unsupported impact claims fails validImpactAnalysis");
    mockConfig.eval008_unsupportedClaims = true;
    const reportUnsupported = await runAndGetReport();
    if (reportUnsupported.find((r: any) => r.scenarioId === 'eval-008').automatedChecks.validImpactAnalysis) {
      throw new Error("validImpactAnalysis should fail if evidence is unsupported/hallucinated");
    }
    mockConfig.eval008_unsupportedClaims = false;
    passed++;

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);

  } catch (e: any) {
    console.error(e);
    failed++;
    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
    process.exit(1);
  }
}

testEvaluation().catch(console.error);
