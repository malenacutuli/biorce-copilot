import { describe, it, expect } from "vitest";
import {
  classifyDecisionGate,
  shouldCreateDecisionRoom,
  shouldPromptDecisionRoom,
} from "./langchainOrchestrator";

// ─── Immediate exclusions (no decision signal) ────────────────────────────────
describe("classifyDecisionGate — immediate exclusions", () => {
  it("excludes 'What is CDISC USDM?' — pure definitional", () => {
    const r = classifyDecisionGate("What is CDISC USDM?");
    expect(r.isDecision).toBe(false);
    expect(r.confidence).toBeLessThan(55);
  });

  it("excludes 'Summarize the Biorce Series A announcement' — pure summary", () => {
    const r = classifyDecisionGate("Summarize the Biorce Series A announcement");
    expect(r.isDecision).toBe(false);
  });

  it("excludes 'What is the current status of our Veeva partnership?' — status check", () => {
    const r = classifyDecisionGate("What is the current status of our Veeva partnership?");
    expect(r.isDecision).toBe(false);
  });

  it("excludes 'Compare Veeva and Medidata' — pure comparison, no decision verb", () => {
    const r = classifyDecisionGate("Compare Veeva and Medidata");
    // No decision verb, no owner, no deadline — should not auto-create
    // May score some signals but should not reach isDecision=true with high confidence
    expect(shouldCreateDecisionRoom("Compare Veeva and Medidata")).toBe(false);
  });
});

// ─── Adversarial: decision-first scoring must NOT exclude these ───────────────
describe("classifyDecisionGate — adversarial decision candidates", () => {
  it("'How does choosing Veeva over Medidata affect our distribution strategy?' — IS a decision candidate", () => {
    const r = classifyDecisionGate(
      "How does choosing Veeva over Medidata affect our distribution strategy?"
    );
    // "choosing" + "or" (Veeva over Medidata) + consequences (distribution strategy)
    expect(r.isDecision).toBe(true);
    expect(r.alternatives.length).toBeGreaterThan(0);
  });

  it("'Tell me whether we should proceed with Tufts.' — IS a decision candidate", () => {
    const r = classifyDecisionGate(
      "Tell me whether we should proceed with Tufts."
    );
    // "whether" + "should" + "proceed with" — strong decision signals
    expect(r.isDecision).toBe(true);
  });

  it("'Summarize the evidence and recommend whether to sign.' — IS a decision candidate", () => {
    const r = classifyDecisionGate(
      "Summarize the evidence and recommend whether to sign."
    );
    // "recommend whether" + "sign" — decision signals override summarize prefix
    expect(r.isDecision).toBe(true);
  });

  it("'What is the best execution-data partner to prioritize?' — IS a decision candidate", () => {
    const r = classifyDecisionGate(
      "What is the best execution-data partner to prioritize?"
    );
    // "best X to Y" + "prioritize" — selection decision
    expect(r.isDecision).toBe(true);
  });
});

// ─── Structured output shape ──────────────────────────────────────────────────
describe("classifyDecisionGate — structured output shape", () => {
  it("returns all required fields with correct types", () => {
    const r = classifyDecisionGate("Should we go with Veeva or Medidata?");
    expect(r).toHaveProperty("isDecision");
    expect(r).toHaveProperty("materiality");
    expect(r).toHaveProperty("confidence");
    expect(r).toHaveProperty("normalizedQuestion");
    expect(r).toHaveProperty("alternatives");
    expect(r).toHaveProperty("proposedOwner");
    expect(r).toHaveProperty("proposedDeadline");
    expect(r).toHaveProperty("rationale");
    expect(r).toHaveProperty("gateVersion");
    expect(["low", "medium", "high", "critical"]).toContain(r.materiality);
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(100);
    expect(Array.isArray(r.alternatives)).toBe(true);
    expect(typeof r.rationale).toBe("string");
    expect(r.rationale.length).toBeGreaterThan(0);
    expect(r.gateVersion).toContain("v1.3");
  });
});

// ─── Regression: 8-case spec from design review ──────────────────────────────
describe("classifyDecisionGate — spec regression cases", () => {
  it("'What is Veeva, and should we integrate with it?' — IS a decision candidate", () => {
    const r = classifyDecisionGate("What is Veeva, and should we integrate with it?");
    // "should we" overrides the "what is" informational prefix
    expect(r.isDecision).toBe(true);
  });

  it("'Summarize our Veeva notes.' — immediate exclusion", () => {
    const r = classifyDecisionGate("Summarize our Veeva notes.");
    expect(r.isDecision).toBe(false);
    expect(r.confidence).toBe(0);
  });
});

// ─── High-materiality strategic decisions ────────────────────────────────────
describe("classifyDecisionGate — high-materiality decisions", () => {
  it("detects a high-materiality decision with all 5 signals", () => {
    const r = classifyDecisionGate(
      "Should Biorce partner exclusively with Veeva or Medidata for our clinical workflow integration? " +
      "We need to decide by Q3 2026 to meet our Series B milestones. Pedro needs to approve."
    );
    expect(r.isDecision).toBe(true);
    expect(r.confidence).toBeGreaterThanOrEqual(55);
    expect(r.alternatives.length).toBeGreaterThan(0);
  });
});

// ─── Confidence threshold helpers ────────────────────────────────────────────
describe("shouldCreateDecisionRoom — confidence threshold", () => {
  it("returns false for a low-confidence informational question", () => {
    expect(shouldCreateDecisionRoom("What is FDA?")).toBe(false);
  });

  it("returns false for a pure summary request", () => {
    expect(shouldCreateDecisionRoom("Summarize the Biorce Series A announcement")).toBe(false);
  });
});

describe("shouldPromptDecisionRoom — medium confidence", () => {
  it("returns false for a clearly informational question", () => {
    expect(shouldPromptDecisionRoom("What is Veeva?")).toBe(false);
  });
});
