/**
 * Integration tests for decisionRooms.confirmCandidate
 *
 * Uses the new server-issued token flow:
 * 1. Call issueDecisionRoomCandidate() to get a raw token
 * 2. Pass that token to confirmCandidate
 *
 * Security properties verified:
 * - Gate metadata comes from the server-stored candidate (not from client input)
 * - roomSource is "user_confirmed"
 * - initiatedBy matches the token's userOpenId
 * - Expired tokens are rejected
 * - Already-consumed tokens return idempotent result
 * - Approved/closed rooms cannot receive add_evidence
 * - User cannot confirm another user's candidate
 */
import { describe, it, expect, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { issueDecisionRoomCandidate, getDecisionRoomById } from "./db";

const TEST_USER_OPEN_ID = "test-user-confirm-candidate";
const TEST_USER_OPEN_ID_2 = "test-user-confirm-candidate-2";

function createCtx(openId: string): TrpcContext {
  return {
    user: {
      id: 999,
      openId,
      email: "test@biorce.ai",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

const caller = appRouter.createCaller(createCtx(TEST_USER_OPEN_ID));
const caller2 = appRouter.createCaller(createCtx(TEST_USER_OPEN_ID_2));

const BASE_PAYLOAD = {
  question: "Should we proceed with the Medidata co-development proposal?",
  normalizedQuestion: "Should we proceed with the Medidata co-development proposal?",
  gateConfidence: 75,
  gateMateriality: "high" as const,
  gateRationale: "Material commercial commitment with two alternatives",
  gateVersion: "v1.3-precedence",
  gateAlternatives: ["Proceed", "Decline"],
  gateProposedOwner: "Pedro Coelho",
  gateProposedDeadline: null,
  duplicateRoomId: null,
  duplicateSimilarity: null,
  duplicateStatus: null,
  duplicateQuestion: null,
  copilotRunId: null,
};

const createdRoomIds: number[] = [];

afterEach(async () => {
  if (createdRoomIds.length === 0) return;
  try {
    const { getDb } = await import("./db");
    const { decisionRooms } = await import("../drizzle/schema");
    const { inArray } = await import("drizzle-orm");
    const db = await getDb();
    if (db) {
      await db.delete(decisionRooms).where(inArray(decisionRooms.id, [...createdRoomIds]));
    }
  } catch { /* ignore cleanup errors */ }
  createdRoomIds.length = 0;
});

describe("decisionRooms.confirmCandidate", () => {
  it("creates a new Decision Room and returns created:true", async () => {
    const token = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, BASE_PAYLOAD);
    const result = await caller.decisionRooms.confirmCandidate({ candidateToken: token });
    expect(result.created).toBe(true);
    expect(result.action).toBe("created");
    expect(typeof result.roomId).toBe("number");
    expect(result.roomId).toBeGreaterThan(0);
    createdRoomIds.push(result.roomId);
  });

  it("persists roomSource as user_confirmed", async () => {
    const token = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should Biorce sign the Tufts CSDD partnership agreement?",
      normalizedQuestion: "Should Biorce sign the Tufts CSDD partnership agreement?",
    });
    const result = await caller.decisionRooms.confirmCandidate({ candidateToken: token });
    createdRoomIds.push(result.roomId);
    const room = await getDecisionRoomById(result.roomId);
    expect(room?.roomSource).toBe("user_confirmed");
  });

  it("persists gate metadata from the server-stored candidate (not from client)", async () => {
    const token = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we prioritize Care Access over Velocity Clinical?",
      normalizedQuestion: "Should we prioritize Care Access over Velocity Clinical?",
      gateConfidence: 82,
      gateMateriality: "critical",
      gateRationale: "Critical partner selection with material revenue impact",
    });
    const result = await caller.decisionRooms.confirmCandidate({ candidateToken: token });
    createdRoomIds.push(result.roomId);
    const room = await getDecisionRoomById(result.roomId);
    expect(room?.gateConfidence).toBe(82);
    expect(room?.gateMateriality).toBe("critical");
    expect(room?.gateRationale).toBe("Critical partner selection with material revenue impact");
    expect(room?.gateVersion).toBe("v1.3-precedence");
  });

  it("persists initiatedBy as the authenticated user openId", async () => {
    const token = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we enter the EU market before closing Series B?",
      normalizedQuestion: "Should we enter the EU market before closing Series B?",
    });
    const result = await caller.decisionRooms.confirmCandidate({ candidateToken: token });
    createdRoomIds.push(result.roomId);
    const room = await getDecisionRoomById(result.roomId);
    expect(room?.initiatedBy).toBe(TEST_USER_OPEN_ID);
  });

  it("executive decision remains empty after confirmation", async () => {
    const token = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we approve the Medidata Series B co-investment?",
      normalizedQuestion: "Should we approve the Medidata Series B co-investment?",
    });
    const result = await caller.decisionRooms.confirmCandidate({ candidateToken: token });
    createdRoomIds.push(result.roomId);
    const room = await getDecisionRoomById(result.roomId);
    expect(room?.executiveDecision).toBeNull();
    expect(room?.decisionMadeAt).toBeNull();
  });

  it("candidate is consumed after confirmation — idempotent retry returns same room", async () => {
    const token = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we renew the Veeva contract for another 3 years?",
      normalizedQuestion: "Should we renew the Veeva contract for another 3 years?",
    });
    const first = await caller.decisionRooms.confirmCandidate({ candidateToken: token });
    expect(first.created).toBe(true);
    createdRoomIds.push(first.roomId);
    const second = await caller.decisionRooms.confirmCandidate({ candidateToken: token });
    expect(second.created).toBe(false);
    expect(second.action).toBe("idempotent");
    expect(second.roomId).toBe(first.roomId);
  });

  it("throws FORBIDDEN when a different user tries to confirm another user's candidate", async () => {
    const token = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we exit the Novo Nordisk partnership?",
      normalizedQuestion: "Should we exit the Novo Nordisk partnership?",
    });
    await expect(
      caller2.decisionRooms.confirmCandidate({ candidateToken: token })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws BAD_REQUEST for an expired candidate", async () => {
    const token = await issueDecisionRoomCandidate(
      TEST_USER_OPEN_ID,
      {
        ...BASE_PAYLOAD,
        question: "Should we accept the CDISC USDM working group invitation?",
        normalizedQuestion: "Should we accept the CDISC USDM working group invitation?",
      },
      1 // 1ms TTL — expires immediately
    );
    await new Promise(r => setTimeout(r, 5));
    await expect(
      caller.decisionRooms.confirmCandidate({ candidateToken: token })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("open_existing action returns the duplicate room id without creating a new room", async () => {
    const token1 = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we sign the TransCelerate data-sharing agreement?",
      normalizedQuestion: "Should we sign the TransCelerate data-sharing agreement?",
    });
    const seed = await caller.decisionRooms.confirmCandidate({ candidateToken: token1 });
    expect(seed.created).toBe(true);
    createdRoomIds.push(seed.roomId);

    const token2 = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we sign the TransCelerate data-sharing agreement?",
      normalizedQuestion: "Should we sign the TransCelerate data-sharing agreement?",
      duplicateRoomId: seed.roomId,
      duplicateSimilarity: 0.9,
      duplicateStatus: "open",
      duplicateQuestion: "Should we sign the TransCelerate data-sharing agreement?",
    });
    const result = await caller.decisionRooms.confirmCandidate({
      candidateToken: token2,
      duplicateAction: "open_existing",
    });
    expect(result.roomId).toBe(seed.roomId);
    expect(result.created).toBe(false);
    expect(result.action).toBe("open_existing");
  });

  it("throws FORBIDDEN when trying to add_evidence to an approved room", async () => {
    const token1 = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we renew the Veeva contract for 5 years?",
      normalizedQuestion: "Should we renew the Veeva contract for 5 years?",
    });
    const seed = await caller.decisionRooms.confirmCandidate({ candidateToken: token1 });
    createdRoomIds.push(seed.roomId);
    await caller.decisionRooms.approve({ id: seed.roomId, decision: "approved", executiveNote: "Approved" });

    const token2 = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Additional evidence for Veeva contract.",
      normalizedQuestion: "Additional evidence for Veeva contract.",
      duplicateRoomId: seed.roomId,
      duplicateSimilarity: 0.85,
      duplicateStatus: "approved",
      duplicateQuestion: "Should we renew the Veeva contract for 5 years?",
    });
    await expect(
      caller.decisionRooms.confirmCandidate({
        candidateToken: token2,
        duplicateAction: "add_evidence",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("create_separate action creates a new room even when a duplicate exists", async () => {
    // Seed an existing room
    const token1 = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we integrate with Medidata Rave for Phase III?",
      normalizedQuestion: "Should we integrate with Medidata Rave for Phase III?",
    });
    const seed = await caller.decisionRooms.confirmCandidate({ candidateToken: token1 });
    expect(seed.created).toBe(true);
    createdRoomIds.push(seed.roomId);

    // Issue a second candidate pointing to the same room as a duplicate
    const token2 = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we integrate with Medidata Rave for Phase III?",
      normalizedQuestion: "Should we integrate with Medidata Rave for Phase III?",
      duplicateRoomId: seed.roomId,
      duplicateSimilarity: 0.95,
      duplicateStatus: "open",
      duplicateQuestion: "Should we integrate with Medidata Rave for Phase III?",
    });
    const result = await caller.decisionRooms.confirmCandidate({
      candidateToken: token2,
      duplicateAction: "create_separate",
    });
    expect(result.created).toBe(true);
    expect(result.action).toBe("created");
    // A new distinct room was created
    expect(result.roomId).not.toBe(seed.roomId);
    createdRoomIds.push(result.roomId);
  });

  it("client cannot override gate metadata — server payload is authoritative", async () => {
    // Issue a candidate with specific gate metadata
    const token = await issueDecisionRoomCandidate(TEST_USER_OPEN_ID, {
      ...BASE_PAYLOAD,
      question: "Should we accept the Pfizer co-development offer?",
      normalizedQuestion: "Should we accept the Pfizer co-development offer?",
      gateConfidence: 77,
      gateMateriality: "high",
      gateRationale: "Server-stored rationale",
    });
    // The confirmCandidate procedure only accepts { candidateToken, duplicateAction }
    // Any attempt to pass extra fields is rejected by Zod schema validation
    const result = await caller.decisionRooms.confirmCandidate({ candidateToken: token });
    createdRoomIds.push(result.roomId);
    const room = await getDecisionRoomById(result.roomId);
    // Verify the room uses the server-stored values, not any client-supplied override
    expect(room?.gateConfidence).toBe(77);
    expect(room?.gateMateriality).toBe("high");
    expect(room?.gateRationale).toBe("Server-stored rationale");
  });
});
