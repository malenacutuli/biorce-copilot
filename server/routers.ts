import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { listHeartbeatJobs, updateHeartbeatJob } from "./_core/heartbeat";
import { runBiorceOrchestrator, getAvailableAgents } from "./agentOrchestrator";
import { runLangChainOrchestrator, toLegacyAnswer, LANGCHAIN_AGENTS, persistDecisionRoom } from "./langchainOrchestrator";
import {
  countKnowledgeItems, countOpenDiscrepancies, countUnreadAlerts,
  countPartnersByStage, createAlert, createCiEvent, createKnowledgeItem,
  createPartner, createRegulatoryItem, getAlerts, getCiEvents, getCompetitors,
  getDiscrepancies, getGraphEdges, getGraphNodes, getKnowledgeItemById,
  getKnowledgeItems, getPartnerById, getPartnerExecutives, getPartners,
  getRegulatoryItems, getUserByOpenId, markAlertRead, updateDiscrepancyStatus,
  updatePartnerStage, upsertUser,
} from "./db";
import { exportKnowledgeItemsCsv, getDecisionRooms, getDecisionRoomById, getAgentClaims, getClaimVotes, getEvidenceForRoom, getPartnershipAssets, upsertPartnershipAsset, updatePartnershipAsset, getOutcomeLearning, recordActualOutcome } from "./db";
import {
  getPharmaSignals, getPharmaSignalById, createPharmaSignal,
  updatePharmaSignalStatus, updatePharmaSignalNotes,
  logPharmaOutreach, getPharmaOutreachLog,
} from "./db";
import {
  getMediaItems, getMediaItemById, createMediaItem, updateMediaItem, deleteMediaItem, countMediaItems,
  getPressItems, getPressItemById, createPressItem, updatePressItem, deletePressItem, countPressItems,
  getSourceComments, createSourceComment, updateSourceCommentStatus, deleteSourceComment,
  getPartnerActivities, createPartnerActivity, deletePartnerActivity,
  getPartnerFlags, createPartnerFlag, resolvePartnerFlag, deletePartnerFlag,
  getConnectorConfigs, upsertConnectorConfig, toggleConnector,
} from "./db";

// ─── Knowledge Router ─────────────────────────────────────────────────────────
const knowledgeRouter = router({
  list: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      verificationStatus: z.string().optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(({ input }) => getKnowledgeItems(input)),

  exportCsv: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      verificationStatus: z.string().optional(),
      sourceType: z.string().optional(),
    }))
    .query(({ input }) => exportKnowledgeItemsCsv(input)),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getKnowledgeItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  count: protectedProcedure.query(() => countKnowledgeItems()),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(500),
      category: z.enum(["podcast", "press_release", "regulatory", "competitor", "internal", "investor", "public_statement", "research"]),
      content: z.string().min(1),
      summary: z.string().optional(),
      sourceName: z.string().optional(),
      sourceUrl: z.string().optional(),
      verificationStatus: z.enum(["verified", "inferred", "unverified"]).default("unverified"),
      tags: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input }) => {
        const item = await createKnowledgeItem({
          title: input.title,
          category: input.category,
          content: input.content,
          summary: input.summary ?? null,
          sourceName: input.sourceName ?? null,
          sourceUrl: input.sourceUrl ?? null,
          verificationStatus: input.verificationStatus,
          tags: input.tags,
          publishedAt: new Date(),
          sourceType: "primary",
          author: null,
          entities: [],
          isConfidential: false,
        });
      return item;
    }),
});

// ─── Regulatory Router ────────────────────────────────────────────────────────
const regulatoryRouter = router({
  list: protectedProcedure
    .input(z.object({
      body: z.string().optional(),
      status: z.string().optional(),
      impactLevel: z.string().optional(),
      limit: z.number().min(1).max(200).default(100),
    }))
    .query(({ input }) => getRegulatoryItems(input)),

  count: protectedProcedure.query(() => countKnowledgeItems()),
});

// ─── Competitive Router ───────────────────────────────────────────────────────
const competitiveRouter = router({
  competitors: protectedProcedure.query(() => getCompetitors()),

  events: protectedProcedure
    .input(z.object({
      competitorId: z.number().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(({ input }) => getCiEvents(input)),

  addEvent: protectedProcedure
    .input(z.object({
      competitorId: z.number(),
      title: z.string(),
      type: z.enum(["press_release", "product_launch", "partnership", "funding", "regulatory", "personnel", "other"]),
      summary: z.string().optional(),
      sourceUrl: z.string().optional(),
      biorceImplication: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await createCiEvent({ ...input, alertSent: false, publishedAt: new Date(), summary: input.summary ?? null, sourceUrl: input.sourceUrl ?? null, biorceImplication: input.biorceImplication ?? null });
      return { success: true };
    }),
});

// ─── Partnership Router ───────────────────────────────────────────────────────
const partnershipRouter = router({
  list: protectedProcedure
    .input(z.object({
      type: z.string().optional(),
      tier: z.string().optional(),
      stage: z.string().optional(),
      region: z.string().optional(),
      limit: z.number().min(1).max(200).default(100),
    }))
    .query(({ input }) => getPartners(input)),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const partner = await getPartnerById(input.id);
      if (!partner) throw new TRPCError({ code: "NOT_FOUND" });
      const executives = await getPartnerExecutives(input.id);
      return { ...partner, executives };
    }),

  updateStage: protectedProcedure
    .input(z.object({
      id: z.number(),
      stage: z.enum(["identified", "researching", "outreach", "intro_meeting", "negotiating", "loi_signed", "active", "closed_won", "closed_lost", "on_hold"]),
    }))
    .mutation(async ({ input }) => {
      await updatePartnerStage(input.id, input.stage);
      return { success: true };
    }),

  stageStats: protectedProcedure.query(() => countPartnersByStage()),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(256),
      type: z.enum(["pharma", "cro", "tech", "hospital", "regulator", "investor", "standards_body", "lobby"]),
      tier: z.enum(["P0", "P1", "P2", "P3"]).default("P2"),
      stage: z.enum(["identified", "researching", "outreach", "intro_meeting", "negotiating", "loi_signed", "active", "closed_won", "closed_lost", "on_hold"]).default("identified"),
      region: z.enum(["US", "EU", "GLOBAL"]).default("US"),
      website: z.string().optional(),
      description: z.string().optional(),
      nextAction: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await createPartner({
        name: input.name,
        type: input.type,
        tier: input.tier,
        stage: input.stage,
        region: input.region,
        website: input.website ?? null,
        description: input.description ?? null,
        nextAction: input.nextAction ?? null,
        mutualValue: null,
        dealEconomics: null,
        killCriteria: null,
        nextActionDate: null,
        estimatedArrImpact: null,
        notes: null,
      });
      return { success: true };
    }),
});

// ─── Discrepancy Router ───────────────────────────────────────────────────────
const discrepancyRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      severity: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(({ input }) => getDiscrepancies(input)),

  resolve: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "investigating", "resolved", "dismissed"]),
      resolution: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateDiscrepancyStatus(input.id, input.status, input.resolution);
      return { success: true };
    }),

  countOpen: protectedProcedure.query(() => countOpenDiscrepancies()),
});

// ─── Alerts Router ────────────────────────────────────────────────────────────
const alertsRouter = router({
  list: protectedProcedure
    .input(z.object({
      isRead: z.boolean().optional(),
      type: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(({ input }) => getAlerts(input)),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markAlertRead(input.id);
      return { success: true };
    }),

  countUnread: protectedProcedure.query(() => countUnreadAlerts()),
});

// ─── Graph Router ─────────────────────────────────────────────────────────────
const graphRouter = router({
  nodes: protectedProcedure.query(() => getGraphNodes()),
  edges: protectedProcedure.query(() => getGraphEdges()),
});

// ─── Dashboard Router ─────────────────────────────────────────────────────────
const dashboardRouter = router({
  kpis: protectedProcedure.query(async () => {
    const [knowledgeCount, openDiscrepancies, unreadAlerts, stageStats] = await Promise.all([
      countKnowledgeItems(),
      countOpenDiscrepancies(),
      countUnreadAlerts(),
      countPartnersByStage(),
    ]);
    const activePartners = stageStats.filter(s => ["active", "loi_signed", "closed_won"].includes(s.stage)).reduce((a, b) => a + Number(b.count), 0);
    const pipelineTotal = stageStats.reduce((a, b) => a + Number(b.count), 0);
    return { knowledgeCount, openDiscrepancies, unreadAlerts, activePartners, pipelineTotal, stageStats };
  }),
});

// ─── AI Copilot Router ────────────────────────────────────────────────────────
const copilotRouter = router({
  ask: protectedProcedure
    .input(z.object({
      question: z.string().min(1).max(2000),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).default([]),
      useOrchestrator: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      // Fetch relevant context from knowledge base
      // Full question search — multi-keyword, no truncation
      const relevantItems = await getKnowledgeItems({ search: input.question, limit: 12 });
      const regulatoryContext = await getRegulatoryItems({ limit: 10 });
      const competitorContext = await getCompetitors();
      const partnerContext = await getPartners({ limit: 15 });

      const knowledgeContext = relevantItems.map(item =>
        `[SOURCE: ${item.sourceName ?? "Biorce Intelligence"} | ${item.verificationStatus.toUpperCase()} | ${item.category}]\n${item.title}\n${item.summary ?? item.content.slice(0, 500)}`
      ).join("\n\n---\n\n");

      const regulatoryCtx = regulatoryContext.slice(0, 5).map(r =>
        `[REGULATORY: ${r.body} | ${r.status.toUpperCase()}] ${r.title}`
      ).join("\n");

      const competitorCtx = competitorContext.map(c =>
        `[COMPETITOR: ${c.name} | Threat: ${c.threatLevel}] ${c.description ?? ""}`
      ).join("\n");

      const partnerCtx = partnerContext.map(p =>
        `[PARTNER: ${p.name} | ${p.tier}/${p.stage}] ${p.type} — ${p.description ?? ""}`
      ).join("\n");

        if (input.useOrchestrator) {
        // LangChain multi-agent orchestration: route → parallel agents → debate → consensus → synthesis
        const lcResult = await runLangChainOrchestrator({
          question: input.question,
          conversationHistory: input.conversationHistory,
          knowledgeBase: knowledgeContext,
          regulatoryContext: regulatoryCtx,
          competitorContext: competitorCtx,
          partnerContext: partnerCtx,
        });
        const answer = toLegacyAnswer(lcResult);
        // Persist every orchestration as a traceable decision room (fire-and-forget)
        persistDecisionRoom(
          input.question.slice(0, 120),
          input.question,
          lcResult,
          {}
        ).catch(e => console.error("[copilot] persistDecisionRoom failed:", e));
        const agentResults = lcResult.agentFindings.map(f => ({
          agentId: f.agentId,
          agentName: f.agentName,
          finding: f.finding,
          confidence: f.confidence,
          citations: f.citations,
          flags: f.flags,
          recommendations: f.recommendations,
          debateChallenge: f.debateChallenge,
          debateResponse: f.debateResponse,
        }));
        return {
          answer: null,
          orchestratedAnswer: { ...answer, consensusScore: lcResult.consensus.agreementScore, debateRounds: lcResult.debateRounds, conflictingAgents: lcResult.consensus.conflictingAgents },
          agentResults,
          sourcesUsed: relevantItems.map(i => ({ id: i.id, title: i.title, sourceName: i.sourceName, verificationStatus: i.verificationStatus })),
        };
      }

      // Legacy single-agent fallback
      const systemPrompt = `You are the Biorce Strategy Copilot — an internal executive intelligence assistant for Biorce, a clinical AI infrastructure company.
RULES: Only cite primary sources. Every factual claim must include [SOURCE: name]. Distinguish VERIFIED from INFERRED.
BIORCE CONTEXT: AI infrastructure for clinical trials. NOT a CRO. Founders: Pedro Coelho (CEO), Clara Bernardes (CSO), Diogo Coelho (CTO), José Coelho (CPO). HQ: Austin TX + Barcelona. Series A: €43.8M. ARR: ~$9.3M. Product: Aika 2.0.
KNOWLEDGE BASE:\n${knowledgeContext}\nREGULATORY:\n${regulatoryCtx}\nCOMPETITIVE:\n${competitorCtx}`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...input.conversationHistory.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: input.question },
      ];
      const response = await invokeLLM({ messages });
      const content = response.choices?.[0]?.message?.content ?? "Unable to generate response.";
      return {
        answer: content,
        orchestratedAnswer: null,
        agentResults: [],
        sourcesUsed: relevantItems.map(i => ({ id: i.id, title: i.title, sourceName: i.sourceName, verificationStatus: i.verificationStatus })),
      };
    }),

  agents: protectedProcedure.query(() => LANGCHAIN_AGENTS.map(a => ({
    id: a.id,
    name: a.name,
    domain: a.domain,
    description: `LangChain agent — ${a.activationKeywords.slice(0, 3).join(", ")}`,
    activationKeywords: [...a.activationKeywords],
  }))),
});

// ─── Board Memo Router ────────────────────────────────────────────────────────
const boardMemoRouter = router({
  generate: protectedProcedure
    .input(z.object({
      sections: z.array(z.string()).default(["executive_summary", "regulatory", "competitive", "partnerships", "discrepancies", "recommendations"]),
    }))
    .mutation(async () => {
      const [knowledge, regulatory, competitors, partners, discrepanciesList] = await Promise.all([
        getKnowledgeItems({ limit: 20 }),
        getRegulatoryItems({ limit: 10 }),
        getCompetitors(),
        getPartners({ limit: 20 }),
        getDiscrepancies({ limit: 10 }),
      ]);

      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const systemPrompt = "You are the Biorce Strategy Copilot generating a board-level intelligence memo. Format the output as clean HTML suitable for printing to PDF. Use professional executive language. Structure: h1 for title, h2 for sections, p for paragraphs, ul/li for bullets. Include today\'s date: " + today + ". Every factual claim must cite its source in brackets [SOURCE].";

      const regLines = regulatory.map(r => `- ${r.title} [${r.body}] — ${r.status} — Deadline: ${r.deadline ? new Date(r.deadline).toLocaleDateString() : "TBD"}`).join("\n");
      const compLines = competitors.map(c => `- ${c.name} [${c.threatLevel} threat] — ${(c.description ?? "").slice(0, 100)}`).join("\n");
      const partLines = partners.slice(0, 10).map(p => `- ${p.name} [${p.tier}/${p.stage}] — ${p.type}`).join("\n");
      const discLines = discrepanciesList.filter(d => d.status === "open").map(d => `- [${d.severity.toUpperCase()}] ${d.title}`).join("\n");
      const knowledgeTitles = knowledge.slice(0, 5).map(k => k.title).join("; ");

      const userPrompt = `Generate a comprehensive board intelligence memo for Biorce covering:\n\n1. EXECUTIVE SUMMARY — Current strategic position, key wins, critical risks\n2. REGULATORY LANDSCAPE:\n${regLines}\n3. COMPETITIVE INTELLIGENCE:\n${compLines}\n4. PARTNERSHIP PIPELINE:\n${partLines}\n5. OPEN DISCREPANCIES:\n${discLines}\n6. STRATEGIC RECOMMENDATIONS — Top 3 actions for next 30 days\n\nKnowledge context: ${knowledgeTitles}`;

      const response = await invokeLLM({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] });
      const html = response.choices?.[0]?.message?.content ?? "<p>Unable to generate memo.</p>";
      return { html, generatedAt: new Date().toISOString() };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
// ─── Pharma Signal Router ─────────────────────────────────────────────────────
const pharmaSignalRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      signalType: z.string().optional(),
      companyType: z.string().optional(),
      region: z.string().optional(),
      limit: z.number().min(1).max(200).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(({ input }) => getPharmaSignals(input as any)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPharmaSignalById(input.id)),

  create: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1),
      companySlug: z.string().min(1),
      companyType: z.enum(["big_pharma", "mid_pharma", "biotech", "cro", "tech_pharma"]).default("big_pharma"),
      region: z.enum(["US", "EU", "GLOBAL", "APAC"]).default("US"),
      signalType: z.enum([
        "executive_hire", "internal_build", "failed_internal", "conference_presentation",
        "rfp_activity", "hiring_cluster", "partnership_gap", "regulatory_pressure", "funding_event",
      ]),
      signalTitle: z.string().min(1),
      signalSummary: z.string().min(1),
      signalDate: z.string().optional(),
      sourceUrl: z.string().optional(),
      sourceName: z.string().optional(),
      signalStrength: z.number().min(1).max(10).default(5),
      fitScore: z.number().min(1).max(10).default(5),
      urgencyScore: z.number().min(1).max(10).default(5),
      accessScore: z.number().min(1).max(10).default(5),
      keyContact: z.string().optional(),
      keyContactTitle: z.string().optional(),
      biorceAngle: z.string().optional(),
      proposedOutreach: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const data: any = { ...input };
      if (input.signalDate) data.signalDate = new Date(input.signalDate);
      await createPharmaSignal(data);
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "qualified", "in_outreach", "meeting_booked", "closed_won", "closed_lost", "watching"]),
    }))
    .mutation(({ input }) => updatePharmaSignalStatus(input.id, input.status)),

  updateNotes: protectedProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string(),
      biorceAngle: z.string().optional(),
      proposedOutreach: z.string().optional(),
    }))
    .mutation(({ input }) => updatePharmaSignalNotes(input.id, input.notes, input.biorceAngle, input.proposedOutreach)),

  logOutreach: protectedProcedure
    .input(z.object({
      signalId: z.number(),
      outreachType: z.enum(["email", "linkedin", "call", "meeting", "conference", "intro", "follow_up"]),
      summary: z.string().min(1),
      outcome: z.enum(["no_response", "positive", "negative", "meeting_booked", "referred", "not_ready"]).optional(),
      nextStep: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await logPharmaOutreach({
        signalId: input.signalId,
        outreachType: input.outreachType,
        summary: input.summary,
        outcome: input.outcome ?? null,
        nextStep: input.nextStep ?? null,
        loggedByUserId: ctx.user?.id ?? null,
        loggedAt: new Date(),
      });
      return { success: true };
    }),

  getOutreachLog: protectedProcedure
    .input(z.object({ signalId: z.number() }))
    .query(({ input }) => getPharmaOutreachLog(input.signalId)),
});

// ─── Media Library Router ─────────────────────────────────────────────────────
const mediaRouter = router({
  list: protectedProcedure
    .input(z.object({ mediaType: z.string().optional(), search: z.string().optional(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(({ input }) => getMediaItems(input)),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getMediaItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  count: protectedProcedure.query(() => countMediaItems()),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      mediaType: z.enum(["podcast", "video", "interview", "webinar", "conference_talk", "document", "other"]),
      source: z.string().optional(),
      sourceUrl: z.string().optional(),
      youtubeUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      description: z.string().optional(),
      transcript: z.string().optional(),
      duration: z.number().optional(),
      publishedAt: z.string().optional(),
      speaker: z.string().optional(),
      tags: z.string().optional(),
      verificationStatus: z.enum(["verified", "inferred", "unverified"]).default("unverified"),
      sourceOfTruth: z.enum(["primary", "secondary", "tertiary"]).optional(),
    }))
    .mutation(({ input }) => createMediaItem(input as any)),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      transcript: z.string().optional(),
      tags: z.string().optional(),
      verificationStatus: z.enum(["verified", "inferred", "unverified"]).optional(),
      sourceOfTruth: z.enum(["primary", "secondary", "tertiary"]).optional(),
    }))
    .mutation(({ input: { id, ...data } }) => updateMediaItem(id, data as any)),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMediaItem(input.id)),
});

// ─── Press Room Router ────────────────────────────────────────────────────────
const pressRouter = router({
  list: protectedProcedure
    .input(z.object({ pressType: z.string().optional(), sentiment: z.string().optional(), search: z.string().optional(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(({ input }) => getPressItems(input)),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getPressItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  count: protectedProcedure.query(() => countPressItems()),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      outlet: z.string().min(1),
      author: z.string().optional(),
      summary: z.string().optional(),
      fullContent: z.string().optional(),
      sourceUrl: z.string().optional(),
      publishedAt: z.string().optional(),
      pressType: z.enum(["press_release", "news_mention", "feature", "interview", "op_ed", "award", "other"]).default("news_mention"),
      sentiment: z.enum(["positive", "neutral", "negative", "mixed"]).default("neutral"),
      verificationStatus: z.enum(["verified", "inferred", "unverified"]).default("unverified"),
      sourceOfTruth: z.enum(["primary", "secondary", "tertiary"]).optional(),
      tags: z.string().optional(),
      entities: z.string().optional(),
    }))
    .mutation(({ input }) => createPressItem(input as any)),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      summary: z.string().optional(),
      fullContent: z.string().optional(),
      sentiment: z.enum(["positive", "neutral", "negative", "mixed"]).optional(),
      verificationStatus: z.enum(["verified", "inferred", "unverified"]).optional(),
      sourceOfTruth: z.enum(["primary", "secondary", "tertiary"]).optional(),
      tags: z.string().optional(),
    }))
    .mutation(({ input: { id, ...data } }) => updatePressItem(id, data as any)),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePressItem(input.id)),
});

// ─── Source Comments Router ───────────────────────────────────────────────────
const commentsRouter = router({
  list: protectedProcedure
    .input(z.object({ targetTable: z.string(), targetId: z.number() }))
    .query(({ input }) => getSourceComments(input.targetTable, input.targetId)),

  create: protectedProcedure
    .input(z.object({
      targetTable: z.string(),
      targetId: z.number(),
      commentType: z.enum(["correction", "addition", "flag", "note"]).default("note"),
      body: z.string().min(1),
      proposedValue: z.string().optional(),
      fieldName: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => createSourceComment({ ...input, authorId: ctx.user.id, status: "open" } as any)),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["open", "accepted", "rejected"]) }))
    .mutation(({ input }) => updateSourceCommentStatus(input.id, input.status)),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteSourceComment(input.id)),
});

// ─── Partner CRM Router (activities + flags) ──────────────────────────────────
const partnerCrmRouter = router({
  listActivities: protectedProcedure
    .input(z.object({ partnerId: z.number() }))
    .query(({ input }) => getPartnerActivities(input.partnerId)),

  logActivity: protectedProcedure
    .input(z.object({
      partnerId: z.number(),
      activityType: z.enum(["email", "call", "meeting", "demo", "proposal_sent", "contract_sent", "note", "other"]),
      summary: z.string().min(1),
      outcome: z.string().optional(),
      nextAction: z.string().optional(),
      nextActionDue: z.string().optional(),
      linkedSourceTable: z.string().optional(),
      linkedSourceId: z.number().optional(),
    }))
    .mutation(({ input, ctx }) => {
      // Map UI field names (summary, nextAction, nextActionDue) to DB column names (title, body, nextStep, nextStepDate)
      const { summary, nextAction, nextActionDue, activityType, ...rest } = input;
      // Map contract_sent → note (not in DB enum)
      const dbActivityType = activityType === "contract_sent" ? "note" : activityType === "other" ? "note" : activityType;
      return createPartnerActivity({
        ...rest,
        activityType: dbActivityType as any,
        title: summary,
        body: summary,
        nextStep: nextAction ?? null,
        nextStepDate: nextActionDue ? new Date(nextActionDue) : null,
        loggedByUserId: ctx.user.id,
      } as any);
    }),

  deleteActivity: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePartnerActivity(input.id)),

  listFlags: protectedProcedure
    .input(z.object({ partnerId: z.number() }))
    .query(({ input }) => getPartnerFlags(input.partnerId)),

  createFlag: protectedProcedure
    .input(z.object({
      partnerId: z.number(),
      flagType: z.enum(["risk", "opportunity", "blocker", "follow_up", "intel_conflict", "other"]),
      title: z.string().min(1),
      body: z.string().optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      linkedSourceTable: z.string().optional(),
      linkedSourceId: z.number().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => createPartnerFlag({ ...input, createdBy: ctx.user.id, status: "open" } as any)),

  resolveFlag: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["resolved", "dismissed"]) }))
    .mutation(({ input }) => resolvePartnerFlag(input.id, input.status)),

  deleteFlag: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePartnerFlag(input.id)),
});

// ─── Connectors Router ────────────────────────────────────────────────────────
const connectorsRouter = router({
  list: protectedProcedure.query(() => getConnectorConfigs()),

  upsert: protectedProcedure
    .input(z.object({
      connectorType: z.enum(["slack", "google_docs", "notion", "email", "webhook"]),
      displayName: z.string().optional(),
      webhookUrl: z.string().optional(),
      apiToken: z.string().optional(),
      workspaceId: z.string().optional(),
      syncFrequency: z.string().optional(),
      config: z.string().optional(),
    }))
    .mutation(({ input }) => upsertConnectorConfig({ ...input, isEnabled: true } as any)),

  toggle: protectedProcedure
    .input(z.object({ id: z.number(), isEnabled: z.boolean() }))
    .mutation(({ input }) => toggleConnector(input.id, input.isEnabled)),
});

// ─── Scheduled Agents Router ──────────────────────────────────────────────────
const scheduledAgentsRouter = router({
  listJobs: protectedProcedure.query(async ({ ctx }) => {
    const sessionCookie = (ctx.req as any).cookies?.[COOKIE_NAME] ?? "";
    const result = await listHeartbeatJobs(sessionCookie);
    return result.jobs;
  }),
  triggerJob: protectedProcedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ input }) => {
      const port = process.env.PORT || 3000;
      const resp = await fetch(`http://localhost:${port}${input.path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const body = await resp.json().catch(() => ({}));
      return { status: resp.status, ok: resp.ok, body };
    }),
  toggleJob: protectedProcedure
    .input(z.object({ taskUid: z.string(), enable: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const sessionCookie = (ctx.req as any).cookies?.[COOKIE_NAME] ?? "";
      await updateHeartbeatJob(input.taskUid, { enable: input.enable }, sessionCookie);
      return { ok: true };
    }),
});

// ─── Decision Rooms Router ────────────────────────────────────────────────────
const decisionRoomsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(({ input }) => getDecisionRooms({ limit: input?.limit })),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const room = await getDecisionRoomById(input.id);
      if (!room) return null;
      const [claims, evidence] = await Promise.all([
        getAgentClaims(input.id),
        getEvidenceForRoom(input.id),
      ]);
      // Attach votes to each claim and map to UI field names
      const claimsWithVotesMapped = await Promise.all(
        claims.map(async (claim) => {
          const votes = await getClaimVotes(claim.id);
          return {
            ...claim,
            votes,
            supportCount: claim.voteSupport ?? 0,
            opposeCount: claim.voteOppose ?? 0,
            abstainCount: claim.voteAbstain ?? 0,
            verdict: claim.adjudicationStatus,
            evidenceCount: (claim.voteSupport ?? 0) + (claim.voteOppose ?? 0) + (claim.voteAbstain ?? 0),
          };
        })
      );
      const evidenceMapped = evidence.map((e) => ({
        ...e,
        source: e.sourceName ?? e.sourceUrl ?? "Unknown source",
        publishedDate: e.publishedAt,
        claimsSupported: e.relationship === "supports" ? [e.sourceName ?? ""] : [],
        claimsContradicted: e.relationship === "contradicts" ? [e.sourceName ?? ""] : [],
      }));
      const AGENT_DOMAINS: Record<string, string> = {
        "partnership-intelligence": "Partnership Strategy",
        "scientific-evidence": "Clinical Evidence",
        "commercial": "Commercial Strategy",
        "legal-data-rights": "Legal / Data Rights",
        "red-team-risk": "Red-Team Risk",
        "executive-synthesis": "Executive Synthesis",
      };
      const agentMap = new Map<string, { agentId: string; agentName: string; domain: string; position: string; primaryClaim: string; confidence: number | null }>();
      for (const c of claims) {
        if (!agentMap.has(c.agentId)) {
          const pos = c.adjudicationStatus === "supported" ? "support"
            : c.adjudicationStatus === "contested" ? "conditional"
            : c.adjudicationStatus === "rejected" ? "oppose"
            : c.adjudicationStatus === "insufficient_evidence" ? "insufficient_evidence"
            : "abstain";
          agentMap.set(c.agentId, { agentId: c.agentId, agentName: c.agentName, domain: AGENT_DOMAINS[c.agentId] ?? c.agentName, position: pos, primaryClaim: c.claimText, confidence: c.confidence ?? null });
        }
      }
      const agentPositions = Array.from(agentMap.values());
      const synthesisText = room.recommendedAction ?? null;
      const principalRisk = room.minorityReport ?? null;
      const requiredConditions: string[] = [];
      if (room.recommendedAction) {
        const m = room.recommendedAction.match(/if\s+(.+)$/i);
        if (m) requiredConditions.push(...m[1].split(/,\s*(?:and\s+)?/).map((s) => s.trim()).filter(Boolean));
      }
      return { ...room, claims: claimsWithVotesMapped, evidence: evidenceMapped, agentPositions, synthesisText, requiredConditions, principalRisk };
    }),

  approve: protectedProcedure
    .input(z.object({
      id: z.number(),
      decision: z.enum(["approved", "modified", "rejected", "more_evidence"]),
      executiveNote: z.string().optional(),
      owner: z.string().optional(),
      deadline: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { updateDecisionRoom } = await import("./db");
      await updateDecisionRoom(input.id, {
        executiveDecision: input.decision,
        executiveNotes: input.executiveNote ?? null,
        decisionOwner: input.owner ?? null,
        decisionDeadline: input.deadline ? new Date(input.deadline) : null,
        decisionMadeAt: new Date(),
        status: "consensus_reached",
      });
      return { success: true };
    }),
});

// ─── Partnership Assets Router ────────────────────────────────────────────────
const partnershipAssetsRouter = router({
  list: protectedProcedure.query(() => getPartnershipAssets()),

  upsert: protectedProcedure
    .input(z.object({
      assetType: z.string(),
      partnerName: z.string(),
      partnerId: z.number().optional(),
      confidenceScore: z.number().optional(),
      targetOutcome: z.string().optional(),
      currentStatus: z.string().optional(),
      nextMilestone: z.string().optional(),
      decisionRequired: z.string().optional(),
      currentBlocker: z.string().optional(),
      evidenceProduced: z.array(z.string()).optional(),
      commercialImpact: z.string().optional(),
      strategicImpact: z.string().optional(),
      accountableOwner: z.string().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(({ input }) => upsertPartnershipAsset({
      title: input.partnerName,
      assetType: input.assetType as any,
      primaryPartnerId: input.partnerId ?? null,
      currentConfidence: input.confidenceScore ?? null,
      strategicObjective: input.targetOutcome ?? null,
      nextMilestone: input.nextMilestone ?? null,
      nextMilestoneDate: input.dueDate ? new Date(input.dueDate) : null,
      decisionRequired: input.decisionRequired ?? null,
      currentBlocker: input.currentBlocker ?? null,
      evidenceProduced: (input.evidenceProduced ?? null) as any,
      commercialImpact: input.commercialImpact ?? null,
      strategicImpact: input.strategicImpact ?? null,
      accountableOwner: input.accountableOwner ?? null,
    })),
});

// ─── Outcome Learning Router ──────────────────────────────────────────────────
const outcomeLearningRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(({ input }) => getOutcomeLearning({ limit: input?.limit })),

  recordActual: protectedProcedure
    .input(z.object({
      id: z.number(),
      actualOutcome: z.string(),
      accuracyScore: z.number(),
      wrongAssumptions: z.array(z.string()),
      correctAssumptions: z.array(z.string()),
      learningNote: z.string(),
    }))
    .mutation(({ input }) =>
      recordActualOutcome(
        input.id,
        input.actualOutcome,
        input.accuracyScore,
        input.wrongAssumptions,
        input.correctAssumptions,
        input.learningNote
      )
    ),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  knowledge: knowledgeRouter,
  regulatory: regulatoryRouter,
  competitive: competitiveRouter,
  partnerships: partnershipRouter,
  discrepancies: discrepancyRouter,
  alerts: alertsRouter,
  graph: graphRouter,
  dashboard: dashboardRouter,
  copilot: copilotRouter,
  boardMemo: boardMemoRouter,
  pharmaSignal: pharmaSignalRouter,
  media: mediaRouter,
  press: pressRouter,
  comments: commentsRouter,
  partnerCrm: partnerCrmRouter,
  connectors: connectorsRouter,
  scheduledAgents: scheduledAgentsRouter,
  decisionRooms: decisionRoomsRouter,
  partnershipAssets: partnershipAssetsRouter,
  outcomeLearning: outcomeLearningRouter,
});

export type AppRouter = typeof appRouter;
