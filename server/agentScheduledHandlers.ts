/**
 * Biorce Autonomous Agent Scheduled Handlers
 * ============================================
 * Each handler is triggered by a Heartbeat cron job and runs the corresponding
 * Biorce agent autonomously — pulling live DB data, calling the LLM, and writing
 * alerts, discrepancies, or knowledge items back to the database.
 *
 * Agents implemented here:
 *  1. Regulatory Watch Agent         — daily 07:00 UTC
 *  2. Competitive Intelligence Agent — daily 07:30 UTC
 *  3. Pharma Signal Engine           — daily 08:30 UTC
 *  4. Claims Guardian                — weekly Monday 09:30 UTC
 *  5. Vision Consistency Agent       — weekly Monday 10:00 UTC
 *  6. Scientific Evidence Agent      — weekly Tuesday 08:00 UTC
 *  7. Opportunity Agent              — daily 09:00 UTC
 *  8. Contradiction Agent            — daily 09:30 UTC
 *  9. Strategy Execution Agent       — daily 10:00 UTC
 * 10. Board Intelligence Agent       — monthly (1st of month) 08:00 UTC
 * 11. Standards Watch Agent          — weekly Wednesday 08:00 UTC
 */

import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { runSingleAgent } from "./langchainOrchestrator";
import type { OrchestratorInput } from "./langchainOrchestrator";
import {
  createAlert,
  createDiscrepancy,
  createKnowledgeItem,
  createRegulatoryItem,
  getAlerts,
  getCiEvents,
  getCompetitors,
  getDiscrepancies,
  getKnowledgeItems,
  getPartners,
  getPharmaSignals,
  getRegulatoryItems,
  getStalePartners,
  updatePharmaSignalNotes,
} from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

async function cronGuard(req: Request, res: Response): Promise<boolean> {
  const user = await sdk.authenticateRequest(req);
  if (!user.isCron) {
    // Also allow admin manual triggers via the x-admin-trigger header
    const adminSecret = req.headers["x-admin-trigger"];
    const jwtSecret = process.env.JWT_SECRET ?? "";
    if (!adminSecret || adminSecret !== jwtSecret) {
      res.status(403).json({ error: "cron-only" });
      return false;
    }
  }
  return true;
}

function errHandler(tag: string, err: any, res: Response) {
  console.error(`[${tag}] Error:`, err);
  res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
}

/**
 * Run a named LangChain agent and return the finding text.
 * The agent uses its full LangChain chain: structured prompt → ChatOpenAI → JSON output.
 */
async function agentRun(
  agentId: Parameters<typeof runSingleAgent>[0],
  question: string,
  ctx: Partial<OrchestratorInput> = {}
): Promise<{ text: string; confidence: number; recommendations: string[]; citations: string[] }> {
  try {
    const finding = await runSingleAgent(agentId, question, {
      question,
      knowledgeBase: ctx.knowledgeBase ?? "",
      regulatoryContext: ctx.regulatoryContext ?? "",
      competitorContext: ctx.competitorContext ?? "",
      partnerContext: ctx.partnerContext ?? "",
    });
    return {
      text: finding.finding,
      confidence: finding.confidence,
      recommendations: finding.recommendations,
      citations: finding.citations,
    };
  } catch (err) {
    console.error(`[agentRun] ${agentId} failed:`, err);
    return { text: "", confidence: 0, recommendations: [], citations: [] };
  }
}

// ─── 1. Regulatory Watch Agent ────────────────────────────────────────────────
/**
 * POST /api/scheduled/agent-regulatory-watch
 * Scans regulatory items for upcoming deadlines (≤30 days) and items with
 * high Biorce relevance. Generates an alert with action recommendations.
 */
export async function regulatoryWatchHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const items = await getRegulatoryItems({ limit: 20 });
    const now = Date.now();
    const urgent = items.filter((r: any) => {
      if (!r.deadline) return false;
      const daysLeft = Math.ceil((new Date(r.deadline).getTime() - now) / 86400000);
      return daysLeft >= 0 && daysLeft <= 30;
    });
    const highRelevance = items.filter((r: any) => r.biorceRelevance === "high" || r.biorceRelevance === "critical");

    if (urgent.length === 0 && highRelevance.length === 0) {
      console.log("[reg-watch] No urgent regulatory items today.");
      return res.json({ ok: true, alertsCreated: 0 });
    }

    const context = [
      urgent.length > 0 ? `DEADLINES WITHIN 30 DAYS:\n${urgent.map((r: any) => `- [${r.body}] ${r.title} — deadline: ${new Date(r.deadline).toLocaleDateString()} (${r.biorceRelevance} relevance)`).join("\n")}` : "",
      highRelevance.length > 0 ? `HIGH-RELEVANCE ITEMS:\n${highRelevance.map((r: any) => `- [${r.body}] ${r.title} (status: ${r.status})`).join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    const { text: body, confidence: bodyConf, recommendations: bodyRecs } = await agentRun('regulatory_watch', `Regulatory intelligence for ${today()}: ${context}`, { regulatoryContext: context });

    await createAlert({
      title: `Regulatory Watch — ${urgent.length} Upcoming Deadlines, ${highRelevance.length} High-Relevance Items — ${today()}`,
      body: body || context,
      type: "regulatory",
      severity: urgent.length > 0 ? "high" : "medium",
      isRead: false,
      sourceTable: "regulatory_items",
      sourceId: null,
    });

    res.json({ ok: true, urgentCount: urgent.length, highRelevanceCount: highRelevance.length, alertsCreated: 1 });
  } catch (err: any) { errHandler("reg-watch", err, res); }
}

// ─── 2. Competitive Intelligence Agent ───────────────────────────────────────
/**
 * POST /api/scheduled/agent-competitive-intel
 * Scans recent CI events (last 7 days), identifies patterns across competitors,
 * and generates a competitive briefing alert.
 */
export async function competitiveIntelHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const [competitors, recentEvents] = await Promise.all([
      getCompetitors(),
      getCiEvents({ limit: 20 }),
    ]);

    if (recentEvents.length === 0) {
      return res.json({ ok: true, alertsCreated: 0, reason: "no-events" });
    }

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const fresh = recentEvents.filter((e: any) => new Date(e.createdAt).getTime() > sevenDaysAgo);

    const context = `COMPETITORS: ${competitors.map((c: any) => c.name).join(", ")}

RECENT CI EVENTS (last 7 days, ${fresh.length} of ${recentEvents.length} total):
${fresh.length > 0
  ? fresh.map((e: any) => `- [${e.type}] ${e.title} (threat: ${e.threatLevel ?? "unknown"})`).join("\n")
  : recentEvents.slice(0, 10).map((e: any) => `- [${e.type}] ${e.title}`).join("\n")}`;

    const { text: body, confidence: bodyConf, recommendations: bodyRecs } = await agentRun('competitive_intel', `Competitive intelligence for ${today()}: ${context}`, { competitorContext: context });

    const highThreat = recentEvents.filter((e: any) => e.threatLevel === "high" || e.threatLevel === "critical").length;
    await createAlert({
      title: `Competitive Intel — ${fresh.length} New Events, ${highThreat} High-Threat — ${today()}`,
      body: body || context,
      type: "competitive",
      severity: highThreat > 0 ? "high" : "medium",
      isRead: false,
      sourceTable: "ci_events",
      sourceId: null,
    });

    res.json({ ok: true, freshEvents: fresh.length, highThreat, alertsCreated: 1 });
  } catch (err: any) { errHandler("ci-agent", err, res); }
}

// ─── 3. Pharma Signal Engine ──────────────────────────────────────────────────
/**
 * POST /api/scheduled/agent-pharma-signal
 * Scans pharma signals with high scores or "new" status, generates outreach
 * recommendations, and updates signal notes with the LLM analysis.
 */
export async function pharmaSignalHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const signals = await getPharmaSignals({ status: "new", limit: 15 });
    const hotSignals = (signals as any[]).filter((s: any) => (s.signalScore ?? 0) >= 70);

    if (hotSignals.length === 0) {
      return res.json({ ok: true, alertsCreated: 0, reason: "no-hot-signals" });
    }

    const context = hotSignals.map((s: any) =>
      `- [Score: ${s.signalScore}] ${s.companyName} — ${s.signalType}: ${s.title}\n  Biorce angle: ${s.biorceAngle ?? "not set"}`
    ).join("\n");

    const { text: body, confidence: bodyConf, recommendations: bodyRecs } = await agentRun('pharma_signal', `Hot pharma signals for ${today()} (score ≥70): ${context}`, { partnerContext: context });

    await createAlert({
      title: `Pharma Signal Engine — ${hotSignals.length} Hot Signals Require Outreach — ${today()}`,
      body: body || context,
      type: "partnership",
      severity: hotSignals.length >= 3 ? "high" : "medium",
      isRead: false,
      sourceTable: "pharma_signals",
      sourceId: null,
    });

    // Update each hot signal with the LLM's outreach recommendation
    for (const s of hotSignals.slice(0, 5)) {
      await updatePharmaSignalNotes(s.id, `Auto-analysed by Pharma Signal Engine on ${today()}`, s.biorceAngle, body.slice(0, 500));
    }

    res.json({ ok: true, hotSignals: hotSignals.length, alertsCreated: 1 });
  } catch (err: any) { errHandler("pharma-signal", err, res); }
}

// ─── 4. Claims Guardian ───────────────────────────────────────────────────────
/**
 * POST /api/scheduled/agent-claims-guardian
 * Audits knowledge items for unsupported claims, outdated data, or
 * inconsistent language. Creates discrepancy records for each issue found.
 */
export async function claimsGuardianHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const items = await getKnowledgeItems({ limit: 30 });
    if (items.length === 0) return res.json({ ok: true, discrepanciesCreated: 0 });

    const itemList = items.map((k: any) =>
      `[${k.id}] [${k.category}] ${k.title} — status: ${k.verificationStatus}, source: ${k.sourceName ?? "unknown"}`
    ).join("\n");

    const { text: analysis } = await agentRun('claims_guardian', `Review these knowledge items for claims issues: ${itemList}`, { knowledgeBase: itemList });

    let issues: Array<{ itemId: number; title: string; issue: string; severity: string }> = [];
    try {
      const match = analysis.match(/\[[\s\S]*\]/);
      if (match) issues = JSON.parse(match[0]);
    } catch { issues = []; }

    let created = 0;
    for (const issue of issues.slice(0, 5)) {
      await createDiscrepancy({
        title: `Claims Issue: ${issue.title}`,
        description: issue.issue,
        type: "internal_vs_public",
        severity: (issue.severity as any) ?? "medium",
        status: "open",
        sourceA: `Knowledge item #${issue.itemId}`,
        sourceB: "Claims Guardian automated audit",
        resolution: null,
      });
      created++;
    }

    if (created > 0) {
      await createAlert({
        title: `Claims Guardian — ${created} Potential Issues Detected — ${today()}`,
        body: `The Claims Guardian agent identified ${created} knowledge items with potential claims issues. Review the Discrepancy Detector for details.\n\n${analysis.slice(0, 400)}`,
        type: "discrepancy",
        severity: created >= 3 ? "high" : "medium",
        isRead: false,
        sourceTable: "discrepancies",
        sourceId: null,
      });
    }

    res.json({ ok: true, itemsReviewed: items.length, discrepanciesCreated: created });
  } catch (err: any) { errHandler("claims-guardian", err, res); }
}

// ─── 5. Vision Consistency Agent ─────────────────────────────────────────────
/**
 * POST /api/scheduled/agent-vision-consistency
 * Checks recent knowledge items and press releases for drift away from
 * Biorce's core vision (neutral platform, not a CRO/consultancy).
 */
export async function visionConsistencyHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const [pressItems, knowledgeItems] = await Promise.all([
      getKnowledgeItems({ category: "press_release", limit: 10 }),
      getKnowledgeItems({ category: "internal", limit: 10 }),
    ]);

    const allItems = [...pressItems, ...knowledgeItems];
    if (allItems.length === 0) return res.json({ ok: true, alertsCreated: 0 });

    const itemList = allItems.map((k: any) => `- [${k.category}] ${k.title}: ${(k.summary ?? k.content ?? "").slice(0, 150)}`).join("\n");

    const { text: analysis } = await agentRun('vision_consistency', `Review for vision drift: ${itemList}`, { knowledgeBase: itemList });

    const hasDrift = !analysis.toLowerCase().includes("no vision drift");
    if (hasDrift) {
      await createDiscrepancy({
        title: `Vision Drift Detected — ${today()}`,
        description: analysis,
        type: "strategy_drift",
        severity: "high",
        status: "open",
        sourceA: "Recent press/internal content",
        sourceB: "Biorce core vision: neutral AI-native platform",
        resolution: null,
      });
      await createAlert({
        title: `Vision Consistency Alert — Drift Detected — ${today()}`,
        body: analysis,
        type: "discrepancy",
        severity: "high",
        isRead: false,
        sourceTable: "discrepancies",
        sourceId: null,
      });
    }

    res.json({ ok: true, driftDetected: hasDrift, alertsCreated: hasDrift ? 1 : 0 });
  } catch (err: any) { errHandler("vision-consistency", err, res); }
}

// ─── 6. Scientific Evidence Agent ────────────────────────────────────────────
/**
 * POST /api/scheduled/agent-scientific-evidence
 * Reviews recent knowledge items tagged as research/regulatory and identifies
 * gaps in Biorce's evidence base. Creates knowledge items for missing evidence.
 */
export async function scientificEvidenceHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const researchItems = await getKnowledgeItems({ category: "research", limit: 15 });
    const regulatoryItems = await getRegulatoryItems({ limit: 10 });

    const context = `RESEARCH KNOWLEDGE BASE (${researchItems.length} items):
${researchItems.map((k: any) => `- ${k.title} (${k.verificationStatus})`).join("\n")}

REGULATORY CONTEXT (${regulatoryItems.length} items):
${regulatoryItems.map((r: any) => `- [${r.body}] ${r.title}`).join("\n")}`;

    const { text: analysis } = await agentRun('scientific_evidence', `Current evidence base: ${context}`, { knowledgeBase: context });

    let gaps: Array<{ gap: string; importance: string; recommendation: string }> = [];
    try {
      const match = analysis.match(/\[[\s\S]*\]/);
      if (match) gaps = JSON.parse(match[0]);
    } catch { gaps = []; }

    let created = 0;
    for (const gap of gaps.slice(0, 3)) {
      await createKnowledgeItem({
        title: `Evidence Gap: ${gap.gap}`,
        content: `${gap.importance}\n\nRecommendation: ${gap.recommendation}`,
        summary: gap.importance,
        category: "research",
      sourceType: "secondary",
      sourceName: "Scientific Evidence Agent",
      sourceUrl: null,
      author: "Biorce AI",
      verificationStatus: "unverified",
      tags: ["evidence-gap", "ai-generated"],
      publishedAt: new Date(),
      entities: [],
      isConfidential: false,
      });
      created++;
    }

    if (created > 0) {
      await createAlert({
        title: `Scientific Evidence Agent — ${created} Evidence Gaps Identified — ${today()}`,
        body: `The Scientific Evidence Agent identified ${created} gaps in Biorce's evidence base. New knowledge items have been created for review.\n\n${gaps.map(g => `• ${g.gap}`).join("\n")}`,
        type: "regulatory",
        severity: "medium",
        isRead: false,
        sourceTable: "knowledge_items",
        sourceId: null,
      });
    }

    res.json({ ok: true, gapsFound: gaps.length, knowledgeItemsCreated: created });
  } catch (err: any) { errHandler("sci-evidence", err, res); }
}

// ─── 7. Opportunity Agent ─────────────────────────────────────────────────────
/**
 * POST /api/scheduled/agent-opportunity
 * Cross-references regulatory, competitive, and partnership data to identify
 * asymmetric opportunities for Biorce. Creates high-priority alerts.
 */
export async function opportunityAgentHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const [regulatoryItems, ciEvents, partners] = await Promise.all([
      getRegulatoryItems({ limit: 10 }),
      getCiEvents({ limit: 15 }),
      getPartners({ tier: "P0", limit: 10 }),
    ]);

    const context = `REGULATORY SIGNALS:
${regulatoryItems.map((r: any) => `- [${r.body}] ${r.title} (${r.biorceRelevance} relevance)`).join("\n")}

COMPETITIVE EVENTS:
${ciEvents.map((e: any) => `- [${e.type}] ${e.title}`).join("\n")}

P0 PARTNERS (highest priority):
${partners.map((p: any) => `- ${p.name} (stage: ${p.stage}) — ${p.nextAction ?? "no next action set"}`).join("\n")}`;

    const { text: body, confidence: bodyConf, recommendations: bodyRecs } = await agentRun('opportunity_agent', `Cross-domain intelligence for ${today()}: ${context}`, { regulatoryContext: context });

    if (body) {
      await createAlert({
        title: `Opportunity Agent — Cross-Domain Signals Identified — ${today()}`,
        body,
        type: "competitive",
        severity: "high",
        isRead: false,
        sourceTable: null,
        sourceId: null,
      });
    }

    res.json({ ok: true, alertsCreated: body ? 1 : 0 });
  } catch (err: any) { errHandler("opportunity-agent", err, res); }
}

// ─── 8. Contradiction Agent ───────────────────────────────────────────────────
/**
 * POST /api/scheduled/agent-contradiction
 * Scans knowledge items and regulatory items for internal contradictions,
 * conflicting dates, or gaps between public language and evidence.
 */
export async function contradictionAgentHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const [knowledge, regulatory] = await Promise.all([
      getKnowledgeItems({ limit: 20 }),
      getRegulatoryItems({ limit: 10 }),
    ]);

    const context = `KNOWLEDGE ITEMS:
${knowledge.map((k: any) => `[${k.id}] ${k.title} — ${k.verificationStatus} — ${(k.summary ?? "").slice(0, 100)}`).join("\n")}

REGULATORY ITEMS:
${regulatory.map((r: any) => `[${r.id}] [${r.body}] ${r.title} — status: ${r.status}`).join("\n")}`;

    const { text: analysis } = await agentRun('contradiction_agent', `Scan for contradictions: ${context}`, { knowledgeBase: context });

    let contradictions: Array<{ type: string; title: string; description: string; severity: string; sourceA: string; sourceB: string }> = [];
    try {
      const match = analysis.match(/\[[\s\S]*\]/);
      if (match) contradictions = JSON.parse(match[0]);
    } catch { contradictions = []; }

    let created = 0;
    for (const c of contradictions.slice(0, 3)) {
      await createDiscrepancy({
        title: c.title,
        description: c.description,
        type: (c.type as any) ?? "data_inconsistency",
        severity: (c.severity as any) ?? "medium",
        status: "open",
        sourceA: c.sourceA,
        sourceB: c.sourceB,
        resolution: null,
      });
      created++;
    }

    if (created > 0) {
      await createAlert({
        title: `Contradiction Agent — ${created} Conflicts Detected — ${today()}`,
        body: `The Contradiction Agent detected ${created} internal conflicts in the knowledge base. Review the Discrepancy Detector.\n\n${contradictions.map(c => `• [${c.severity}] ${c.title}`).join("\n")}`,
        type: "discrepancy",
        severity: contradictions.some(c => c.severity === "high") ? "high" : "medium",
        isRead: false,
        sourceTable: "discrepancies",
        sourceId: null,
      });
    }

    res.json({ ok: true, itemsScanned: knowledge.length + regulatory.length, discrepanciesCreated: created });
  } catch (err: any) { errHandler("contradiction-agent", err, res); }
}

// ─── 9. Strategy Execution Agent ─────────────────────────────────────────────
/**
 * POST /api/scheduled/agent-strategy-execution
 * Reviews P0/P1 partners for overdue next actions and generates escalation alerts.
 */
export async function strategyExecutionHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const [p0Partners, p1Partners] = await Promise.all([
      getPartners({ tier: "P0", limit: 20 }),
      getPartners({ tier: "P1", limit: 20 }),
    ]);

    const priorityPartners = [...p0Partners, ...p1Partners];
    const now = Date.now();
    const overdue = priorityPartners.filter((p: any) => {
      if (!p.nextActionDate) return false;
      return new Date(p.nextActionDate).getTime() < now;
    });
    const noAction = priorityPartners.filter((p: any) => !p.nextAction && p.stage !== "closed_won" && p.stage !== "closed_lost");

    if (overdue.length === 0 && noAction.length === 0) {
      return res.json({ ok: true, alertsCreated: 0, reason: "all-on-track" });
    }

    const context = [
      overdue.length > 0 ? `OVERDUE ACTIONS (${overdue.length}):\n${overdue.map((p: any) => `- [${p.tier}] ${p.name} (stage: ${p.stage}) — action: ${p.nextAction ?? "none"}, due: ${p.nextActionDate ? new Date(p.nextActionDate).toLocaleDateString() : "unknown"}`).join("\n")}` : "",
      noAction.length > 0 ? `NO NEXT ACTION SET (${noAction.length}):\n${noAction.map((p: any) => `- [${p.tier}] ${p.name} (stage: ${p.stage})`).join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    const { text: body, confidence: bodyConf, recommendations: bodyRecs } = await agentRun('strategy_execution', `Strategy execution review for ${today()}: ${context}`, { partnerContext: context });

    await createAlert({
      title: `Strategy Execution — ${overdue.length} Overdue, ${noAction.length} Undefined Actions — ${today()}`,
      body: body || context,
      type: "partnership",
      severity: overdue.length > 0 ? "high" : "medium",
      isRead: false,
      sourceTable: "partners",
      sourceId: null,
    });

    res.json({ ok: true, overdueCount: overdue.length, noActionCount: noAction.length, alertsCreated: 1 });
  } catch (err: any) { errHandler("strategy-execution", err, res); }
}

// ─── 10. Board Intelligence Agent ────────────────────────────────────────────
/**
 * POST /api/scheduled/agent-board-intelligence
 * Monthly: produces a board intelligence pack covering risk, opportunities,
 * strategy progress, regulatory deadlines, competitive moves, decisions required.
 */
export async function boardIntelligenceHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const [knowledge, regulatory, discrepancies, ciEvents, partners, alerts] = await Promise.all([
      getKnowledgeItems({ limit: 10 }),
      getRegulatoryItems({ limit: 10 }),
      getDiscrepancies({ status: "open", limit: 10 }),
      getCiEvents({ limit: 10 }),
      getPartners({ tier: "P0", limit: 10 }),
      getAlerts({ isRead: false, limit: 20 }),
    ]);

    const context = `KNOWLEDGE BASE HIGHLIGHTS: ${knowledge.slice(0, 5).map((k: any) => k.title).join("; ")}
REGULATORY DEADLINES: ${regulatory.slice(0, 5).map((r: any) => `${r.title} (${r.body})`).join("; ")}
OPEN DISCREPANCIES: ${discrepancies.length} open
COMPETITIVE EVENTS: ${ciEvents.slice(0, 5).map((e: any) => e.title).join("; ")}
P0 PARTNERS: ${partners.map((p: any) => `${p.name} (${p.stage})`).join(", ")}
UNREAD ALERTS: ${alerts.length}`;

    const { text: body, confidence: bodyConf, recommendations: bodyRecs } = await agentRun('board_intelligence', `Monthly board intelligence for ${today()}: ${context}`, { knowledgeBase: context });

    const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    await createAlert({
      title: `Board Intelligence Pack — ${month}`,
      body: body || "Board intelligence pack generation failed.",
      type: "digest",
      severity: "high",
      isRead: false,
      sourceTable: null,
      sourceId: null,
    });

    res.json({ ok: true, alertsCreated: 1, packLength: body.length });
  } catch (err: any) { errHandler("board-intel", err, res); }
}

// ─── 11. Standards Watch Agent ────────────────────────────────────────────────
/**
 * POST /api/scheduled/agent-standards-watch
 * Monitors ICH M11, CDISC USDM, HL7 FHIR, and other clinical data standards.
 * Creates regulatory items for any new or updated standards detected.
 */
export async function standardsWatchHandler(req: Request, res: Response) {
  try {
    if (!await cronGuard(req, res)) return;
    const existingStandards = await getRegulatoryItems({ limit: 30 });
    const standardsList = existingStandards.map((r: any) => `[${r.body}] ${r.title} (status: ${r.status})`).join("\n");

    const { text: analysis } = await agentRun('standards_watch', `Currently tracked standards: ${standardsList}`, { regulatoryContext: standardsList });

    let newStandards: Array<{ title: string; body: string; description: string; biorceRelevance: string }> = [];
    try {
      const match = analysis.match(/\[[\s\S]*\]/);
      if (match) newStandards = JSON.parse(match[0]);
    } catch { newStandards = []; }

    let created = 0;
    for (const s of newStandards.slice(0, 3)) {
      const alreadyExists = existingStandards.some((r: any) => r.title.toLowerCase().includes(s.title.toLowerCase().slice(0, 20)));
      if (!alreadyExists) {
        await createRegulatoryItem({
          title: s.title,
          body: (s.body as any) ?? "OTHER",
          description: s.description,
          status: "upcoming",
          type: "guidance",
          impactLevel: "medium",
          biorceRelevance: (s.biorceRelevance as any) ?? "medium",
          deadline: null,
          effectiveDate: null,
          sourceUrl: null,
          alertSent: false,
        });
        created++;
      }
    }

    if (created > 0) {
      await createAlert({
        title: `Standards Watch — ${created} New Standards Added to Tracker — ${today()}`,
        body: `The Standards Watch Agent identified ${created} standards not yet tracked in the regulatory database.\n\n${newStandards.map(s => `• ${s.title} (${s.biorceRelevance} relevance)`).join("\n")}`,
        type: "regulatory",
        severity: "medium",
        isRead: false,
        sourceTable: "regulatory_items",
        sourceId: null,
      });
    }

    res.json({ ok: true, standardsChecked: existingStandards.length, newStandardsCreated: created });
  } catch (err: any) { errHandler("standards-watch", err, res); }
}
