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

// ─── Pharma Signal Engine ─────────────────────────────────────────────────────
export const pharmaSignals = mysqlTable("pharma_signals", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  companySlug: varchar("companySlug", { length: 64 }).notNull(),
  companyType: mysqlEnum("companyType", ["big_pharma", "mid_pharma", "biotech", "cro", "tech_pharma"]).notNull().default("big_pharma"),
  region: mysqlEnum("region", ["US", "EU", "GLOBAL", "APAC"]).notNull().default("US"),
  // Signal metadata
  signalType: mysqlEnum("signalType", [
    "executive_hire", "internal_build", "failed_internal", "conference_presentation",
    "rfp_activity", "hiring_cluster", "partnership_gap", "regulatory_pressure", "funding_event",
  ]).notNull(),
  signalTitle: varchar("signalTitle", { length: 512 }).notNull(),
  signalSummary: text("signalSummary").notNull(),
  signalDate: timestamp("signalDate"),
  sourceUrl: text("sourceUrl"),
  sourceName: varchar("sourceName", { length: 256 }),
  // Scoring (1-10 each)
  signalStrength: int("signalStrength").notNull().default(5),   // How clear is the buying intent?
  fitScore: int("fitScore").notNull().default(5),               // Does Biorce solve their stated problem?
  urgencyScore: int("urgencyScore").notNull().default(5),       // Time sensitivity
  accessScore: int("accessScore").notNull().default(5),         // Existing relationship / warm intro
  // Computed (stored for sorting)
  compositeScore: float("compositeScore").notNull().default(5.0),
  // Status
  status: mysqlEnum("status", ["new", "qualified", "in_outreach", "meeting_booked", "closed_won", "closed_lost", "watching"]).notNull().default("new"),
  // Contact info
  keyContact: varchar("keyContact", { length: 256 }),
  keyContactTitle: varchar("keyContactTitle", { length: 256 }),
  keyContactLinkedin: text("keyContactLinkedin"),
  // BD notes
  biorceAngle: text("biorceAngle"),
  proposedOutreach: text("proposedOutreach"),
  notes: text("notes"),
  // Linked partner (if converted)
  linkedPartnerId: int("linkedPartnerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PharmaSignal = typeof pharmaSignals.$inferSelect;
export type InsertPharmaSignal = typeof pharmaSignals.$inferInsert;

export const pharmaOutreachLog = mysqlTable("pharma_outreach_log", {
  id: int("id").autoincrement().primaryKey(),
  signalId: int("signalId").notNull(),
  outreachType: mysqlEnum("outreachType", ["email", "linkedin", "call", "meeting", "conference", "intro", "follow_up"]).notNull(),
  summary: text("summary").notNull(),
  outcome: mysqlEnum("outcome", ["no_response", "positive", "negative", "meeting_booked", "referred", "not_ready"]),
  nextStep: text("nextStep"),
  loggedByUserId: int("loggedByUserId"),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PharmaOutreachLog = typeof pharmaOutreachLog.$inferSelect;

// ─── Media Library ────────────────────────────────────────────────────────────
export const mediaItems = mysqlTable("media_items", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  mediaType: mysqlEnum("mediaType", ["video", "audio", "document", "image", "transcript"]).notNull(),
  // Storage
  fileKey: varchar("fileKey", { length: 512 }),       // S3 key
  fileUrl: text("fileUrl"),                            // S3 URL or external URL
  externalUrl: text("externalUrl"),                   // YouTube / external link
  thumbnailUrl: text("thumbnailUrl"),
  fileSizeBytes: int("fileSizeBytes"),
  durationSeconds: int("durationSeconds"),
  mimeType: varchar("mimeType", { length: 128 }),
  // Metadata
  source: varchar("source", { length: 256 }),         // e.g. "Itnig Podcast", "YouTube"
  speakers: json("speakers").$type<string[]>().default([]),
  language: varchar("language", { length: 16 }).default("en"),
  publishedAt: timestamp("publishedAt"),
  tags: json("tags").$type<string[]>().default([]),
  // Classification
  verificationStatus: mysqlEnum("verificationStatus", ["verified", "inferred", "unverified"]).notNull().default("verified"),
  sourceOfTruth: mysqlEnum("sourceOfTruth", ["primary", "secondary", "inferred"]).notNull().default("primary"),
  // Linked knowledge item (if transcript was loaded)
  linkedKnowledgeItemId: int("linkedKnowledgeItemId"),
  // Transcript text (stored inline for search)
  transcriptText: text("transcriptText"),
  isPublic: boolean("isPublic").default(true).notNull(),
  uploadedByUserId: int("uploadedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MediaItem = typeof mediaItems.$inferSelect;
export type InsertMediaItem = typeof mediaItems.$inferInsert;

// ─── Press Room ───────────────────────────────────────────────────────────────
export const pressItems = mysqlTable("press_items", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  outlet: varchar("outlet", { length: 256 }),
  author: varchar("author", { length: 256 }),
  summary: text("summary"),
  fullContent: text("fullContent"),
  sourceUrl: text("sourceUrl").notNull(),
  publishedAt: timestamp("publishedAt"),
  pressType: mysqlEnum("pressType", ["press_release", "news_mention", "interview", "feature", "op_ed", "podcast_mention"]).notNull().default("news_mention"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative", "mixed"]).default("neutral"),
  verificationStatus: mysqlEnum("verificationStatus", ["verified", "inferred", "unverified"]).notNull().default("verified"),
  sourceOfTruth: mysqlEnum("sourceOfTruth", ["primary", "secondary", "inferred"]).notNull().default("secondary"),
  tags: json("tags").$type<string[]>().default([]),
  entities: json("entities").$type<string[]>().default([]),
  // Discrepancy link
  hasDiscrepancy: boolean("hasDiscrepancy").default(false).notNull(),
  discrepancyNote: text("discrepancyNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PressItem = typeof pressItems.$inferSelect;
export type InsertPressItem = typeof pressItems.$inferInsert;

// ─── Source Comments (rectify / add facts on any record) ─────────────────────
export const sourceComments = mysqlTable("source_comments", {
  id: int("id").autoincrement().primaryKey(),
  // Polymorphic ref
  targetTable: varchar("targetTable", { length: 64 }).notNull(), // "knowledge_items" | "media_items" | "press_items" | "discrepancies" | "partners" | ...
  targetId: int("targetId").notNull(),
  // Content
  commentType: mysqlEnum("commentType", ["correction", "addition", "question", "note", "verified_by"]).notNull().default("note"),
  body: text("body").notNull(),
  newFactClaim: text("newFactClaim"),         // optional structured fact to add
  sourceUrl: text("sourceUrl"),               // supporting source for the comment
  // Status
  status: mysqlEnum("status", ["open", "accepted", "rejected", "pending_review"]).notNull().default("open"),
  resolvedAt: timestamp("resolvedAt"),
  resolvedByUserId: int("resolvedByUserId"),
  authorUserId: int("authorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SourceComment = typeof sourceComments.$inferSelect;
export type InsertSourceComment = typeof sourceComments.$inferInsert;

// ─── Partner CRM Activity Log ─────────────────────────────────────────────────
export const partnerActivities = mysqlTable("partner_activities", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  activityType: mysqlEnum("activityType", [
    "email", "call", "meeting", "linkedin", "conference", "intro", "follow_up",
    "proposal_sent", "loi_signed", "contract_signed", "demo", "note",
  ]).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  body: text("body"),
  outcome: mysqlEnum("outcome", ["pending", "positive", "negative", "no_response", "meeting_booked", "referred"]).default("pending"),
  nextStep: text("nextStep"),
  nextStepDate: timestamp("nextStepDate"),
  // Interconnectivity: link to other sources
  linkedKnowledgeItemId: int("linkedKnowledgeItemId"),
  linkedPressItemId: int("linkedPressItemId"),
  linkedSignalId: int("linkedSignalId"),
  attachmentUrl: text("attachmentUrl"),
  loggedByUserId: int("loggedByUserId"),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PartnerActivity = typeof partnerActivities.$inferSelect;
export type InsertPartnerActivity = typeof partnerActivities.$inferInsert;

// ─── Partner Flags ────────────────────────────────────────────────────────────
export const partnerFlags = mysqlTable("partner_flags", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  flagType: mysqlEnum("flagType", [
    "risk", "opportunity", "blocker", "champion", "urgent", "stalled", "watch", "custom",
  ]).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  body: text("body"),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).default("medium"),
  status: mysqlEnum("status", ["open", "resolved", "dismissed"]).notNull().default("open"),
  resolvedAt: timestamp("resolvedAt"),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PartnerFlag = typeof partnerFlags.$inferSelect;
export type InsertPartnerFlag = typeof partnerFlags.$inferInsert;

// ─── Connector Configs (Slack, Google Docs, Notion) ──────────────────────────
export const connectorConfigs = mysqlTable("connector_configs", {
  id: int("id").autoincrement().primaryKey(),
  connectorType: mysqlEnum("connectorType", ["slack", "google_docs", "notion", "webhook", "email"]).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  // Encrypted/stored config (JSON blob — actual tokens stored server-side in env)
  configJson: json("configJson").$type<Record<string, string>>().default({}),
  // Slack: channel ID, Google: folder ID, Notion: database ID
  targetId: varchar("targetId", { length: 512 }),
  targetName: varchar("targetName", { length: 256 }),
  // What to sync
  syncKnowledge: boolean("syncKnowledge").default(true).notNull(),
  syncAlerts: boolean("syncAlerts").default(true).notNull(),
  syncPress: boolean("syncPress").default(false).notNull(),
  syncDiscrepancies: boolean("syncDiscrepancies").default(false).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ConnectorConfig = typeof connectorConfigs.$inferSelect;
export type InsertConnectorConfig = typeof connectorConfigs.$inferInsert;

// ─── Extend alerts with sourceUrl for "open full source" ─────────────────────
// (alerts table already exists — we add sourceUrl via migration SQL)
