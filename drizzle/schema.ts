import {
  boolean,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Knowledge Base ───────────────────────────────────────────────────────────
export const knowledgeItems = mysqlTable("knowledge_items", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  category: mysqlEnum("category", [
    "podcast",
    "press_release",
    "regulatory",
    "competitor",
    "internal",
    "investor",
    "public_statement",
    "research",
  ]).notNull(),
  sourceType: mysqlEnum("sourceType", ["primary", "secondary", "inferred"]).notNull().default("primary"),
  verificationStatus: mysqlEnum("verificationStatus", ["verified", "inferred", "unverified"]).notNull().default("verified"),
  sourceUrl: text("sourceUrl"),
  sourceName: varchar("sourceName", { length: 256 }),
  author: varchar("author", { length: 256 }),
  publishedAt: timestamp("publishedAt"),
  tags: json("tags").$type<string[]>().default([]),
  entities: json("entities").$type<string[]>().default([]),
  isConfidential: boolean("isConfidential").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KnowledgeItem = typeof knowledgeItems.$inferSelect;

// ─── Regulatory Tracker ───────────────────────────────────────────────────────
export const regulatoryItems = mysqlTable("regulatory_items", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  body: mysqlEnum("body", ["FDA_DHCOE", "EMA_ITF", "EU_AI_ACT", "ICH_M11", "CDISC_USDM", "MHRA", "OTHER"]).notNull(),
  type: mysqlEnum("type", ["guidance", "deadline", "draft", "final_rule", "public_comment", "enforcement"]).notNull(),
  status: mysqlEnum("status", ["active", "upcoming", "expired", "draft"]).notNull().default("active"),
  description: text("description"),
  impactLevel: mysqlEnum("impactLevel", ["critical", "high", "medium", "low"]).default("medium"),
  deadline: timestamp("deadline"),
  effectiveDate: timestamp("effectiveDate"),
  sourceUrl: text("sourceUrl"),
  alertSent: boolean("alertSent").default(false).notNull(),
  biorceRelevance: text("biorceRelevance"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RegulatoryItem = typeof regulatoryItems.$inferSelect;

// ─── Competitive Intelligence ─────────────────────────────────────────────────
export const competitors = mysqlTable("competitors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  category: mysqlEnum("category", ["direct", "adjacent", "platform", "acquirer"]).notNull().default("direct"),
  website: varchar("website", { length: 256 }),
  description: text("description"),
  fundingTotal: varchar("fundingTotal", { length: 64 }),
  lastFundingRound: varchar("lastFundingRound", { length: 64 }),
  threatLevel: mysqlEnum("threatLevel", ["critical", "high", "medium", "low"]).default("medium"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Competitor = typeof competitors.$inferSelect;

export const ciEvents = mysqlTable("ci_events", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  type: mysqlEnum("type", ["press_release", "product_launch", "partnership", "funding", "regulatory", "personnel", "other"]).notNull(),
  summary: text("summary"),
  sourceUrl: text("sourceUrl"),
  publishedAt: timestamp("publishedAt"),
  alertSent: boolean("alertSent").default(false).notNull(),
  biorceImplication: text("biorceImplication"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CiEvent = typeof ciEvents.$inferSelect;

// ─── Partnership Pipeline ─────────────────────────────────────────────────────
export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["pharma", "cro", "tech", "hospital", "regulator", "investor", "standards_body", "lobby"]).notNull(),
  tier: mysqlEnum("tier", ["P0", "P1", "P2", "P3"]).notNull().default("P2"),
  stage: mysqlEnum("stage", [
    "identified", "researching", "outreach", "intro_meeting",
    "negotiating", "loi_signed", "active", "closed_won", "closed_lost", "on_hold",
  ]).notNull().default("identified"),
  region: mysqlEnum("region", ["US", "EU", "GLOBAL"]).notNull().default("US"),
  website: varchar("website", { length: 256 }),
  description: text("description"),
  mutualValue: text("mutualValue"),
  dealEconomics: text("dealEconomics"),
  killCriteria: text("killCriteria"),
  nextAction: text("nextAction"),
  nextActionDate: timestamp("nextActionDate"),
  estimatedArrImpact: varchar("estimatedArrImpact", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Partner = typeof partners.$inferSelect;

export const partnerExecutives = mysqlTable("partner_executives", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  title: varchar("title", { length: 256 }),
  email: varchar("email", { length: 320 }),
  linkedinUrl: text("linkedinUrl"),
  isPrimaryContact: boolean("isPrimaryContact").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PartnerExecutive = typeof partnerExecutives.$inferSelect;

// ─── Discrepancy Detector ─────────────────────────────────────────────────────
export const discrepancies = mysqlTable("discrepancies", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", [
    "internal_vs_public", "competitor_claim", "regulatory_conflict", "strategy_drift", "data_inconsistency",
  ]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull().default("medium"),
  status: mysqlEnum("status", ["open", "investigating", "resolved", "dismissed"]).notNull().default("open"),
  sourceA: text("sourceA"),
  sourceB: text("sourceB"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Discrepancy = typeof discrepancies.$inferSelect;

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["regulatory", "competitive", "partnership", "discrepancy", "digest"]).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  body: text("body").notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull().default("medium"),
  isRead: boolean("isRead").default(false).notNull(),
  sourceId: int("sourceId"),
  sourceTable: varchar("sourceTable", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Alert = typeof alerts.$inferSelect;

// ─── Knowledge Graph ──────────────────────────────────────────────────────────
export const graphNodes = mysqlTable("graph_nodes", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["company", "person", "regulator", "standard", "product", "event"]).notNull(),
  metadata: json("metadata").$type<Record<string, string>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GraphNode = typeof graphNodes.$inferSelect;

export const graphEdges = mysqlTable("graph_edges", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  targetId: int("targetId").notNull(),
  relationship: varchar("relationship", { length: 256 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["verified", "inferred"]).notNull().default("verified"),
  weight: float("weight").default(1.0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GraphEdge = typeof graphEdges.$inferSelect;
