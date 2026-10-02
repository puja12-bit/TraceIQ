import { TraceIQReasoningService } from '../src/lib/intelligence/TraceIQReasoningService.ts';

async function runTests() {
  console.log("--- Starting Isolated Reasoning Tests ---");

  let passed = 0;
  let failed = 0;
  
  async function assertCase(name: string, question: string, mockResponsePayload: any, validateFn: (parsedBody: any) => void) {
    // We mock the fetch function so it doesn't hit Vertex AI
    const mockFetch = async (_url: string, options: any) => {
      // 1. Extract and validate the prompt payload we are sending to the LLM
      const body = JSON.parse(options.body);
      const promptText = body.contents[0].parts[0].text;
      
      const schema = options.body ? JSON.parse(options.body).generationConfig.responseSchema : {};
      
      // Ensure required schema properties exist
      if (!schema.properties.capabilityConclusion) {
        throw new Error("JSON Schema missing capabilityConclusion definition");
      }
      if (!promptText.includes("Never present a proposed feature as implemented")) {
        throw new Error("Prompt missing proposed feature constraint");
      }
      
      // Allow custom validation of the prompt based on the test case
      validateFn(body);

      // 2. Return the simulated Gemini response
      return {
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: JSON.stringify(mockResponsePayload) }] }
          }]
        })
      };
    };

    const mockAuthClient = {
      getAccessToken: async () => ({ token: "mock-token" })
    };

    TraceIQReasoningService.setDependencies(mockAuthClient, mockFetch);
    
    try {
      const res = await TraceIQReasoningService.reason(question, { mockContext: true });
      // Validate that the reasoning service parsed it correctly and returned it
      if (res.capabilityConclusion !== mockResponsePayload.capabilityConclusion) {
        throw new Error(`Expected conclusion ${mockResponsePayload.capabilityConclusion}, got ${res.capabilityConclusion}`);
      }
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`[FAIL] ${name}\n       ${e.message}`);
      failed++;
    }
  }

  // 1. A baseline capability supported by explicit evidence.
  await assertCase("Test 1: Baseline capability supported", 
    "Is receipt splitting supported?",
    {
      answer: "Conclusion: Supported.\\nScope: Baseline.\\nEvidence: System supports receipt splitting (req-receipt-split).",
      capabilityConclusion: "supported"
    },
    () => {}
  );

  // 2. A client-specific override that must not be generalized to other clients.
  await assertCase("Test 2: Client-specific override", 
    "Does Client A have B2B enabled?",
    {
      answer: "Conclusion: Configurable.\\nScope: Client A.\\nEvidence: B2B enabled for Client A (cfg-client-a).",
      capabilityConclusion: "configurable"
    },
    () => {}
  );

  // 3. A proposed feature that must not be described as implemented.
  await assertCase("Test 3: Proposed feature identified", 
    "Is the 6-month threshold active?",
    {
      answer: "Conclusion: Proposed.\\nScope: Baseline.\\nEvidence: Reduced threshold is proposed (req-b2b-6mo).",
      capabilityConclusion: "proposed"
    },
    () => {}
  );

  // 4. A deprecated artifact that must be identified as historical.
  await assertCase("Test 4: Deprecated historical behavior", 
    "What was the old legacy B2B threshold?",
    {
      answer: "Conclusion: Unknown / Historical.\\nScope: Baseline v3.1.\\nEvidence: It was 12 months (req-b2b-stale).",
      capabilityConclusion: "unknown" // Historical, not currently supported
    },
    () => {}
  );

  // 5. A capability with insufficient evidence.
  await assertCase("Test 5: Insufficient evidence", 
    "Does it support quantum cryptography?",
    {
      answer: "Conclusion: Unknown.\\nLimitations: No evidence found.",
      capabilityConclusion: "unknown"
    },
    () => {}
  );

  // 6. Conflicting evidence from two artifacts.
  await assertCase("Test 6: Conflicting evidence", 
    "What is the notification logic?",
    {
      answer: "Conclusion: Supported but conflicts exist.\\nLimitations: Spam defect contradicts notification rule (def-notif-01).",
      capabilityConclusion: "supported",
      conflicts: [{ artifactIds: ["def-notif-01", "rule-notif-elig"], explanation: "Defect shows rule is ignored." }]
    },
    () => {}
  );

  // 7. A capability requiring configuration or validation.
  await assertCase("Test 7: Requires configuration", 
    "Can we route payments by company code?",
    {
      answer: "Conclusion: Configurable.\\nConditions: Client config determines routing.",
      capabilityConclusion: "configurable"
    },
    () => {}
  );

  // 8. A request to identify an owner when ownership metadata is missing.
  await assertCase("Test 8: Unknown ownership metadata", 
    "Who owns onboarding approvals?",
    {
      answer: "Conclusion: Unknown.\\nLimitations: No ownership metadata provided.",
      capabilityConclusion: "unknown"
    },
    () => {}
  );

  // 9. A question involving a specific version.
  await assertCase("Test 9: Specific version context", 
    "What changed in 3.1?",
    {
      answer: "Conclusion: Supported.\\nScope: Version 3.1.",
      capabilityConclusion: "supported"
    },
    () => {}
  );

  // 10. A general explanatory question that should not be forced into a capability verdict.
  await assertCase("Test 10: General explanatory question", 
    "How does the React catalog component work?",
    {
      answer: "It filters products using b2b eligibility logic.",
      // no capabilityConclusion provided by model
    },
    (body) => {
      // Prompt should instruct the model NOT to force a capability conclusion
      const text = body.contents[0].parts[0].text;
      if (!text.includes("If the question is about feature feasibility")) {
        throw new Error("Missing conditional instruction for capabilityConclusion");
      }
    }
  );

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
}

runTests().catch(console.error);
