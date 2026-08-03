import { describe, it, expect } from "vitest";
import { classifyDecisionGate, shouldCreateDecisionRoom, shouldPromptDecisionRoom } from "./langchainOrchestrator";

describe("classifyDecisionGate — immediate exclusions", () => {
  it("excludes pure informational questions starting with 'What is'", () => {
    const result = classifyDecisionGate("What is Veeva's market share in clinical trials?");
    expect(result.isDecision).toBe(false);
    expect(result.confidence).toBeLessThan(55);
  });

  it("excludes summary requests", () => {
    const result = classifyDecisionGate("Summarize the latest FDA guidance on AI in clinical trials");
    expect(result.isDecision).toBe(false);
  });

  it("excludes status questions", () => {
    const result = classifyDecisionGate("What is the current status of our Veeva partnership?");
    expect(result.isDecision).toBe(false);
  });
});

describe("classifyDecisionGate — structured output shape", () => {
  it("returns all required fields with correct types", () => {
    const result = classifyDecisionGate("Should we go with Veeva or Medidata?");
    expect(result).toHaveProperty("isDecision");
    expect(result).toHaveProperty("materiality");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("normalizedQuestion");
    expect(result).toHaveProperty("alternatives");
    expect(result).toHaveProperty("proposedOwner");
    expect(result).toHaveProperty("proposedDeadline");
    expect(result).toHaveProperty("rationale");
    expect(result).toHaveProperty("gateVersion");
    expect(["low", "medium", "high", "critical"]).toContain(result.materiality);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.alternatives)).toBe(true);
    expect(typeof result.rationale).toBe("string");
    expect(result.rationale.length).toBeGreaterThan(0);
  });
});

describe("classifyDecisionGate — high-materiality strategic decisions", () => {
  it("detects a high-materiality decision with all 5 signals present", () => {
    const result = classifyDecisionGate(
      "Should Biorce partner exclusively with Veeva or Medidata for our clinical workflow integration? " +
      "We need to decide by Q3 2026 to meet our Series B milestones. Pedro needs to approve."
    );
    expect(result.isDecision).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(55);
    expect(result.alternatives.length).toBeGreaterThan(0);
  });
});

describe("shouldCreateDecisionRoom — confidence threshold", () => {
  it("returns false for a low-confidence informational question", () => {
    expect(shouldCreateDecisionRoom("What is FDA?")).toBe(false);
  });

  it("returns false for a summary request", () => {
    expect(shouldCreateDecisionRoom("Summarize the Biorce Series A announcement")).toBe(false);
  });
});

describe("shouldPromptDecisionRoom — medium confidence", () => {
  it("returns false for a clearly informational question", () => {
    expect(shouldPromptDecisionRoom("What is Veeva?")).toBe(false);
  });
});
