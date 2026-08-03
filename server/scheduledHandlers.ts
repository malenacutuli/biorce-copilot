import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { invokeLLM } from "./_core/llm";
import { createAlert, getKnowledgeItems, getRegulatoryItems, getDiscrepancies, getCiEvents, getStalePartners } from "./db";

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
    const digestContent = typeof rawContent === "string" ? rawContent : "Digest generation failed.";
    const weekLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

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
 * Detects stale partners (no activity in 14+ days) and creates
 * an LLM-generated nudge alert for each batch.
 */
export async function dailyPartnershipPulseHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return res.status(403).json({ error: "cron-only" });

    const stalePartners = await getStalePartners(14);
    if (stalePartners.length === 0) {
      console.log("[daily-pulse] No stale partners — pipeline is healthy.");
      return res.json({ ok: true, staleCount: 0, alertsCreated: 0 });
    }

    console.log(`[daily-pulse] ${stalePartners.length} stale partners found. Generating nudge alert...`);

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
    const nudgeBody = typeof rawContent === "string" ? rawContent : "Partnership pulse check: review stale partners.";

    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const priorityCount = stalePartners.filter(p => p.tier === "P0" || p.tier === "P1").length;

    await createAlert({
      title: `Partnership Pulse — ${stalePartners.length} Stale Relationships (${priorityCount} Priority) — ${today}`,
      body: nudgeBody,
      type: "partnership",
      severity: priorityCount > 0 ? "high" : "medium",
      isRead: false,
      sourceTable: "partners",
      sourceId: null,
    });

    console.log(`[daily-pulse] Alert created. staleCount=${stalePartners.length}, priorityCount=${priorityCount}`);
    res.json({ ok: true, staleCount: stalePartners.length, alertsCreated: 1, priorityCount });
  } catch (err: any) {
    console.error("[daily-pulse] Error:", err);
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      context: { url: req.url, taskUid: "unknown" },
      timestamp: new Date().toISOString(),
    });
  }
}
