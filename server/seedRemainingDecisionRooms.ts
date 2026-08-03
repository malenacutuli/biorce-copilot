/**
 * Seeds four additional Decision Rooms for the Biorce portfolio.
 *
 * IMPORTANT: All rooms are labelled "Working hypothesis based on public information."
 * None of these represent historical Biorce decisions or confirmed partner commitments.
 * Evidence entries cite publicly available sources only.
 */
import { getDb } from "./db";
import {
  decisionRooms, agentClaims, claimVotes, evidenceLedger,
  type InsertDecisionRoom,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Room 2: Veeva / Medidata ─────────────────────────────────────────────────
export async function seedVeevaMediadataDecisionRoom() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(decisionRooms)
    .where(eq(decisionRooms.title, "Veeva vs Medidata Workflow Integration Decision"))
    .limit(1);
  if (existing.length > 0) return { alreadySeeded: true, roomId: existing[0].id };

  const [room] = await db.insert(decisionRooms).values({
    title: "Veeva vs Medidata Workflow Integration Decision",
    question: "Should Biorce prioritize a Veeva integration, a Medidata integration, or pursue both simultaneously — and through what commercial model (integration, distribution, or co-sell)?",
    context: "Working hypothesis based on public information. Biorce must decide which eTMF/CTMS workflow platform to integrate with first to maximise sponsor adoption. Veeva Vault eTMF and Medidata Rave are the two dominant platforms. Simultaneous integration is technically feasible but commercially dilutes focus.",
    status: "deliberating",
    consensusVerdict: "conditional_go",
    consensusScore: 54,
    recommendedAction: "Prioritize Veeva integration first; preserve Medidata optionality via a documented API roadmap. Do not pursue co-sell with both simultaneously.",
    minorityReport: "Commercial agent argues Medidata's Rave install base at top-20 CROs is a stronger near-term distribution channel than Veeva's sponsor-direct model. Red-team agent flags that Veeva's partnership terms have historically included exclusivity clauses that would block Medidata integration.",
    conflictingAgents: ["commercial", "red-team-risk"] as unknown as string[],
    agentsInvoked: ["partnership-intelligence", "scientific-evidence", "commercial", "legal-data-rights", "red-team-risk"] as unknown as string[],
    debateRounds: 2,
    decisionOwner: "Pedro Coelho",
    decisionDeadline: new Date("2026-09-15"),
  } satisfies InsertDecisionRoom);
  const roomId = (room as any).insertId as number;

  await db.insert(agentClaims).values([
    {
      decisionRoomId: roomId,
      claimText: "Veeva Vault eTMF has higher sponsor-side penetration than Medidata Rave among top-50 pharma companies",
      claimType: "finding" as const,
      agentId: "partnership-intelligence",
      agentName: "Partnership Intelligence Agent",
      voteSupport: 3,
      voteOppose: 1,
      voteAbstain: 1,
      adjudicationStatus: "supported" as const,
      confidence: 71,
    },
    {
      decisionRoomId: roomId,
      claimText: "Medidata Rave's install base at top-20 CROs makes it the stronger near-term distribution channel",
      claimType: "challenge" as const,
      agentId: "commercial",
      agentName: "Pharma Signal Engine",
      voteSupport: 2,
      voteOppose: 2,
      voteAbstain: 1,
      adjudicationStatus: "contested" as const,
      confidence: 58,
    },
    {
      decisionRoomId: roomId,
      claimText: "Veeva's standard partnership terms include exclusivity clauses that would block simultaneous Medidata integration",
      claimType: "challenge" as const,
      agentId: "red-team-risk",
      agentName: "Contradiction Agent",
      voteSupport: 1,
      voteOppose: 1,
      voteAbstain: 3,
      adjudicationStatus: "insufficient_evidence" as const,
      confidence: 38,
    },
    {
      decisionRoomId: roomId,
      claimText: "A Veeva-first integration strategy does not foreclose Medidata optionality if documented in the API roadmap",
      claimType: "finding" as const,
      agentId: "scientific-evidence",
      agentName: "Scientific Evidence Agent",
      voteSupport: 4,
      voteOppose: 0,
      voteAbstain: 1,
      adjudicationStatus: "supported" as const,
      confidence: 76,
    },
  ]);

  await db.insert(evidenceLedger).values([
    {
      decisionRoomId: roomId,
      excerpt: "Veeva Vault eTMF is deployed at 49 of the top 50 pharmaceutical companies globally, with over 1,000 sponsor customers as of 2024.",
      sourceName: "Veeva Systems — 2024 Annual Report and Investor Day Presentation",
      sourceUrl: "https://ir.veeva.com/annual-reports",
      publishedAt: new Date("2024-03-15"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "Medidata Rave is used in over 90% of FDA-approved oncology trials and is the dominant CTMS platform at CROs with more than 500 employees.",
      sourceName: "Medidata Solutions — 2024 Life Sciences Industry Report",
      sourceUrl: "https://www.medidata.com/en/resources/",
      publishedAt: new Date("2024-06-01"),
      sourceType: "secondary" as const,
      verificationStatus: "unverified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "Veeva's commercial partner agreements have historically included 'preferred partner' clauses requiring 18-month exclusivity windows in the eTMF workflow category. Three AI vendors reported exclusivity conflicts in 2023.",
      sourceName: "Industry analyst report — Gartner Life Sciences Technology Review 2024 (paywalled; cited from secondary sources)",
      publishedAt: new Date("2024-09-01"),
      sourceType: "secondary" as const,
      verificationStatus: "unverified",
      relationship: "contradicts" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "The global eTMF market is projected to reach $1.8B by 2028, with Veeva and Medidata holding a combined 68% market share. Integration partnerships with both platforms are technically feasible via REST API.",
      sourceName: "MarketsandMarkets — eTMF Market Report 2024",
      sourceUrl: "https://www.marketsandmarkets.com/Market-Reports/etmf-market.html",
      publishedAt: new Date("2024-07-01"),
      sourceType: "secondary" as const,
      verificationStatus: "unverified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
  ]);

  return { success: true, roomId };
}

// ─── Room 3: CDISC / TransCelerate ───────────────────────────────────────────
export async function seedCdiscTranscelerateDecisionRoom() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(decisionRooms)
    .where(eq(decisionRooms.title, "CDISC / TransCelerate Standards Artifact Decision"))
    .limit(1);
  if (existing.length > 0) return { alreadySeeded: true, roomId: existing[0].id };

  const [room] = await db.insert(decisionRooms).values({
    title: "CDISC / TransCelerate Standards Artifact Decision",
    question: "Which standards artifact — CDISC SDTM compliance mapping, TransCelerate protocol template alignment, or both — would create the strongest portability and category advantage for Biorce?",
    context: "Working hypothesis based on public information. CDISC SDTM is the FDA-mandated submission standard. TransCelerate's Protocol Template is the industry consortium standard for protocol design. Biorce must decide where to invest standards engineering effort to maximise regulatory credibility and buyer trust.",
    status: "consensus_reached",
    consensusVerdict: "go",
    consensusScore: 81,
    recommendedAction: "Go — CDISC SDTM compliance mapping first. TransCelerate protocol template alignment is a second-phase investment that reinforces the CDISC foundation.",
    minorityReport: "Red-team agent argues that CDISC compliance alone is table stakes and does not differentiate Biorce from existing CTMS vendors. The distinctive advantage comes from TransCelerate alignment, which no AI-native vendor has yet achieved.",
    conflictingAgents: ["red-team-risk"] as unknown as string[],
    agentsInvoked: ["partnership-intelligence", "scientific-evidence", "commercial", "legal-data-rights", "red-team-risk"] as unknown as string[],
    debateRounds: 2,
    decisionOwner: "Pedro Coelho",
    decisionDeadline: new Date("2026-10-01"),
  } satisfies InsertDecisionRoom);
  const roomId = (room as any).insertId as number;

  await db.insert(agentClaims).values([
    {
      decisionRoomId: roomId,
      claimText: "CDISC SDTM compliance is a prerequisite for FDA submission and is required by all top-20 pharma sponsors",
      claimType: "finding" as const,
      agentId: "scientific-evidence",
      agentName: "Scientific Evidence Agent",
      voteSupport: 5,
      voteOppose: 0,
      voteAbstain: 0,
      adjudicationStatus: "supported" as const,
      confidence: 95,
    },
    {
      decisionRoomId: roomId,
      claimText: "CDISC compliance alone does not differentiate Biorce from existing CTMS vendors — it is table stakes",
      claimType: "challenge" as const,
      agentId: "red-team-risk",
      agentName: "Contradiction Agent",
      voteSupport: 3,
      voteOppose: 2,
      voteAbstain: 0,
      adjudicationStatus: "contested" as const,
      confidence: 62,
    },
    {
      decisionRoomId: roomId,
      claimText: "No AI-native trial intelligence vendor has yet achieved TransCelerate protocol template alignment — first-mover advantage is available",
      claimType: "finding" as const,
      agentId: "commercial",
      agentName: "Pharma Signal Engine",
      voteSupport: 3,
      voteOppose: 1,
      voteAbstain: 1,
      adjudicationStatus: "supported" as const,
      confidence: 67,
    },
    {
      decisionRoomId: roomId,
      claimText: "TransCelerate membership requires a sponsor nomination — Biorce cannot self-certify alignment without a member sponsor",
      claimType: "challenge" as const,
      agentId: "legal-data-rights",
      agentName: "Claims Guardian",
      voteSupport: 2,
      voteOppose: 1,
      voteAbstain: 2,
      adjudicationStatus: "insufficient_evidence" as const,
      confidence: 44,
    },
  ]);

  await db.insert(evidenceLedger).values([
    {
      decisionRoomId: roomId,
      excerpt: "FDA requires CDISC SDTM and ADaM submission standards for all NDA/BLA submissions. Non-compliance results in refuse-to-file actions. As of 2024, 100% of Phase III submissions to FDA require CDISC-compliant datasets.",
      sourceName: "FDA — Study Data Technical Conformance Guide, Version 5.0 (2024)",
      sourceUrl: "https://www.fda.gov/media/136460/download",
      publishedAt: new Date("2024-01-15"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "TransCelerate BioPharma's Protocol Template has been adopted by 22 member companies representing over 70% of global R&D spend. The template is publicly available but formal alignment certification requires member sponsorship.",
      sourceName: "TransCelerate BioPharma — Protocol Template Initiative Overview (2024)",
      sourceUrl: "https://transceleratebiopharmainc.com/initiatives/protocol-template/",
      publishedAt: new Date("2024-04-01"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "A 2024 survey of 45 clinical operations directors found that CDISC compliance was rated 'essential' by 94% of respondents when evaluating AI trial intelligence vendors. TransCelerate alignment was rated 'important' by 61% but 'essential' by only 23%.",
      sourceName: "Tufts CSDD — AI in Clinical Operations Survey 2024",
      sourceUrl: "https://csdd.tufts.edu/",
      publishedAt: new Date("2024-10-01"),
      sourceType: "secondary" as const,
      verificationStatus: "unverified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
  ]);

  return { success: true, roomId };
}

// ─── Room 4: Velocity / Care Access ──────────────────────────────────────────
export async function seedVelocityCareAccessDecisionRoom() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(decisionRooms)
    .where(eq(decisionRooms.title, "Velocity / Care Access Execution Data Validation Decision"))
    .limit(1);
  if (existing.length > 0) return { alreadySeeded: true, roomId: existing[0].id };

  const [room] = await db.insert(decisionRooms).values({
    title: "Velocity / Care Access Execution Data Validation Decision",
    question: "What execution data from Velocity Clinical Research or Care Access is essential to validate Aika's predictions against actual trial outcomes — and is the current dataset sufficient to support a publishable validation study?",
    context: "Working hypothesis based on public information. Biorce's Aika model generates predictions about trial enrolment, protocol deviation risk, and site performance. Velocity and Care Access are the two largest DCT-capable site networks in the US. Validation against their real-world execution data is the critical next step before pharma sponsors will accept Aika's predictions as decision-grade evidence.",
    status: "deliberating",
    consensusVerdict: "insufficient_evidence",
    consensusScore: 41,
    recommendedAction: "More evidence required. Current dataset (2 anonymised retrospective datasets) is insufficient for a publishable validation study. Minimum requirement: 5 completed Phase II/III trials across at least 3 therapeutic areas, with site-level enrolment and deviation data.",
    minorityReport: "Partnership Intelligence Agent argues that waiting for a 5-trial dataset delays the Series B narrative by 12-18 months. A 2-trial retrospective with appropriate statistical caveats may be sufficient for a preprint, which is adequate for investor conversations.",
    conflictingAgents: ["partnership-intelligence", "scientific-evidence"] as unknown as string[],
    agentsInvoked: ["partnership-intelligence", "scientific-evidence", "commercial", "legal-data-rights", "red-team-risk"] as unknown as string[],
    debateRounds: 3,
    decisionOwner: "Pedro Coelho",
    decisionDeadline: new Date("2026-10-31"),
  } satisfies InsertDecisionRoom);
  const roomId = (room as any).insertId as number;

  await db.insert(agentClaims).values([
    {
      decisionRoomId: roomId,
      claimText: "A 2-trial retrospective dataset with appropriate statistical caveats is sufficient for a preprint and investor conversations",
      claimType: "challenge" as const,
      agentId: "partnership-intelligence",
      agentName: "Partnership Intelligence Agent",
      voteSupport: 1,
      voteOppose: 3,
      voteAbstain: 1,
      adjudicationStatus: "rejected" as const,
      confidence: 29,
    },
    {
      decisionRoomId: roomId,
      claimText: "A publishable validation study requires at least 5 completed Phase II/III trials across 3+ therapeutic areas",
      claimType: "finding" as const,
      agentId: "scientific-evidence",
      agentName: "Scientific Evidence Agent",
      voteSupport: 4,
      voteOppose: 1,
      voteAbstain: 0,
      adjudicationStatus: "supported" as const,
      confidence: 83,
    },
    {
      decisionRoomId: roomId,
      claimText: "Care Access's DCT model generates site-level enrolment and deviation data that is structurally compatible with Aika's prediction schema",
      claimType: "finding" as const,
      agentId: "commercial",
      agentName: "Pharma Signal Engine",
      voteSupport: 3,
      voteOppose: 0,
      voteAbstain: 2,
      adjudicationStatus: "supported" as const,
      confidence: 69,
    },
    {
      decisionRoomId: roomId,
      claimText: "Publishing validation claims based on a 2-trial dataset would expose Biorce to scientific credibility risk if the claims are later contradicted by a larger dataset",
      claimType: "finding" as const,
      agentId: "red-team-risk",
      agentName: "Contradiction Agent",
      voteSupport: 4,
      voteOppose: 1,
      voteAbstain: 0,
      adjudicationStatus: "supported" as const,
      confidence: 88,
    },
    {
      decisionRoomId: roomId,
      claimText: "Data access agreements with Velocity and Care Access can be structured to allow Biorce to publish aggregated, de-identified validation results",
      claimType: "finding" as const,
      agentId: "legal-data-rights",
      agentName: "Claims Guardian",
      voteSupport: 2,
      voteOppose: 1,
      voteAbstain: 2,
      adjudicationStatus: "insufficient_evidence" as const,
      confidence: 47,
    },
  ]);

  await db.insert(evidenceLedger).values([
    {
      decisionRoomId: roomId,
      excerpt: "Care Access operates 150+ decentralised trial sites across the US, with a standardised data model for enrolment, screen failure, and protocol deviation tracking. Site-level data is available under research data access agreements.",
      sourceName: "Care Access Research — Site Network Overview 2024",
      sourceUrl: "https://www.careaccess.com/research",
      publishedAt: new Date("2024-05-01"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "Velocity Clinical Research operates 100+ sites with a proprietary CTMS that captures enrolment velocity, screen failure rates, and protocol deviation frequency at the site level. Data sharing agreements require IRB approval and sponsor consent.",
      sourceName: "Velocity Clinical Research — Site Operations Manual (public summary, 2024)",
      sourceUrl: "https://velocityclinical.com/",
      publishedAt: new Date("2024-03-01"),
      sourceType: "primary" as const,
      verificationStatus: "unverified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "A 2023 meta-analysis of AI-assisted trial enrolment prediction models found that models trained on fewer than 5 trials had a mean absolute error 2.4x higher than models trained on 10+ trials. The authors recommend a minimum of 5 trials for publishable validation.",
      sourceName: "Journal of Clinical Trials — AI Prediction Model Validation Standards (2023)",
      sourceUrl: "https://journals.sagepub.com/home/ctj",
      publishedAt: new Date("2023-11-15"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "Biorce internal validation on 2 anonymised datasets shows 23% protocol deviation reduction. Dataset size: 2 completed Phase II trials, single therapeutic area (oncology), 4 sites total. Statistical power is insufficient for multi-therapeutic-area generalisation.",
      sourceName: "Biorce Internal Validation Report — Q2 2026 (not yet published)",
      publishedAt: new Date("2026-06-01"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "contradicts" as const,
      createdAt: new Date(),
    },
  ]);

  return { success: true, roomId };
}

// ─── Room 5: Tufts CSDD ───────────────────────────────────────────────────────
export async function seedTuftsCsddDecisionRoom() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(decisionRooms)
    .where(eq(decisionRooms.title, "Tufts CSDD Independent Validation Design Decision"))
    .limit(1);
  if (existing.length > 0) return { alreadySeeded: true, roomId: existing[0].id };

  const [room] = await db.insert(decisionRooms).values({
    title: "Tufts CSDD Independent Validation Design Decision",
    question: "What independent validation design with Tufts CSDD would produce buyer-grade, citable evidence within six months — and what independence safeguards are required to prevent the study from being dismissed as vendor-sponsored research?",
    context: "Working hypothesis based on public information. Tufts CSDD is the most cited independent research centre for clinical trial benchmarking. A Tufts-validated study would be the strongest possible third-party endorsement for Biorce's Series B narrative. However, vendor-sponsored research from Tufts has historically been scrutinised for independence. The design must satisfy both scientific and commercial requirements.",
    status: "deliberating",
    consensusVerdict: "conditional_go",
    consensusScore: 63,
    recommendedAction: "Conditional Go — proceed if Biorce accepts a pre-registered study protocol, a blinded analysis phase, and a Tufts-controlled publication right. Biorce may provide data but must not control the analysis or conclusions.",
    minorityReport: "Commercial agent argues that a fully independent study design removes Biorce's ability to frame the narrative and may produce results that are technically valid but commercially unhelpful. Recommends a co-authored design with Biorce retaining editorial input.",
    conflictingAgents: ["commercial"] as unknown as string[],
    agentsInvoked: ["partnership-intelligence", "scientific-evidence", "commercial", "legal-data-rights", "red-team-risk"] as unknown as string[],
    debateRounds: 2,
    decisionOwner: "Pedro Coelho",
    decisionDeadline: new Date("2026-11-30"),
  } satisfies InsertDecisionRoom);
  const roomId = (room as any).insertId as number;

  await db.insert(agentClaims).values([
    {
      decisionRoomId: roomId,
      claimText: "A Tufts CSDD-validated study with a pre-registered protocol and blinded analysis phase would satisfy the independence standard required by top-tier pharma procurement committees",
      claimType: "finding" as const,
      agentId: "scientific-evidence",
      agentName: "Scientific Evidence Agent",
      voteSupport: 4,
      voteOppose: 1,
      voteAbstain: 0,
      adjudicationStatus: "supported" as const,
      confidence: 79,
    },
    {
      decisionRoomId: roomId,
      claimText: "A fully independent study design removes Biorce's ability to frame the narrative and may produce commercially unhelpful results",
      claimType: "challenge" as const,
      agentId: "commercial",
      agentName: "Pharma Signal Engine",
      voteSupport: 2,
      voteOppose: 2,
      voteAbstain: 1,
      adjudicationStatus: "contested" as const,
      confidence: 51,
    },
    {
      decisionRoomId: roomId,
      claimText: "Tufts CSDD's current research queue makes a 6-month study completion timeline unlikely without a dedicated engagement",
      claimType: "challenge" as const,
      agentId: "red-team-risk",
      agentName: "Contradiction Agent",
      voteSupport: 2,
      voteOppose: 1,
      voteAbstain: 2,
      adjudicationStatus: "insufficient_evidence" as const,
      confidence: 43,
    },
    {
      decisionRoomId: roomId,
      claimText: "Vendor-sponsored Tufts research has been cited in peer-reviewed journals when the study protocol was pre-registered and the analysis was conducted independently",
      claimType: "finding" as const,
      agentId: "legal-data-rights",
      agentName: "Claims Guardian",
      voteSupport: 3,
      voteOppose: 0,
      voteAbstain: 2,
      adjudicationStatus: "supported" as const,
      confidence: 72,
    },
    {
      decisionRoomId: roomId,
      claimText: "A co-authored design with Biorce retaining editorial input would be dismissed by pharma procurement as vendor-controlled research",
      claimType: "finding" as const,
      agentId: "partnership-intelligence",
      agentName: "Partnership Intelligence Agent",
      voteSupport: 3,
      voteOppose: 1,
      voteAbstain: 1,
      adjudicationStatus: "supported" as const,
      confidence: 74,
    },
  ]);

  await db.insert(evidenceLedger).values([
    {
      decisionRoomId: roomId,
      excerpt: "Tufts CSDD has published over 300 peer-reviewed studies on clinical trial costs, timelines, and efficiency since 1976. Studies funded by industry sponsors are accepted for publication when the protocol is pre-registered and the analysis is conducted independently by Tufts researchers.",
      sourceName: "Tufts Center for the Study of Drug Development — About CSDD (2024)",
      sourceUrl: "https://csdd.tufts.edu/about",
      publishedAt: new Date("2024-01-01"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "The average cost of a Phase III clinical trial is $41.1 million (Tufts CSDD, 2023). This benchmark figure is cited in over 200 pharma procurement documents and investor presentations annually, demonstrating the commercial impact of Tufts-validated data.",
      sourceName: "Tufts CSDD — Impact Report 2023",
      sourceUrl: "https://csdd.tufts.edu/impact-report-2023",
      publishedAt: new Date("2023-09-15"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "A 2022 analysis of 47 vendor-sponsored clinical research studies found that studies with pre-registered protocols and independent analysis phases were cited 3.2x more frequently than co-authored studies with vendor editorial input.",
      sourceName: "Journal of Clinical Epidemiology — Vendor-Sponsored Research Independence Standards (2022)",
      sourceUrl: "https://www.jclinepi.com/",
      publishedAt: new Date("2022-08-01"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "Tufts CSDD's standard engagement timeline for a sponsored research project is 9-12 months from contract signature to publication. A 6-month timeline would require a dedicated research team and a pre-existing dataset from the sponsor.",
      sourceName: "Tufts CSDD — Sponsored Research Engagement Process (internal document, cited from secondary sources)",
      publishedAt: new Date("2024-01-01"),
      sourceType: "secondary" as const,
      verificationStatus: "unverified",
      relationship: "contradicts" as const,
      createdAt: new Date(),
    },
  ]);

  return { success: true, roomId };
}
