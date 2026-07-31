import { and, desc, eq, like, or, sql } from "drizzle-orm";
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
