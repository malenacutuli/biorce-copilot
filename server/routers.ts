import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  countKnowledgeItems, countOpenDiscrepancies, countUnreadAlerts,
  countPartnersByStage, createAlert, createCiEvent, createKnowledgeItem,
  createRegulatoryItem, getAlerts, getCiEvents, getCompetitors,
  getDiscrepancies, getGraphEdges, getGraphNodes, getKnowledgeItemById,
  getKnowledgeItems, getPartnerById, getPartnerExecutives, getPartners,
  getRegulatoryItems, getUserByOpenId, markAlertRead, updateDiscrepancyStatus,
  updatePartnerStage, upsertUser,
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

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getKnowledgeItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  count: protectedProcedure.query(() => countKnowledgeItems()),
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
    }))
    .mutation(async ({ input }) => {
      // Fetch relevant context from knowledge base
      const relevantItems = await getKnowledgeItems({ search: input.question.slice(0, 100), limit: 5 });
      const regulatoryContext = await getRegulatoryItems({ limit: 10 });
      const competitorContext = await getCompetitors();

      const knowledgeContext = relevantItems.map(item =>
        `[SOURCE: ${item.sourceName ?? "Biorce Intelligence"} | ${item.verificationStatus.toUpperCase()} | ${item.category}]\n${item.title}\n${item.summary ?? item.content.slice(0, 500)}`
      ).join("\n\n---\n\n");

      const regulatoryCtx = regulatoryContext.slice(0, 5).map(r =>
        `[REGULATORY: ${r.body} | ${r.status.toUpperCase()}] ${r.title}`
      ).join("\n");

      const competitorCtx = competitorContext.map(c =>
        `[COMPETITOR: ${c.name} | Threat: ${c.threatLevel}] ${c.description ?? ""}`
      ).join("\n");

      const systemPrompt = `You are the Biorce Strategy Copilot — an internal executive intelligence assistant for Biorce, a clinical AI infrastructure company.

RULES (non-negotiable):
1. ONLY cite primary sources from the knowledge base provided. Never fabricate citations.
2. Every factual claim MUST include a source citation in the format [SOURCE: name].
3. Distinguish clearly between VERIFIED facts and INFERRED relationships.
4. Never speculate about confidential client data.
5. If you don't have sufficient verified information to answer, say so explicitly.
6. Focus on strategic, commercial, and regulatory implications relevant to Biorce's partnerships and growth.

BIORCE CONTEXT:
- Company: Biorce — AI infrastructure for clinical trials. NOT a CRO, NOT a pharma company.
- Founders: Pedro Coelho (CEO), Clara Bernardes (CSO), Diogo Coelho (CTO), José Coelho (CPO)
- HQ: Austin, TX (primary) + Barcelona (R&D)
- Series A: €43.8M (DST Global, Norrsken, TZR Capital, Nik Storonsky, Arthur Mensch)
- ARR at Series A: ~$9.3M (growing rapidly)
- Key product: Aika 2.0 — AI protocol generation, amendment reduction, regulatory submission support
- North Star: One-click clinical trial
- Pricing: $250K/year minimum; enterprise contracts in the tens of millions
- Strategic constraint: NEVER become a CRO or develop drug assets

KNOWLEDGE BASE (verified intelligence):
${knowledgeContext}

REGULATORY LANDSCAPE:
${regulatoryCtx}

COMPETITIVE LANDSCAPE:
${competitorCtx}

Answer the question with precision, cite your sources, and flag any gaps in verified intelligence.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...input.conversationHistory.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: input.question },
      ];

      const response = await invokeLLM({ messages });
      const content = response.choices?.[0]?.message?.content ?? "Unable to generate response.";
      return { answer: content, sourcesUsed: relevantItems.map(i => ({ id: i.id, title: i.title, sourceName: i.sourceName, verificationStatus: i.verificationStatus })) };
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
});

export type AppRouter = typeof appRouter;
