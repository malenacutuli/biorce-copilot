import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { sdk } from "./_core/sdk";
import { invokeLLM } from "./_core/llm";
import {
  createAlert,
  getKnowledgeItems,
  getRegulatoryItems,
  getDiscrepancies,
  getCiEvents,
  getStalePartners,
  acquireJobExecution,
  completeJobExecution,
  failJobExecution,
  countConsecutiveFailures,
} from "./db";
import { notifyOwner } from "./_core/notification";

// ─── Shared service ───────────────────────────────────────────────────────────
// Called directly by the Heartbeat HTTP handler (cron) AND by the adminProcedure
// (manual "Run Now"). No internal HTTP fetch, no cookie forwarding, no IP checks.

export interface DailyPartnershipPulseParams {
  /** "cron" | "user:<userId>" | "user:<openId>:forced" */
  triggeredBy: string;
  /** When true, bypasses the idempotency guard (admin forced rerun). */
  force?: boolean;
}

export interface DailyPartnershipPulseResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  staleCount?: number;
  alertsCreated?: number;
  priorityCount?: number;
  durationMs?: number;
  executionId?: number | null;
}

/**
 * Core logic for the daily-partnership-pulse job.
 * Detects stale partners (no activity in 14+ days) and creates an LLM-generated
 * nudge alert. Idempotent: one run per UTC calendar date unless force=true.
 *
 * IMPORTANT: This function must never log prompts that contain confidential
 * partner names, deal economics, or credentials. Partner names appear only in
 * the LLM prompt body (not in execution logs or error messages).
 */
export async function executeDailyPartnershipPulse(
  params: DailyPartnershipPulseParams
): Promise<DailyPartnershipPulseResult> {
  const JOB_NAME = "daily-partnership-pulse";
  const startedAt = Date.now();

  // ── Idempotency key: one run per UTC calendar date ────────────────────────
  const utcDate = new Date().toISOString().slice(0, 10); // "2026-08-04"
  const idempotencyKey = params.force
    ? `${JOB_NAME}:${utcDate}:forced:${nanoid(10)}` // nanoid eliminates same-millisecond collision risk
    : `${JOB_NAME}:${utcDate}`;

  // ── Acquire execution lock (idempotency + concurrency guard) ──────────────
  let execId: number | null;
  try {
    execId = await acquireJobExecution({
      jobName: JOB_NAME,
      idempotencyKey,
      triggeredBy: params.triggeredBy,
      force: params.force,
    });
  } catch (err: any) {
    console.error(`[${JOB_NAME}] Failed to acquire execution lock:`, err.message);
    throw new Error(`lock-failed: ${err.message}`);
  }

  if (execId === null) {
    // Duplicate run — idempotency guard fired
    return {
      ok: true,
      skipped: true,
      reason: `Already ran today (${utcDate}). Use force=true to override.`,
    };
  }

  // ── Main logic ────────────────────────────────────────────────────────────
  try {
    const stalePartners = await getStalePartners(14);
    const recordsRead = stalePartners.length;

    if (stalePartners.length === 0) {
      console.log(`[${JOB_NAME}] No stale partners — pipeline is healthy.`);
      await completeJobExecution(execId, {
        recordsRead: 0,
        recordsWritten: 0,
        alertsCreated: 0,
        durationMs: Date.now() - startedAt,
      });
      return { ok: true, staleCount: 0, alertsCreated: 0, executionId: execId };
    }

    console.log(`[${JOB_NAME}] ${stalePartners.length} stale partners found. Generating nudge alert...`);

    // NOTE: Partner names are passed to the LLM but are NOT logged here to avoid
    // confidential data appearing in execution logs or error messages.
    const partnerList = stalePartners
      .map(p => `- [${p.tier}] ${p.name} (stage: ${p.stage})${p.nextAction ? ` — next action: ${p.nextAction}` : ""}`)
      .join("\n");

    const llmResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are the Biorce Partnership Intelligence Agent. Generate concise, action-oriented nudge alerts for stale partnership relationships.
For each partner, write one sentence: why this relationship needs attention today and the single most important next action.
Format: one bullet per partner. Be direct, specific, and commercially minded. Max 200 words total.`,
        },
        {
          role: "user",
          content: `These partners have had no logged activity in 14+ days. Generate nudge alerts:\n\n${partnerList}`,
        },
      ],
    });

    const rawContent = llmResponse.choices?.[0]?.message?.content;
    const nudgeBody =
      typeof rawContent === "string"
        ? rawContent
        : "Partnership pulse check: review stale partners.";

    const today = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const priorityCount = stalePartners.filter(
      p => p.tier === "P0" || p.tier === "P1"
    ).length;

    await createAlert({
      title: `Partnership Pulse — ${stalePartners.length} Stale Relationships (${priorityCount} Priority) — ${today}`,
      body: nudgeBody,
      type: "partnership",
      severity: priorityCount > 0 ? "high" : "medium",
      isRead: false,
      sourceTable: "partners",
      sourceId: null,
    });

    const durationMs = Date.now() - startedAt;
    await completeJobExecution(execId, {
      recordsRead,
      recordsWritten: 1, // one alert record created
      alertsCreated: 1,
      durationMs,
    });

    console.log(
      `[${JOB_NAME}] Done. staleCount=${stalePartners.length}, priorityCount=${priorityCount}, durationMs=${durationMs}, executionId=${execId}`
    );
    return {
      ok: true,
      staleCount: stalePartners.length,
      alertsCreated: 1,
      priorityCount,
      durationMs,
      executionId: execId,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startedAt;
    // Log error message only — do NOT log the partner list or LLM prompt
    console.error(`[${JOB_NAME}] Error (executionId=${execId}):`, err.message);

    // ── Escalation threshold: alert owner after 3 consecutive failures ──────
    const consecutiveFails = await countConsecutiveFailures(JOB_NAME).catch(() => 0);
    const shouldEscalate = consecutiveFails >= 2; // this failure will be the 3rd

    await failJobExecution(execId, {
      errorMessage: err.message,
      errorStack: err.stack,
      durationMs,
      escalate: shouldEscalate,
      escalationNote: shouldEscalate
        ? `Job has failed ${consecutiveFails + 1} consecutive times. Manual investigation required.`
        : undefined,
    });

    if (shouldEscalate) {
      try {
        await notifyOwner({
          title: `⚠️ ${JOB_NAME} has failed 3 consecutive times`,
          content: `Last error: ${err.message}\n\nManual investigation required. Check Admin → Scheduled Jobs for execution history.`,
        });
      } catch (notifyErr: any) {
        console.error(
          `[${JOB_NAME}] Failed to send escalation notification:`,
          notifyErr.message
        );
      }
    }

    throw err; // re-throw so the HTTP handler can return 500
  }
}

// ─── HTTP Handlers ────────────────────────────────────────────────────────────
// These are called by Express routes registered in server/_core/index.ts.
// They authenticate the request (cron-only) and delegate to the shared service.

/**
 * POST /api/scheduled/weekly-digest
 * Triggered by the Heartbeat cron every Monday 09:00 UTC.
 * Generates a weekly intelligence digest and creates an alert record.
 */
export async function weeklyDigestHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return res.status(403).json({ error: "cron-only" });

    // Gather recent data for the digest
    const [knowledgeItems, regulatoryItems, discrepancies, ciEvents] = await Promise.all([
      getKnowledgeItems({ limit: 5 }),
      getRegulatoryItems({ limit: 5 }),
      getDiscrepancies({ limit: 5 }),
      getCiEvents({ limit: 5 }),
    ]);

    const contextSummary = `
RECENT KNOWLEDGE ITEMS (last 5):
${knowledgeItems.map((k: any) => `- [${k.category}] ${k.title} (${k.verificationStatus})`).join("\n")}

UPCOMING REGULATORY DEADLINES (top 5):
${regulatoryItems.map((r: any) => `- [${r.body}] ${r.title} — deadline: ${r.deadline ? new Date(r.deadline).toLocaleDateString() : "TBD"} (${r.biorceRelevance})`).join("\n")}

OPEN DISCREPANCIES (top 5):
${discrepancies.map((d: any) => `- [${d.severity}] ${d.title} (${d.status})`).join("\n")}

RECENT COMPETITIVE EVENTS (last 5):
${ciEvents.map((e: any) => `- ${e.title} (${e.type})`).join("\n")}
`.trim();

    const llmResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are the Biorce Strategy Copilot. Generate a concise weekly intelligence digest for the Biorce executive team.
Format: 3-4 bullet points per section (Regulatory, Competitive, Discrepancies). Be direct and action-oriented.
Max 250 words total. Start with "Weekly Intelligence Digest — Week of [current date]".`,
        },
        {
          role: "user",
          content: `Generate this week's digest based on the following data:\n\n${contextSummary}`,
        },
      ],
    });

    const rawContent = llmResponse.choices?.[0]?.message?.content;
    const digestContent =
      typeof rawContent === "string" ? rawContent : "Digest generation failed.";
    const weekLabel = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    await createAlert({
      title: `Weekly Intelligence Digest — Week of ${weekLabel}`,
      body: digestContent,
      type: "digest",
      severity: "medium",
      isRead: false,
      sourceTable: null,
      sourceId: null,
    });

    res.json({ ok: true, digestLength: digestContent.length });
  } catch (err: any) {
    console.error("[weekly-digest] Error:", err);
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      context: { url: req.url, taskUid: "unknown" },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/scheduled/daily-partnership-pulse
 * Triggered by the Heartbeat cron every day at 08:00 UTC.
 * Authenticates the request as a cron call, then delegates to the shared service.
 * No localhost bypass, no IP checks, no cookie forwarding.
 */
export async function dailyPartnershipPulseHandler(req: Request, res: Response) {
  // ── Auth: cron-only ───────────────────────────────────────────────────────
  let user: any;
  try {
    user = await sdk.authenticateRequest(req);
  } catch {
    return res.status(403).json({ error: "auth-failed" });
  }
  if (!user.isCron) {
    return res.status(403).json({ error: "cron-only" });
  }

  // ── Delegate to shared service ────────────────────────────────────────────
  try {
    const result = await executeDailyPartnershipPulse({ triggeredBy: "cron" });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}
