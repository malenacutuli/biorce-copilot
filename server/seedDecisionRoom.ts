import { getDb } from "./db";
import {
  decisionRooms, agentClaims, claimVotes, evidenceLedger,
} from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function seedNovoNordiskDecisionRoom() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ── Check if already seeded ──────────────────────────────────────────────
  const existing = await db.select().from(decisionRooms)
    .where(eq(decisionRooms.title, "Novo Nordisk Lighthouse Partnership Decision"))
    .limit(1);
  if (existing.length > 0) {
    return { alreadySeeded: true, roomId: existing[0].id };
  }

  // ── Agent positions ──────────────────────────────────────────────────────
  const agentPositions = [
    {
      agentId: "partnership-intelligence",
      agentName: "Partnership Intelligence Agent",
      domain: "Partnership Strategy",
      position: "support",
      primaryClaim: "Novo Nordisk's 2025 digital health strategy explicitly prioritises AI infrastructure for trial efficiency — Biorce's retrospective evaluation directly addresses their stated €400M operational efficiency target.",
      evidenceUsed: "Novo Nordisk 2025 Annual Report (p.47); Novo Nordisk Digital Health Strategy Deck Q1 2025; Care Access DCT pilot data (40% enrolment improvement, 3 sites, 2024)",
      challengeRaised: null,
      responseToOthers: "The legal agent's concern about publication rights is valid but solvable — Novo Nordisk has signed publication governance agreements with 4 other AI vendors in the past 18 months. This is a negotiation point, not a blocker.",
      remainingUncertainty: "No confirmed internal champion at Novo Nordisk yet. The warm intro route via Hospital Clinic Barcelona needs to be activated before the evaluation can begin.",
      confidence: 78,
    },
    {
      agentId: "scientific-evidence",
      agentName: "Scientific Evidence Agent",
      domain: "Clinical Evidence",
      position: "support",
      primaryClaim: "A retrospective evaluation on Novo Nordisk's historical trial data is scientifically valid and sufficient to generate a publishable lighthouse case study, provided the dataset covers at least 3 completed Phase II/III trials.",
      evidenceUsed: "Tufts CSDD benchmark: average Phase II/III trial costs €18M; Biorce internal validation on 2 anonymised datasets shows 23% protocol deviation reduction; FDA DHCoE guidance on AI-assisted trial analysis (2024)",
      challengeRaised: "The prospective-validation conversion claim is unresolved — there is no evidence that Novo Nordisk has committed to converting a retrospective evaluation into a prospective study.",
      responseToOthers: "I agree with the commercial agent that the €2.1M ARR figure is achievable, but it requires the prospective study conversion. The retrospective evaluation alone would yield approximately €180K in direct revenue.",
      remainingUncertainty: "Dataset quality and completeness at Novo Nordisk is unknown. If historical trial data is fragmented across legacy systems, the evaluation timeline extends from 6 to 12 months.",
      confidence: 71,
    },
    {
      agentId: "commercial",
      agentName: "Pharma Signal Engine",
      domain: "Commercial Strategy",
      position: "support",
      primaryClaim: "The commercial case for the Novo Nordisk lighthouse partnership is strong: a paid retrospective evaluation at €180K creates a referenceable case study that unlocks 8 additional pharma conversations currently stalled on 'show me a lighthouse customer'.",
      evidenceUsed: "Biorce pipeline analysis: 8 pharma prospects (Roche, Sanofi, AstraZeneca, Lilly, Pfizer, BMS, Takeda, Boehringer) have explicitly cited lack of lighthouse reference as the primary objection; Novo Nordisk comparable: GSK paid €220K for a similar AI retrospective in 2023",
      challengeRaised: null,
      responseToOthers: "The legal agent is correct that derived-data rights must be secured upfront. I would add that revenue-share on publications should also be included in the term sheet — this is standard in pharma AI partnerships.",
      remainingUncertainty: "Pricing sensitivity at Novo Nordisk is unknown. The €180K figure is based on comparable deals but Novo Nordisk may push for a lower entry price with a success-fee structure.",
      confidence: 82,
    },
    {
      agentId: "legal-data-rights",
      agentName: "Claims Guardian",
      domain: "Legal / Data Rights",
      position: "conditional",
      primaryClaim: "Biorce should proceed only if four contractual rights are secured before the evaluation begins: (1) reference rights, (2) prospective-validation conversion option, (3) publication governance, (4) derived-data rights for model training.",
      evidenceUsed: "Biorce legal review of 3 comparable pharma AI contracts (anonymised); GDPR Article 9 requirements for clinical trial data; EMA guidance on AI in clinical development (2024)",
      challengeRaised: "Publication rights are not yet negotiable — there is no evidence that Novo Nordisk has agreed to any publication governance framework. This is the most significant unresolved risk.",
      responseToOthers: "The partnership agent's claim that Novo Nordisk has signed publication governance agreements with other AI vendors is correct but those were with established vendors (IBM, Microsoft). Biorce's negotiating position as an early-stage company is weaker.",
      remainingUncertainty: "IP ownership of derived insights from Novo Nordisk's historical data is legally ambiguous under current EU AI Act provisions. Legal counsel review is required before signing.",
      confidence: 55,
    },
    {
      agentId: "red-team-risk",
      agentName: "Contradiction Agent",
      domain: "Red-Team Risk",
      position: "oppose",
      primaryClaim: "The 6-month timeline for a publishable retrospective evaluation is not achievable given Novo Nordisk's procurement process (average 4.2 months for AI vendor onboarding), data access negotiation (estimated 2-3 months), and IRB review requirements.",
      evidenceUsed: "Novo Nordisk vendor onboarding data (public procurement records, 2023-2024); IRB review timelines for retrospective studies: 6-12 weeks; Biorce has no existing data-sharing agreement with Novo Nordisk",
      challengeRaised: "The scientific evidence agent's claim that a 6-month timeline is achievable assumes data is immediately accessible. This is contradicted by Novo Nordisk's documented procurement timeline.",
      responseToOthers: "I accept the commercial agent's point that the lighthouse value is real. My opposition is specifically to the 6-month timeline claim, not to the partnership itself. A 12-month timeline with clear milestones is achievable and more credible.",
      remainingUncertainty: "If Novo Nordisk fast-tracks the procurement process (which they have done for 2 vendors in 2024), the 6-month timeline becomes possible. The probability of fast-track is estimated at 30%.",
      confidence: 45,
    },
  ];

  // ── Create the decision room ─────────────────────────────────────────────
  const [room] = await db.insert(decisionRooms).values({
    title: "Novo Nordisk Lighthouse Partnership Decision",
    question: "Should Biorce prioritize a paid retrospective evaluation with Novo Nordisk as its first lighthouse partnership — and under what conditions?",
    context: "Partnership strategy decision for Series B narrative. Five agents deliberated across partnership value, scientific evidence, commercial viability, legal/data rights, and red-team risk domains.",
    status: "consensus_reached",
    consensusScore: 78,
    recommendedAction: "Conditional Go — proceed if Biorce secures reference rights, prospective-validation conversion option, publication governance, and derived-data rights before the retrospective evaluation begins.",
    minorityReport: "Red-team agent (Contradiction Agent) opposes the 6-month timeline claim. Novo Nordisk procurement averages 4.2 months; the evaluation timeline is more credibly 12 months. Legal agent conditionally supports but flags unresolved EU AI Act derived-data rights.",
    conflictingAgents: ["red-team-risk", "legal-data-rights"] as any,
    agentsInvoked: ["partnership-intelligence", "scientific-evidence", "commercial", "legal-data-rights", "red-team-risk"] as any,
    debateRounds: 2,
    decisionOwner: "Pedro Coelho",
    decisionDeadline: new Date("2026-08-10"),
  });

  const roomId = room.insertId as unknown as number;

  // ── Claims ───────────────────────────────────────────────────────────────
  const claimDefs = [
    {
      claimText: "Novo Nordisk can provide lighthouse-quality evidence for Biorce's Series B narrative",
      claimType: "finding" as const,
      agentId: "executive-synthesis",
      agentName: "Executive Synthesis Agent",
      voteSupport: 4,
      voteOppose: 0,
      voteAbstain: 1,
      adjudicationStatus: "supported" as const,
      confidence: 82,
    },
    {
      claimText: "A publishable retrospective evaluation is achievable within 6 months",
      claimType: "challenge" as const,
      agentId: "red-team-risk",
      agentName: "Contradiction Agent",
      voteSupport: 2,
      voteOppose: 2,
      voteAbstain: 1,
      adjudicationStatus: "contested" as const,
      confidence: 48,
    },
    {
      claimText: "Publication rights are negotiable with Novo Nordisk",
      claimType: "finding" as const,
      agentId: "legal-data-rights",
      agentName: "Claims Guardian",
      voteSupport: 1,
      voteOppose: 1,
      voteAbstain: 3,
      adjudicationStatus: "insufficient_evidence" as const,
      confidence: 35,
    },
    {
      claimText: "The €180K evaluation price is commercially viable for Novo Nordisk",
      claimType: "finding" as const,
      agentId: "commercial",
      agentName: "Pharma Signal Engine",
      voteSupport: 3,
      voteOppose: 0,
      voteAbstain: 2,
      adjudicationStatus: "supported" as const,
      confidence: 74,
    },
    {
      claimText: "Derived-data rights can be secured under current EU AI Act provisions",
      claimType: "challenge" as const,
      agentId: "legal-data-rights",
      agentName: "Claims Guardian",
      voteSupport: 1,
      voteOppose: 1,
      voteAbstain: 3,
      adjudicationStatus: "contested" as const,
      confidence: 42,
    },
  ];

  const insertedClaims = await db.insert(agentClaims).values(
    claimDefs.map(c => ({ ...c, decisionRoomId: roomId }))
  );

  // ── Evidence entries ─────────────────────────────────────────────────────
  await db.insert(evidenceLedger).values([
    {
      decisionRoomId: roomId,
      excerpt: "Novo Nordisk will invest DKK 2.8 billion in digital health and AI infrastructure in 2025, with a specific focus on reducing clinical trial cycle times through AI-assisted protocol design and data analysis.",
      sourceName: "Novo Nordisk Annual Report 2024",
      sourceUrl: "https://www.novonordisk.com/investors/annual-report-2024.html",
      publishedAt: new Date("2025-02-12"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "Across 3 decentralised trial sites using Care Access's DCT model, patient enrolment improved by 40% compared to traditional site-based recruitment, with a 28% reduction in screen failure rates.",
      sourceName: "Care Access DCT Pilot Study — Internal Data 2024",
      publishedAt: new Date("2024-11-01"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "Average vendor onboarding time at Novo Nordisk for AI/digital health vendors in 2023-2024 was 4.2 months (range: 2.1–7.8 months). Fast-track procurement was granted to 2 of 11 vendors reviewed.",
      sourceName: "Novo Nordisk Procurement Records (public tender data, 2023-2024)",
      sourceUrl: "https://www.novonordisk.com/procurement",
      publishedAt: new Date("2024-12-01"),
      sourceType: "secondary" as const,
      verificationStatus: "unverified",
      relationship: "contradicts" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "The average cost of a Phase III clinical trial is $41.1 million (Tufts CSDD, 2023). AI-assisted protocol optimisation tools have demonstrated 15-23% reduction in protocol amendments in retrospective analyses.",
      sourceName: "Tufts Center for the Study of Drug Development — Impact Report 2023",
      sourceUrl: "https://csdd.tufts.edu/impact-report-2023",
      publishedAt: new Date("2023-09-15"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "supports" as const,
      createdAt: new Date(),
    },
    {
      decisionRoomId: roomId,
      excerpt: "Under the EU AI Act (Regulation 2024/1689), AI systems used in clinical trial data analysis are classified as high-risk. Derived-data rights for model training require explicit data subject consent or a legitimate interest assessment under GDPR Article 9.",
      sourceName: "EU AI Act — Official Journal of the European Union, 2024",
      sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
      publishedAt: new Date("2024-08-01"),
      sourceType: "primary" as const,
      verificationStatus: "verified",
      relationship: "contradicts" as const,
      createdAt: new Date(),
    },
  ]);

  return { success: true, roomId };
}
