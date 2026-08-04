import { and, desc, eq, like, lt, notInArray, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Alert,
  CiEvent,
  Competitor,
  Discrepancy,
  GraphEdge,
  GraphNode,
  InsertUser,
  KnowledgeItem,
  Partner,
  PartnerExecutive,
  RegulatoryItem,
  alerts,
  ciEvents,
  competitors,
  discrepancies,
  graphEdges,
  graphNodes,
  knowledgeItems,
  partnerExecutives,
  partners,
  regulatoryItems,
  users,
} from "../drizzle/schema";
import {
  InsertPharmaSignal,
  PharmaOutreachLog,
  PharmaSignal,
  pharmaOutreachLog,
  pharmaSignals,
} from "../drizzle/schema";
import {
  MediaItem, InsertMediaItem, mediaItems,
  PressItem, InsertPressItem, pressItems,
  SourceComment, InsertSourceComment, sourceComments,
  PartnerActivity, InsertPartnerActivity, partnerActivities,
  PartnerFlag, InsertPartnerFlag, partnerFlags,
  ConnectorConfig, InsertConnectorConfig, connectorConfigs,
} from "../drizzle/schema";
import {
  DecisionRoom, InsertDecisionRoom, decisionRooms,
  AgentClaim, InsertAgentClaim, agentClaims,
  ClaimVote, InsertClaimVote, claimVotes,
  EvidenceLedger, InsertEvidenceLedger, evidenceLedger,
  PartnershipAsset, InsertPartnershipAsset, partnershipAssets,
  OutcomeLearning, InsertOutcomeLearning, outcomeLearning,
} from "../drizzle/schema";
import {
  JobExecution, jobExecutions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Knowledge Base ───────────────────────────────────────────────────────────
export async function getKnowledgeItems(opts: {
  category?: string; search?: string; verificationStatus?: string; sourceType?: string; limit?: number; offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.category) conditions.push(eq(knowledgeItems.category, opts.category as KnowledgeItem["category"]));
  if (opts.verificationStatus) conditions.push(eq(knowledgeItems.verificationStatus, opts.verificationStatus as KnowledgeItem["verificationStatus"]));
  if (opts.sourceType) conditions.push(eq(knowledgeItems.sourceType, opts.sourceType as KnowledgeItem["sourceType"]));
  if (opts.search) conditions.push(or(like(knowledgeItems.title, `%${opts.search}%`), like(knowledgeItems.content, `%${opts.search}%`)));
  const query = db.select().from(knowledgeItems);
  if (conditions.length > 0) query.where(and(...conditions));
  return query.orderBy(desc(knowledgeItems.createdAt)).limit(opts.limit ?? 50).offset(opts.offset ?? 0);
}

export async function getKnowledgeItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(knowledgeItems).where(eq(knowledgeItems.id, id)).limit(1);
  return result[0];
}

export async function createKnowledgeItem(data: Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(knowledgeItems).values(data as any);
}

export async function countKnowledgeItems() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(knowledgeItems);
  return Number(result[0]?.count ?? 0);
}

export async function exportKnowledgeItemsCsv(opts: {
  category?: string; search?: string; verificationStatus?: string; sourceType?: string;
}) {
  const db = await getDb();
  if (!db) return "";
  const conditions = [];
  if (opts.category) conditions.push(eq(knowledgeItems.category, opts.category as KnowledgeItem["category"]));
  if (opts.verificationStatus) conditions.push(eq(knowledgeItems.verificationStatus, opts.verificationStatus as KnowledgeItem["verificationStatus"]));
  if (opts.sourceType) conditions.push(eq(knowledgeItems.sourceType, opts.sourceType as KnowledgeItem["sourceType"]));
  if (opts.search) conditions.push(or(like(knowledgeItems.title, `%${opts.search}%`), like(knowledgeItems.content, `%${opts.search}%`)));
  const query = db.select({
    id: knowledgeItems.id,
    title: knowledgeItems.title,
    category: knowledgeItems.category,
    sourceType: knowledgeItems.sourceType,
    verificationStatus: knowledgeItems.verificationStatus,
    sourceName: knowledgeItems.sourceName,
    author: knowledgeItems.author,
    sourceUrl: knowledgeItems.sourceUrl,
    publishedAt: knowledgeItems.publishedAt,
    summary: knowledgeItems.summary,
    tags: knowledgeItems.tags,
    createdAt: knowledgeItems.createdAt,
  }).from(knowledgeItems);
  if (conditions.length > 0) query.where(and(...conditions));
  const rows = await query.orderBy(desc(knowledgeItems.createdAt)).limit(2000);
  const escape = (v: unknown): string => {
    if (v == null) return '""';
    const s = Array.isArray(v) ? v.join("; ") : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = ["id","title","category","sourceType","verificationStatus","sourceName","author","sourceUrl","publishedAt","summary","tags","createdAt"];
  const lines = [header.join(","), ...rows.map(r => [
    r.id, r.title, r.category, r.sourceType, r.verificationStatus,
    r.sourceName, r.author, r.sourceUrl,
    r.publishedAt ? new Date(r.publishedAt as Date).toISOString() : null,
    r.summary, r.tags,
    r.createdAt ? new Date(r.createdAt as Date).toISOString() : null,
  ].map(escape).join(","))];
  return lines.join("\r\n");
}

// ─── Regulatory Tracker ───────────────────────────────────────────────────────
export async function getRegulatoryItems(opts: { body?: string; status?: string; impactLevel?: string; limit?: number; }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.body) conditions.push(eq(regulatoryItems.body, opts.body as RegulatoryItem["body"]));
  if (opts.status) conditions.push(eq(regulatoryItems.status, opts.status as RegulatoryItem["status"]));
  if (opts.impactLevel) conditions.push(sql`${regulatoryItems.impactLevel} = ${opts.impactLevel}`);
  const query = db.select().from(regulatoryItems);
  if (conditions.length > 0) query.where(and(...conditions));
  return query.orderBy(desc(regulatoryItems.createdAt)).limit(opts.limit ?? 100);
}

export async function createRegulatoryItem(data: Omit<RegulatoryItem, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(regulatoryItems).values(data as any);
}

export async function countRegulatoryItems() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(regulatoryItems);
  return Number(result[0]?.count ?? 0);
}

// ─── Competitive Intelligence ─────────────────────────────────────────────────
export async function getCompetitors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitors).orderBy(competitors.name);
}

export async function getCiEvents(opts: { competitorId?: number; limit?: number; }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.competitorId) conditions.push(eq(ciEvents.competitorId, opts.competitorId));
  const query = db.select().from(ciEvents);
  if (conditions.length > 0) query.where(and(...conditions));
  return query.orderBy(desc(ciEvents.createdAt)).limit(opts.limit ?? 50);
}

export async function createCiEvent(data: Omit<CiEvent, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(ciEvents).values(data as any);
}

// ─── Partnership Pipeline ─────────────────────────────────────────────────────
export async function getPartners(opts: { type?: string; tier?: string; stage?: string; region?: string; limit?: number; }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.type) conditions.push(eq(partners.type, opts.type as Partner["type"]));
  if (opts.tier) conditions.push(eq(partners.tier, opts.tier as Partner["tier"]));
  if (opts.stage) conditions.push(eq(partners.stage, opts.stage as Partner["stage"]));
  if (opts.region) conditions.push(eq(partners.region, opts.region as Partner["region"]));
  const query = db.select().from(partners);
  if (conditions.length > 0) query.where(and(...conditions));
  return query.orderBy(partners.tier, partners.name).limit(opts.limit ?? 100);
}

export async function getPartnerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
  return result[0];
}

export async function updatePartnerStage(id: number, stage: Partner["stage"]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(partners).set({ stage, updatedAt: new Date() }).where(eq(partners.id, id));
}

export async function getPartnerExecutives(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(partnerExecutives).where(eq(partnerExecutives.partnerId, partnerId));
}

export async function countPartnersByStage() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ stage: partners.stage, count: sql<number>`count(*)` }).from(partners).groupBy(partners.stage);
}

/**
 * Returns partners in active pipeline stages that have had no activity logged
 * in the last `staleDays` days (default 14). Excludes terminal stages.
 */
export async function getStalePartners(staleDays = 14) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
  const terminalStages: Partner["stage"][] = ["closed_won", "closed_lost", "on_hold"];
  // Partners not in terminal stages
  const activePartners = await db
    .select({ id: partners.id, name: partners.name, tier: partners.tier, stage: partners.stage, nextAction: partners.nextAction, updatedAt: partners.updatedAt })
    .from(partners)
    .where(notInArray(partners.stage, terminalStages));
  if (activePartners.length === 0) return [];
  // For each active partner, find the most recent activity
  const stale: typeof activePartners = [];
  for (const p of activePartners) {
    const recentActivity = await db
      .select({ loggedAt: partnerActivities.loggedAt })
      .from(partnerActivities)
      .where(eq(partnerActivities.partnerId, p.id))
      .orderBy(desc(partnerActivities.loggedAt))
      .limit(1);
    const lastActivity = recentActivity[0]?.loggedAt ?? null;
    // Stale if: no activity ever, OR last activity older than cutoff
    if (!lastActivity || lastActivity < cutoff) {
      stale.push(p);
    }
  }
  return stale;
}

// ─── Discrepancy Detector ─────────────────────────────────────────────────────
export async function getDiscrepancies(opts: { status?: string; severity?: string; limit?: number; }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.status) conditions.push(eq(discrepancies.status, opts.status as Discrepancy["status"]));
  if (opts.severity) conditions.push(eq(discrepancies.severity, opts.severity as Discrepancy["severity"]));
  const query = db.select().from(discrepancies);
  if (conditions.length > 0) query.where(and(...conditions));
  return query.orderBy(desc(discrepancies.createdAt)).limit(opts.limit ?? 50);
}

export async function updateDiscrepancyStatus(id: number, status: Discrepancy["status"], resolution?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(discrepancies).set({
    status,
    resolution: resolution ?? null,
    resolvedAt: status === "resolved" ? new Date() : null,
    updatedAt: new Date(),
  }).where(eq(discrepancies.id, id));
}

export async function countOpenDiscrepancies() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(discrepancies).where(eq(discrepancies.status, "open"));
  return Number(result[0]?.count ?? 0);
}

export async function createDiscrepancy(data: Omit<Discrepancy, "id" | "createdAt" | "updatedAt" | "resolvedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(discrepancies).values(data as any);
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export async function getAlerts(opts: { isRead?: boolean; type?: string; limit?: number; }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.isRead !== undefined) conditions.push(eq(alerts.isRead, opts.isRead));
  if (opts.type) conditions.push(eq(alerts.type, opts.type as Alert["type"]));
  const query = db.select().from(alerts);
  if (conditions.length > 0) query.where(and(...conditions));
  return query.orderBy(desc(alerts.createdAt)).limit(opts.limit ?? 50);
}

export async function markAlertRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
}

export async function countUnreadAlerts() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(alerts).where(eq(alerts.isRead, false));
  return Number(result[0]?.count ?? 0);
}

export async function createAlert(data: Omit<Alert, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(alerts).values(data as any);
}

// ─── Knowledge Graph ──────────────────────────────────────────────────────────
// ─── Partner Create ───────────────────────────────────────────────────────────
export async function createPartner(data: Omit<typeof partners.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(partners).values(data as any);
  return result;
}

export async function getGraphNodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(graphNodes);
}

export async function getGraphEdges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(graphEdges);
}

// ─── Pharma Signal Engine ─────────────────────────────────────────────────────

export async function getPharmaSignals(opts?: {
  status?: PharmaSignal["status"];
  signalType?: PharmaSignal["signalType"];
  companyType?: PharmaSignal["companyType"];
  region?: PharmaSignal["region"];
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const { eq, and, desc } = await import("drizzle-orm");
  const conditions = [];
  if (opts?.status) conditions.push(eq(pharmaSignals.status, opts.status));
  if (opts?.signalType) conditions.push(eq(pharmaSignals.signalType, opts.signalType));
  if (opts?.companyType) conditions.push(eq(pharmaSignals.companyType, opts.companyType));
  if (opts?.region) conditions.push(eq(pharmaSignals.region, opts.region));
  const query = db
    .select()
    .from(pharmaSignals)
    .orderBy(desc(pharmaSignals.compositeScore))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function getPharmaSignalById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(pharmaSignals).where(eq(pharmaSignals.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createPharmaSignal(data: Omit<InsertPharmaSignal, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const composite = computeCompositeScore(
    data.signalStrength ?? 5,
    data.fitScore ?? 5,
    data.urgencyScore ?? 5,
    data.accessScore ?? 5,
  );
  await db.insert(pharmaSignals).values({ ...data, compositeScore: composite } as any);
}

export async function updatePharmaSignalStatus(id: number, status: PharmaSignal["status"]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(pharmaSignals).set({ status }).where(eq(pharmaSignals.id, id));
}

export async function updatePharmaSignalNotes(id: number, notes: string, biorceAngle?: string, proposedOutreach?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(pharmaSignals).set({ notes, biorceAngle, proposedOutreach }).where(eq(pharmaSignals.id, id));
}

export async function logPharmaOutreach(data: Omit<PharmaOutreachLog, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(pharmaOutreachLog).values(data as any);
}

export async function getPharmaOutreachLog(signalId: number) {
  const db = await getDb();
  if (!db) return [];
  const { eq, desc } = await import("drizzle-orm");
  return db.select().from(pharmaOutreachLog).where(eq(pharmaOutreachLog.signalId, signalId)).orderBy(desc(pharmaOutreachLog.loggedAt));
}

function computeCompositeScore(strength: number, fit: number, urgency: number, access: number): number {
  // Weighted: signal strength 35%, fit 35%, urgency 20%, access 10%
  return Math.round((strength * 0.35 + fit * 0.35 + urgency * 0.2 + access * 0.1) * 10) / 10;
}

// ─── Media Library ────────────────────────────────────────────────────────────
export async function getMediaItems(opts?: { mediaType?: string; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const { like, eq, and, desc, or } = await import("drizzle-orm");
  const conditions: any[] = [];
  if (opts?.mediaType) conditions.push(eq(mediaItems.mediaType, opts.mediaType as any));
  if (opts?.search) conditions.push(or(like(mediaItems.title, `%${opts.search}%`), like(mediaItems.source, `%${opts.search}%`)));
  const q = db.select().from(mediaItems).orderBy(desc(mediaItems.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0);
  if (conditions.length > 0) return q.where(and(...conditions));
  return q;
}

export async function getMediaItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(mediaItems).where(eq(mediaItems.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createMediaItem(data: Omit<InsertMediaItem, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(mediaItems).values(data as any);
}

export async function updateMediaItem(id: number, data: Partial<Omit<InsertMediaItem, "id" | "createdAt">>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(mediaItems).set(data as any).where(eq(mediaItems.id, id));
}

export async function deleteMediaItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.delete(mediaItems).where(eq(mediaItems.id, id));
}

export async function countMediaItems() {
  const db = await getDb();
  if (!db) return 0;
  const { sql } = await import("drizzle-orm");
  const result = await db.select({ count: sql<number>`count(*)` }).from(mediaItems);
  return Number(result[0]?.count ?? 0);
}

// ─── Press Room ───────────────────────────────────────────────────────────────
export async function getPressItems(opts?: { pressType?: string; sentiment?: string; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const { like, eq, and, desc, or } = await import("drizzle-orm");
  const conditions: any[] = [];
  if (opts?.pressType) conditions.push(eq(pressItems.pressType, opts.pressType as any));
  if (opts?.sentiment) conditions.push(eq(pressItems.sentiment, opts.sentiment as any));
  if (opts?.search) conditions.push(or(like(pressItems.title, `%${opts.search}%`), like(pressItems.outlet, `%${opts.search}%`)));
  const q = db.select().from(pressItems).orderBy(desc(pressItems.publishedAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0);
  if (conditions.length > 0) return q.where(and(...conditions));
  return q;
}

export async function getPressItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(pressItems).where(eq(pressItems.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createPressItem(data: Omit<InsertPressItem, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(pressItems).values(data as any);
}

export async function updatePressItem(id: number, data: Partial<Omit<InsertPressItem, "id" | "createdAt">>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(pressItems).set(data as any).where(eq(pressItems.id, id));
}

export async function deletePressItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.delete(pressItems).where(eq(pressItems.id, id));
}

export async function countPressItems() {
  const db = await getDb();
  if (!db) return 0;
  const { sql } = await import("drizzle-orm");
  const result = await db.select({ count: sql<number>`count(*)` }).from(pressItems);
  return Number(result[0]?.count ?? 0);
}

// ─── Source Comments ──────────────────────────────────────────────────────────
export async function getSourceComments(targetTable: string, targetId: number) {
  const db = await getDb();
  if (!db) return [];
  const { eq, and, desc } = await import("drizzle-orm");
  return db.select().from(sourceComments)
    .where(and(eq(sourceComments.targetTable, targetTable), eq(sourceComments.targetId, targetId)))
    .orderBy(desc(sourceComments.createdAt));
}

export async function createSourceComment(data: Omit<InsertSourceComment, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(sourceComments).values(data as any);
}

export async function updateSourceCommentStatus(id: number, status: SourceComment["status"]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(sourceComments).set({ status, resolvedAt: status !== "open" ? new Date() : null } as any).where(eq(sourceComments.id, id));
}

export async function deleteSourceComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.delete(sourceComments).where(eq(sourceComments.id, id));
}

// ─── Partner Activities ───────────────────────────────────────────────────────
export async function getPartnerActivities(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  const { eq, desc } = await import("drizzle-orm");
  return db.select().from(partnerActivities).where(eq(partnerActivities.partnerId, partnerId)).orderBy(desc(partnerActivities.loggedAt));
}

export async function createPartnerActivity(data: Omit<InsertPartnerActivity, "id" | "createdAt" | "loggedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(partnerActivities).values(data as any);
}

export async function deletePartnerActivity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.delete(partnerActivities).where(eq(partnerActivities.id, id));
}

// ─── Partner Flags ────────────────────────────────────────────────────────────
export async function getPartnerFlags(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  const { eq, desc } = await import("drizzle-orm");
  return db.select().from(partnerFlags).where(eq(partnerFlags.partnerId, partnerId)).orderBy(desc(partnerFlags.createdAt));
}

export async function createPartnerFlag(data: Omit<InsertPartnerFlag, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(partnerFlags).values(data as any);
}

export async function resolvePartnerFlag(id: number, status: "resolved" | "dismissed") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(partnerFlags).set({ status, resolvedAt: new Date() } as any).where(eq(partnerFlags.id, id));
}

export async function deletePartnerFlag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.delete(partnerFlags).where(eq(partnerFlags.id, id));
}

// ─── Connector Configs ────────────────────────────────────────────────────────
export async function getConnectorConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(connectorConfigs);
}

export async function upsertConnectorConfig(data: Omit<InsertConnectorConfig, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  const existing = await db.select().from(connectorConfigs).where(eq(connectorConfigs.connectorType, data.connectorType)).limit(1);
  if (existing.length > 0) {
    await db.update(connectorConfigs).set(data as any).where(eq(connectorConfigs.id, existing[0].id));
  } else {
    await db.insert(connectorConfigs).values(data as any);
  }
}

export async function toggleConnector(id: number, isEnabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(connectorConfigs).set({ isEnabled } as any).where(eq(connectorConfigs.id, id));
}

// ─── Decision Rooms ───────────────────────────────────────────────────────────
export async function createDecisionRoom(data: Omit<InsertDecisionRoom, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(decisionRooms).values(data as any);
  return (result as any).insertId as number;
}

export async function getDecisionRooms(opts: { partnerId?: number; status?: string; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const { eq, desc: descOp } = await import("drizzle-orm");
  const q = db.select().from(decisionRooms).orderBy(descOp(decisionRooms.createdAt)).limit(opts.limit ?? 50);
  return q;
}

export async function getDecisionRoomById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(decisionRooms).where(eq(decisionRooms.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * Finds an open/deliberating/consensus_reached Decision Room that is likely a duplicate
 * of the given question. Checks by: partner, normalized title keywords, and status.
 * Returns the first match or null.
 */
export async function findSimilarDecisionRoom(
  question: string,
  partnerId?: number | null
): Promise<{ room: typeof decisionRooms.$inferSelect; similarity: number } | null> {
  const db = await getDb();
  if (!db) return null;
  const { like, or, and, eq, inArray, desc: descOp } = await import("drizzle-orm");
  // Extract first 5 meaningful words from question for fuzzy title match
  const keywords = question.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !["what","that","this","with","from","have","will","should","which","whether"].includes(w))
    .slice(0, 5);

  const openStatuses = ["open", "deliberating", "consensus_reached"] as const;
  const rows = await db.select().from(decisionRooms)
    .where(inArray(decisionRooms.status, openStatuses))
    .orderBy(descOp(decisionRooms.createdAt))
    .limit(50);

  // Score each row by keyword overlap
  const scored = rows.map(row => {
    const titleWords = (row.title + " " + (row.question ?? "")).toLowerCase();
    const overlap = keywords.filter(k => titleWords.includes(k)).length;
    const partnerMatch = partnerId && row.partnerId === partnerId ? 2 : 0;
    return { row, score: overlap + partnerMatch };
  });
  scored.sort((a, b) => b.score - a.score);
  // Require at least 3 keyword overlaps to consider it a duplicate
  if (!scored[0] || scored[0].score < 3) return null;
  const similarity = Math.min(100, Math.round((scored[0].score / Math.max(keywords.length, 1)) * 100));
  return { room: scored[0].row, similarity };
}

export async function updateDecisionRoom(id: number, data: Partial<Omit<InsertDecisionRoom, "id" | "createdAt">>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(decisionRooms).set(data as any).where(eq(decisionRooms.id, id));
}

// ─── Agent Claims ─────────────────────────────────────────────────────────────
export async function createAgentClaim(data: Omit<InsertAgentClaim, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(agentClaims).values(data as any);
  return (result as any).insertId as number;
}

export async function getAgentClaims(decisionRoomId: number) {
  const db = await getDb();
  if (!db) return [];
  const { eq, asc } = await import("drizzle-orm");
  return db.select().from(agentClaims).where(eq(agentClaims.decisionRoomId, decisionRoomId)).orderBy(asc(agentClaims.round), asc(agentClaims.createdAt));
}

export async function updateAgentClaimAdjudication(id: number, status: AgentClaim["adjudicationStatus"], support: number, oppose: number, abstain: number, insufficient: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(agentClaims).set({ adjudicationStatus: status, voteSupport: support, voteOppose: oppose, voteAbstain: abstain, voteInsufficientEvidence: insufficient } as any).where(eq(agentClaims.id, id));
}

// ─── Claim Votes ─────────────────────────────────────────────────────────────
export async function createClaimVote(data: Omit<InsertClaimVote, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(claimVotes).values(data as any);
}

export async function getClaimVotes(claimId: number) {
  const db = await getDb();
  if (!db) return [];
  const { eq } = await import("drizzle-orm");
  return db.select().from(claimVotes).where(eq(claimVotes.claimId, claimId));
}

// ─── Evidence Ledger ──────────────────────────────────────────────────────────
export async function createEvidenceEntry(data: Omit<InsertEvidenceLedger, "id" | "createdAt" | "retrievedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(evidenceLedger).values(data as any);
  return (result as any).insertId as number;
}

export async function getEvidenceForClaim(claimId: number) {
  const db = await getDb();
  if (!db) return [];
  const { eq } = await import("drizzle-orm");
  return db.select().from(evidenceLedger).where(eq(evidenceLedger.claimId, claimId));
}

export async function getEvidenceForRoom(decisionRoomId: number) {
  const db = await getDb();
  if (!db) return [];
  const { eq } = await import("drizzle-orm");
  return db.select().from(evidenceLedger).where(eq(evidenceLedger.decisionRoomId, decisionRoomId));
}

// ─── Partnership Assets ───────────────────────────────────────────────────────
export async function getPartnershipAssets() {
  const db = await getDb();
  if (!db) return [];
  const { asc } = await import("drizzle-orm");
  return db.select().from(partnershipAssets).orderBy(asc(partnershipAssets.assetType));
}

export async function upsertPartnershipAsset(data: Omit<InsertPartnershipAsset, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  const existing = await db.select().from(partnershipAssets).where(eq(partnershipAssets.assetType, data.assetType)).limit(1);
  if (existing.length > 0) {
    await db.update(partnershipAssets).set(data as any).where(eq(partnershipAssets.id, existing[0].id));
    return existing[0].id;
  } else {
    const [result] = await db.insert(partnershipAssets).values(data as any);
    return (result as any).insertId as number;
  }
}

export async function updatePartnershipAsset(id: number, data: Partial<Omit<InsertPartnershipAsset, "id" | "createdAt">>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(partnershipAssets).set(data as any).where(eq(partnershipAssets.id, id));
}

// ─── Outcome Learning ─────────────────────────────────────────────────────────
export async function createOutcomePrediction(data: Omit<InsertOutcomeLearning, "id" | "createdAt" | "updatedAt" | "predictedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(outcomeLearning).values(data as any);
  return (result as any).insertId as number;
}

export async function recordActualOutcome(id: number, actualOutcome: string, accuracyScore: number, wrongAssumptions: string[], correctAssumptions: string[], learningNote: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq } = await import("drizzle-orm");
  await db.update(outcomeLearning).set({ actualOutcome, actualRecordedAt: new Date(), accuracyScore, wrongAssumptions: wrongAssumptions as any, correctAssumptions: correctAssumptions as any, learningNote } as any).where(eq(outcomeLearning.id, id));
}

export async function getOutcomeLearning(opts: { partnerId?: number; agentId?: string; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const { desc: descOp } = await import("drizzle-orm");
  return db.select().from(outcomeLearning).orderBy(descOp(outcomeLearning.predictedAt)).limit(opts.limit ?? 50);
}

// ─── Job Executions ───────────────────────────────────────────────────────────

/**
 * Acquire an idempotency lock for a job run.
 * Returns the new execution record ID if the slot was free,
 * or null if a record with the same idempotencyKey already exists.
 */
export async function acquireJobExecution(opts: {
  jobName: string;
  taskUid?: string;
  idempotencyKey: string;
  triggeredBy?: string;
  force?: boolean;
  parentExecutionId?: number;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // ── If force=true, skip idempotency check (admin forced rerun) ───────────
  if (!opts.force) {
    // Check for existing non-stale record (idempotency guard)
    const lockLeaseCutoff = new Date(Date.now() - 30 * 60 * 1000); // 30-min lease
    const existing = await db
      .select({ id: jobExecutions.id, status: jobExecutions.status, inFlight: jobExecutions.inFlight, lockExpiresAt: (jobExecutions as any).lockExpiresAt })
      .from(jobExecutions)
      .where(eq(jobExecutions.idempotencyKey, opts.idempotencyKey))
      .limit(1);
    if (existing.length > 0) {
      const rec = existing[0];
      // Allow reclaim if job is in-flight but lock lease has expired (crashed job)
      const isStale = rec.inFlight && rec.lockExpiresAt && new Date(rec.lockExpiresAt) < lockLeaseCutoff;
      if (!isStale) {
        console.log(`[job-exec] Duplicate run blocked — idempotencyKey=${opts.idempotencyKey} exists (id=${rec.id}, status=${rec.status})`);
        return null;
      }
      // Stale lock — delete the crashed record and allow a fresh attempt
      console.log(`[job-exec] Stale lock reclaimed — idempotencyKey=${opts.idempotencyKey} (id=${rec.id}, lockExpiresAt=${rec.lockExpiresAt})`);
      await db.delete(jobExecutions).where(eq(jobExecutions.id, rec.id));
    }
  }

  // ── Atomic INSERT — unique constraint on idempotencyKey prevents races ───
  const lockExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30-min lease
  const [result] = await db.insert(jobExecutions).values({
    jobName: opts.jobName,
    taskUid: opts.taskUid,
    idempotencyKey: opts.idempotencyKey,
    inFlight: true,
    lockExpiresAt,
    status: "running",
    triggeredBy: opts.triggeredBy ?? "cron",
    attemptNumber: 1,
    maxAttempts: 3,
    parentExecutionId: opts.parentExecutionId,
  } as any);
  return (result as any).insertId as number;
}

/** Mark a job execution as succeeded and release the concurrency lock. */
export async function completeJobExecution(id: number, opts: {
  recordsRead?: number;
  recordsWritten?: number;
  alertsCreated?: number;
  durationMs: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(jobExecutions).set({
    status: "success",
    inFlight: false,
    completedAt: new Date(),
    durationMs: opts.durationMs,
    recordsRead: opts.recordsRead ?? 0,
    recordsWritten: opts.recordsWritten ?? 0,
    alertsCreated: opts.alertsCreated ?? 0,
  } as any).where(eq(jobExecutions.id, id));
}

/** Mark a job execution as failed, record error detail, and optionally escalate. */
export async function failJobExecution(id: number, opts: {
  errorMessage: string;
  errorStack?: string;
  durationMs: number;
  escalate?: boolean;
  escalationNote?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(jobExecutions).set({
    status: "failed",
    inFlight: false,
    completedAt: new Date(),
    durationMs: opts.durationMs,
    errorMessage: opts.errorMessage,
    errorStack: opts.errorStack,
    escalated: opts.escalate ?? false,
    escalationNote: opts.escalationNote,
  } as any).where(eq(jobExecutions.id, id));
}

/** Fetch recent execution records for a given job name. */
export async function getJobExecutions(jobName: string, limit = 10): Promise<JobExecution[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(jobExecutions)
    .where(eq(jobExecutions.jobName, jobName))
    .orderBy(desc(jobExecutions.startedAt))
    .limit(limit) as Promise<JobExecution[]>;
}

/** Fetch the most recent execution for every distinct job name (Admin panel status row). */
export async function getLatestJobExecutions(): Promise<JobExecution[]> {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql`
    SELECT je.*
    FROM job_executions je
    INNER JOIN (
      SELECT jobName, MAX(startedAt) AS maxStarted
      FROM job_executions
      GROUP BY jobName
    ) latest ON je.jobName = latest.jobName AND je.startedAt = latest.maxStarted
    ORDER BY je.startedAt DESC
  `);
  return rows as unknown as JobExecution[];
}

/** Count consecutive failures for a job (for escalation threshold check). */
export async function countConsecutiveFailures(jobName: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const recent = await db
    .select({ status: jobExecutions.status })
    .from(jobExecutions)
    .where(eq(jobExecutions.jobName, jobName))
    .orderBy(desc(jobExecutions.startedAt))
    .limit(3);
  return recent.filter(r => r.status === "failed").length;
}

// ─── Decision Room Candidates ─────────────────────────────────────────────────
// Secure token design: the raw token is returned once to the client and NEVER
// stored. Only the SHA-256 hex digest is persisted. All gate metadata is frozen
// in payloadJson at issuance time — the client cannot modify any field.
import { randomBytes, createHash } from "crypto";
import {
  DecisionRoomCandidate, decisionRoomCandidates,
} from "../drizzle/schema";

export type CandidatePayload = {
  question: string;
  normalizedQuestion: string;
  gateConfidence: number;
  gateMateriality: string;
  gateRationale: string;
  gateVersion: string;
  gateAlternatives: string[];
  gateProposedOwner: string | null;
  gateProposedDeadline: string | null;
  duplicateRoomId: number | null;
  duplicateSimilarity: number | null;
  duplicateStatus: string | null;
  duplicateQuestion: string | null;
  copilotRunId: string | null;
};

/**
 * Issue a new server-side candidate.
 * Returns the raw token (returned once to the client, never stored).
 * Stores only the SHA-256 hash of the token in the database.
 * Expires in 30 minutes.
 */
export async function issueDecisionRoomCandidate(
  userOpenId: string,
  payload: CandidatePayload,
  ttlMs = 30 * 60 * 1000
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + ttlMs);
  await db.insert(decisionRoomCandidates).values({
    tokenHash,
    userOpenId,
    payloadJson: payload,
    expiresAt,
  } as any);
  // Return the raw token — this is the ONLY time it is available
  return rawToken;
}

/**
 * Fetch a candidate by raw token (hashes it internally).
 * Returns undefined if not found.
 */
export async function getDecisionRoomCandidate(rawToken: string): Promise<DecisionRoomCandidate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const result = await db.select().from(decisionRoomCandidates).where(eq(decisionRoomCandidates.tokenHash, tokenHash)).limit(1);
  return result[0];
}

/**
 * Mark a candidate as consumed, recording the action and resulting room ID.
 * Uses the raw token (hashed internally).
 */
export async function consumeDecisionRoomCandidate(
  rawToken: string,
  resultingRoomId: number,
  action: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  await db.update(decisionRoomCandidates).set({
    consumedAt: new Date(),
    consumedAction: action,
    resultingRoomId,
  }).where(eq(decisionRoomCandidates.tokenHash, tokenHash));
}

/**
 * Delete expired unconsumed candidates older than the given cutoff.
 * Called by the scheduled cleanup job.
 */
export async function deleteExpiredCandidates(cutoff: Date): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.delete(decisionRoomCandidates).where(
    and(
      lt(decisionRoomCandidates.expiresAt, cutoff),
      sql`${decisionRoomCandidates.consumedAt} IS NULL`
    )
  );
  return (result as any)[0]?.affectedRows ?? 0;
}
