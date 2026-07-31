import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { runBiorceOrchestrator, getAvailableAgents } from "./agentOrchestrator";
import {
  countKnowledgeItems, countOpenDiscrepancies, countUnreadAlerts,
  countPartnersByStage, createAlert, createCiEvent, createKnowledgeItem,
  createPartner, createRegulatoryItem, getAlerts, getCiEvents, getCompetitors,
  getDiscrepancies, getGraphEdges, getGraphNodes, getKnowledgeItemById,
  getKnowledgeItems, getPartnerById, getPartnerExecutives, getPartners,
  getRegulatoryItems, getUserByOpenId, markAlertRead, updateDiscrepancyStatus,
  updatePartnerStage, upsertUser,
} from "./db";
import { exportKnowledgeItemsCsv } from "./db";

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
      const relevantItems = await getKnowledgeItems({ search: input.question.slice(0, 100), limit: 8 });
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
        // Multi-agent orchestrated answer
        const { answer, agentResults } = await runBiorceOrchestrator({
          question: input.question,
          conversationHistory: input.conversationHistory,
          knowledgeBase: knowledgeContext,
          regulatoryContext: regulatoryCtx,
          competitorContext: competitorCtx,
          partnerContext: partnerCtx,
        });
        return {
          answer: null,
          orchestratedAnswer: answer,
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

  agents: protectedProcedure.query(() => getAvailableAgents()),
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
});

export type AppRouter = typeof appRouter;
