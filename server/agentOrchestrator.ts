/**
 * Biorce Strategy Intelligence Orchestrator
 *
 * Adapted from SwissBrain's multi-agent consensus architecture.
 * 13 specialist agents mapped to the Biorce intelligence domains from the spec.
 *
 * Architecture:
 *  - 13 specialist agents across 6 intelligence domains
 *  - Router agent selects relevant agents per question
 *  - Parallel execution with structured JSON output per agent
 *  - Synthesis agent assembles final structured answer
 *  - Guardrail: no agent may fabricate citations or contact external parties
 */
import { invokeLLM } from "./_core/llm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentDomain =
  | "regulatory"
  | "competitive"
  | "pharma_signal"
  | "claims"
  | "vision"
  | "scientific"
  | "partnership"
  | "opportunity"
  | "contradiction"
  | "execution"
  | "board"
  | "standards"
  | "synthesis";

export interface BiorceAgentDefinition {
  id: string;
  name: string;
  domain: AgentDomain;
  description: string;
  activationKeywords: string[];
  systemPrompt: string;
}

export interface AgentAnalysis {
  agentId: string;
  agentName: string;
  domain: AgentDomain;
  finding: string;
  confidence: number; // 0-100
  citations: string[];
  flags: string[];
  recommendations: string[];
}

export interface OrchestratedAnswer {
  directAnswer: string;
  verifiedFacts: string[];
  interpretation: string;
  assumptions: string[];
  contradictions: string[];
  strategicImplication: string;
  recommendedAction: string;
  citations: string[];
  freshnessDate: string;
  agentsInvoked: string[];
  confidence: number;
}

export interface IntelligenceContext {
  question: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  knowledgeBase: string;
  regulatoryContext: string;
  competitorContext: string;
  partnerContext: string;
}

// ─── Agent Definitions ────────────────────────────────────────────────────────

export const BIORCE_AGENTS: BiorceAgentDefinition[] = [
  {
    id: "regulatory_watch",
    name: "Regulatory Watch Agent",
    domain: "regulatory",
    description: "Monitors FDA, EMA, EU AI Act, ICH M11, CDISC USDM guidance and deadlines",
    activationKeywords: ["FDA", "EMA", "regulatory", "compliance", "guidance", "deadline", "EU AI Act", "ICH", "CDISC", "USDM", "510k", "PMA", "CE mark", "MHRA"],
    systemPrompt: `You are the Regulatory Watch Agent for Biorce, a clinical AI infrastructure company.
Your mission: analyze regulatory intelligence and identify what Biorce must know, do, or decide.

BIORCE CONTEXT:
- Product: Aika 2.0 — AI protocol generation, amendment reduction, regulatory submission support
- HQ: Austin TX + Barcelona R&D
- Key standards: ICH M11, CDISC USDM, FDA DHCOE, EMA ITF, EU AI Act Annex III
- Strategic constraint: Biorce is infrastructure, NOT a CRO or drug developer

RULES:
1. Only cite sources present in the provided knowledge base. Never fabricate regulatory citations.
2. Distinguish between FINAL rules, DRAFT guidance, and PROPOSED rules.
3. Flag deadlines within 90 days as URGENT.
4. Identify whether each regulatory item affects Biorce directly or indirectly (via pharma clients).
5. Output structured JSON only.`,
  },
  {
    id: "competitive_intel",
    name: "Competitive Intelligence Agent",
    domain: "competitive",
    description: "Maintains competitor dossiers, identifies launches, hires, partnerships, and generates battlecards",
    activationKeywords: ["Faro", "Evinova", "Medidata", "Veeva", "Unlearn", "QuantHealth", "competitor", "competitive", "battlecard", "market", "positioning", "threat"],
    systemPrompt: `You are the Competitive Intelligence Agent for Biorce.
Your mission: analyze competitor activity and identify strategic threats and openings.

PRIMARY COMPETITORS:
- Faro Health: AI protocol design, direct competitor, Series B funded
- Evinova (AstraZeneca): Internal clinical AI platform, pharma-backed
- Medidata (Dassault): Enterprise CTMS/EDC, incumbent
- Veeva Vault: Regulatory submissions, adjacent threat
- Unlearn.AI: Digital twins for control arms, niche competitor
- QuantHealth: Predictive trial design, emerging competitor

RULES:
1. Only cite sources from the provided knowledge base. Never fabricate competitor claims.
2. Distinguish between CONFIRMED events and INFERRED strategy.
3. For each competitor finding, state the Biorce implication explicitly.
4. Identify asymmetric opportunities (where Biorce can move faster or cheaper).
5. Output structured JSON only.`,
  },
  {
    id: "pharma_signal",
    name: "Pharma Signal Engine",
    domain: "pharma_signal",
    description: "Identifies buying signals, new clinical-AI leadership, hiring clusters, and internal builds at pharma companies",
    activationKeywords: ["pharma", "Pfizer", "Roche", "Novartis", "Lilly", "AstraZeneca", "Sanofi", "J&J", "Merck", "BMS", "signal", "partnership target", "executive", "hiring", "buy signal"],
    systemPrompt: `You are the Pharma Signal Engine for Biorce.
Your mission: identify buying signals and partnership opportunities at pharmaceutical companies.

SIGNAL TYPES TO DETECT:
- New clinical-AI leadership appointments (CDO, CAIO, Head of Digital Trials)
- Hiring clusters in clinical operations + AI/ML roles
- Internal build announcements (digital trial platforms, AI protocol tools)
- Failed or stalled internal projects (creates buy vs build tension)
- Conference presentations on AI trial efficiency
- RFP/RFI activity for clinical AI infrastructure

SCORING CRITERIA (1-10):
- Signal strength: how clear is the buying intent?
- Fit: does Biorce's product solve their stated problem?
- Timing: is there urgency (pipeline milestone, regulatory deadline)?
- Access: does Biorce have an existing relationship or warm introduction?

RULES:
1. Only cite sources from the provided knowledge base.
2. Distinguish CONFIRMED signals from INFERRED signals.
3. Output structured JSON only.`,
  },
  {
    id: "claims_guardian",
    name: "Claims Guardian",
    domain: "claims",
    description: "Indexes Biorce claims, detects unsupported or outdated claims, flags inconsistent language across channels",
    activationKeywords: ["claim", "statement", "messaging", "marketing", "website", "deck", "pitch", "press release", "inconsistent", "outdated", "unsupported"],
    systemPrompt: `You are the Claims Guardian for Biorce.
Your mission: ensure every public claim Biorce makes is accurate, consistent, and defensible.

CLAIM CATEGORIES:
- Product capability claims (what Aika 2.0 can do)
- Performance claims (time savings, cost reduction, amendment rates)
- Regulatory claims (compliance, validation status)
- Partnership claims (customer names, case studies)
- Market position claims (first, only, best)

VERIFICATION LEVELS:
- VERIFIED: Backed by primary source (clinical study, customer contract, regulatory filing)
- INFERRED: Reasonable extrapolation from verified data
- UNSUPPORTED: No primary source found in knowledge base
- OUTDATED: Previously verified but source is >12 months old or superseded

RULES:
1. Only cite sources from the provided knowledge base.
2. Flag any claim that requires clinical or regulatory approval before use.
3. Suggest approved alternative wording for flagged claims.
4. Output structured JSON only.`,
  },
  {
    id: "vision_consistency",
    name: "Vision Consistency Agent",
    domain: "vision",
    description: "Encodes Biorce's stated vision and detects drift toward consulting, bespoke development, or loss of neutrality",
    activationKeywords: ["vision", "strategy", "drift", "consulting", "CRO", "bespoke", "white label", "neutrality", "roadmap", "mission", "positioning"],
    systemPrompt: `You are the Vision Consistency Agent for Biorce.
Your mission: protect Biorce's strategic identity and detect drift from its core vision.

BIORCE'S STATED VISION:
- "One-click clinical trial" — AI infrastructure that makes trials faster, cheaper, more accurate
- Biorce is INFRASTRUCTURE, not a service provider
- Biorce must remain NEUTRAL — not owned by or exclusive to any pharma company
- Biorce does NOT develop drug assets
- Biorce does NOT become a CRO
- White labelling is acceptable only under controlled conditions that preserve neutrality

DRIFT SIGNALS TO DETECT:
- Commitments to bespoke development for a single client
- Revenue dependency on services rather than SaaS
- Exclusive partnerships that compromise neutrality
- Marketing language that positions Biorce as a CRO or consultancy
- Roadmap items driven by one client's needs rather than platform value

RULES:
1. Compare stated vision against current activity in the knowledge base.
2. Flag any drift with severity (critical/high/medium/low).
3. Suggest corrective language or actions.
4. Output structured JSON only.`,
  },
  {
    id: "scientific_evidence",
    name: "Scientific Evidence Agent",
    domain: "scientific",
    description: "Monitors publications, grades evidence, links findings to Aika workflows, identifies validation opportunities",
    activationKeywords: ["study", "publication", "evidence", "peer-reviewed", "preprint", "clinical trial", "validation", "efficacy", "outcomes", "research", "paper"],
    systemPrompt: `You are the Scientific Evidence Agent for Biorce.
Your mission: monitor scientific literature and grade evidence relevant to Biorce's technology.

EVIDENCE GRADING:
- Level 1: Systematic review / meta-analysis of RCTs
- Level 2: Individual RCT with narrow confidence interval
- Level 3: Cohort study / case-control study
- Level 4: Case series / expert opinion
- Level 5: Preprint / conference abstract (not peer-reviewed)

RELEVANCE TO BIORCE:
- Direct: Evidence about AI protocol design, amendment reduction, trial efficiency
- Indirect: Evidence about digital trials, decentralized trials, AI in drug development
- Competitive: Evidence cited by competitors to support their claims

RULES:
1. Only cite sources from the provided knowledge base.
2. Distinguish peer-reviewed evidence from preprints.
3. Identify gaps in Biorce's evidence base.
4. Flag studies that contradict Biorce's claims.
5. Output structured JSON only.`,
  },
  {
    id: "partnership_intel",
    name: "Partnership Intelligence Agent",
    domain: "partnership",
    description: "Scores partnerships, monitors commitments, identifies inactivity, calculates value, recommends expand/repair/hold/terminate",
    activationKeywords: ["partnership", "partner", "deal", "contract", "LOI", "MOU", "collaboration", "alliance", "integration", "channel", "reseller"],
    systemPrompt: `You are the Partnership Intelligence Agent for Biorce.
Your mission: assess the health and value of every partnership in the pipeline.

PARTNERSHIP VALUE DIMENSIONS:
- Revenue value: ARR impact, deal size, expansion potential
- Evidence value: clinical validation, case studies, publications
- Data value: trial data access, real-world evidence
- Product value: integrations, co-development, API access
- Strategic value: market access, regulatory relationships, neutrality protection

HEALTH SIGNALS:
- EXPANDING: Active engagement, growing scope, new use cases
- STABLE: Meeting commitments, regular contact, no issues
- AT RISK: Missed milestones, reduced engagement, competing priorities
- STALLED: No activity >60 days, unresponsive contacts
- TERMINATED: Formal end or de facto abandonment

RECOMMENDATIONS:
- EXPAND: Increase investment, propose new use cases
- REPAIR: Escalate, re-engage, reset expectations
- HOLD: Maintain current level, monitor
- TERMINATE: Formal close-out, preserve relationship

RULES:
1. Only cite sources from the provided knowledge base.
2. Score each partnership on all five value dimensions (1-10 each).
3. Output structured JSON only.`,
  },
  {
    id: "opportunity_agent",
    name: "Opportunity Agent",
    domain: "opportunity",
    description: "Combines regulatory, competitive, scientific and commercial events to identify asymmetrical opportunities",
    activationKeywords: ["opportunity", "opening", "gap", "timing", "pilot", "outreach", "first mover", "whitespace", "untapped"],
    systemPrompt: `You are the Opportunity Agent for Biorce.
Your mission: identify asymmetrical opportunities by combining signals across all intelligence domains.

OPPORTUNITY TYPES:
- Regulatory window: New guidance creates demand Biorce can fill before competitors
- Competitive opening: Competitor weakness or gap Biorce can exploit
- Partnership timing: Executive change or internal failure creates buy vs build tension
- Scientific validation: New evidence supports Biorce's approach
- Market event: Conference, merger, or funding round creates outreach opportunity

SCORING CRITERIA:
- Value (1-10): Revenue, strategic, or evidence impact
- Urgency (1-10): Time sensitivity — does this window close?
- Effort (1-10, lower = easier): Resources required
- Confidence (1-10): How certain is the opportunity?

RULES:
1. Only cite sources from the provided knowledge base.
2. Propose specific actions (pilot, outreach, product feature, press release).
3. Estimate value and urgency for each opportunity.
4. Output structured JSON only.`,
  },
  {
    id: "contradiction_agent",
    name: "Contradiction Agent",
    domain: "contradiction",
    description: "Detects conflicting claims, dates, product descriptions, regulatory conflicts, and gaps between public language and evidence",
    activationKeywords: ["contradiction", "conflict", "inconsistent", "discrepancy", "mismatch", "gap", "conflict", "wrong", "incorrect"],
    systemPrompt: `You are the Contradiction Agent for Biorce.
Your mission: detect contradictions, conflicts, and gaps across all intelligence sources.

CONTRADICTION TYPES:
- Internal vs public: What Biorce says internally vs publicly
- Temporal: Conflicting dates or timelines
- Product: Inconsistent product descriptions across channels
- Regulatory: Claims that conflict with regulatory requirements
- Evidence gap: Public claims not supported by evidence in the knowledge base
- Strategy drift: Current activity that contradicts stated strategy

SEVERITY:
- CRITICAL: Legal, regulatory, or reputational risk if not resolved
- HIGH: Material impact on deals, partnerships, or investor confidence
- MEDIUM: Inconsistency that should be resolved but is not urgent
- LOW: Minor wording differences with no material impact

RULES:
1. Only cite sources from the provided knowledge base.
2. For each contradiction, cite both conflicting sources.
3. Suggest resolution approach.
4. Output structured JSON only.`,
  },
  {
    id: "execution_agent",
    name: "Strategy Execution Agent",
    domain: "execution",
    description: "Converts approved strategies into initiatives, monitors milestones, identifies dependencies, escalates delays",
    activationKeywords: ["execution", "milestone", "initiative", "OKR", "KPI", "progress", "deadline", "dependency", "blocked", "delayed", "roadmap"],
    systemPrompt: `You are the Strategy Execution Agent for Biorce.
Your mission: monitor strategy execution and identify risks to delivery.

EXECUTION FRAMEWORK:
- Each strategic objective has: owner, sponsor, start date, target date, success metrics, dependencies
- Milestones are tracked as: on track / at risk / delayed / completed
- Dependencies are flagged when blocking progress
- Outcomes are compared to initial assumptions to update strategy confidence

ESCALATION TRIGGERS:
- Milestone overdue by >14 days
- Dependency unresolved for >30 days
- Success metric trajectory off track
- Owner unresponsive
- External event invalidates assumption

RULES:
1. Only cite sources from the provided knowledge base.
2. For each risk, propose a specific mitigation action.
3. Distinguish controllable risks from external risks.
4. Output structured JSON only.`,
  },
  {
    id: "board_agent",
    name: "Board Intelligence Agent",
    domain: "board",
    description: "Produces monthly board intelligence packs: risk summary, opportunities, strategy progress, regulatory deadlines, competitive moves, decisions required",
    activationKeywords: ["board", "investor", "deck", "memo", "monthly", "quarterly", "executive summary", "decisions required", "risk summary"],
    systemPrompt: `You are the Board Intelligence Agent for Biorce.
Your mission: synthesize all intelligence into board-level briefings.

BOARD PACK STRUCTURE:
1. What changed (last 30 days)
2. Decisions required (with deadline and owner)
3. Regulatory deadlines (next 90 days)
4. Competitive moves (significant events)
5. Strategy progress (vs plan)
6. Partnership health (P0/P1 only)
7. Claims at risk
8. Emerging opportunities
9. Risk register (top 5)

RULES:
1. Only cite sources from the provided knowledge base.
2. Every claim must have a source citation.
3. Use executive language — no jargon, no hedging.
4. Flag items requiring board decision explicitly.
5. Output structured JSON only.`,
  },
  {
    id: "standards_watch",
    name: "Standards Watch Agent",
    domain: "standards",
    description: "Monitors ICH M11, CDISC USDM, HL7 FHIR, and other clinical data standards relevant to Biorce's product",
    activationKeywords: ["ICH M11", "CDISC", "USDM", "HL7", "FHIR", "CDASH", "SDTM", "ADaM", "standard", "interoperability", "data model"],
    systemPrompt: `You are the Standards Watch Agent for Biorce.
Your mission: monitor clinical data standards and identify implications for Biorce's product.

KEY STANDARDS:
- ICH M11: Clinical electronic Structured Harmonised Protocol (eCTD) — Biorce's primary standard
- CDISC USDM: Unified Study Definitions Model — protocol data model
- HL7 FHIR: Healthcare data interoperability
- CDASH/SDTM/ADaM: Clinical data collection and analysis standards
- ISO 14155: Clinical investigation of medical devices

BIORCE RELEVANCE:
- Aika 2.0 must generate M11-compliant protocols
- USDM adoption by pharma creates integration opportunities
- FHIR adoption enables EHR-to-trial data flows
- Standards changes create product update requirements

RULES:
1. Only cite sources from the provided knowledge base.
2. Distinguish FINAL standards from DRAFT versions.
3. Identify implementation deadlines for pharma clients.
4. Output structured JSON only.`,
  },
  {
    id: "synthesis_agent",
    name: "Executive Synthesis Agent",
    domain: "synthesis",
    description: "Assembles all agent findings into a structured executive answer with citations, assumptions, and recommended actions",
    activationKeywords: [],
    systemPrompt: `You are the Executive Synthesis Agent for Biorce.
Your mission: assemble findings from all specialist agents into a single structured executive answer.

ANSWER FORMAT (mandatory):
1. Direct Answer: One paragraph, direct and specific
2. Verified Facts: Bullet list of facts with source citations [SOURCE: name]
3. Interpretation: What these facts mean for Biorce strategically
4. Assumptions: What you are assuming that is not in the verified knowledge base
5. Contradictions: Any conflicting information found across sources
6. Strategic Implication: The single most important strategic takeaway
7. Recommended Action: One specific, actionable next step with owner and timeline
8. Citations: Full list of sources cited
9. Freshness Date: Date of most recent source used

RULES:
1. Never fabricate citations. If a fact has no source, label it INFERRED.
2. Distinguish VERIFIED facts from INFERRED relationships.
3. If insufficient verified information exists, say so explicitly.
4. Every recommended action must be specific (who does what by when).
5. Output structured JSON only.`,
  },
];

// ─── Agent Router ─────────────────────────────────────────────────────────────

export async function selectAgentsForQuestion(
  question: string,
  maxAgents = 4
): Promise<BiorceAgentDefinition[]> {
  const questionLower = question.toLowerCase();

  // Keyword-based fast routing
  const scored = BIORCE_AGENTS.filter(a => a.id !== "synthesis_agent").map(agent => {
    const score = agent.activationKeywords.reduce((acc, kw) => {
      return acc + (questionLower.includes(kw.toLowerCase()) ? 1 : 0);
    }, 0);
    return { agent, score };
  });

  const keywordMatches = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  if (keywordMatches.length >= 2) {
    // Use top keyword matches (up to maxAgents)
    return keywordMatches.slice(0, maxAgents).map(s => s.agent);
  }

  // LLM-assisted routing for ambiguous questions
  try {
    const agentList = BIORCE_AGENTS.filter(a => a.id !== "synthesis_agent")
      .map(a => `${a.id}: ${a.description}`).join("\n");

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an agent router for the Biorce Strategy Copilot. Given a question, select the 2-4 most relevant agents to answer it. Return a JSON array of agent IDs only.`,
        },
        {
          role: "user",
          content: `Available agents:\n${agentList}\n\nQuestion: "${question}"\n\nReturn JSON array of agent IDs (2-4 agents): {"agents": ["id1", "id2"]}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agent_selection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              agents: { type: "array", items: { type: "string" } },
            },
            required: ["agents"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content : "{}";
    const parsed = JSON.parse(content) as { agents: string[] };
    const selectedIds = new Set(parsed.agents || []);
    const selected = BIORCE_AGENTS.filter(a => selectedIds.has(a.id) && a.id !== "synthesis_agent");
    return selected.length > 0 ? selected : [BIORCE_AGENTS[0]];
  } catch {
    // Fallback: use competitive + regulatory agents
    return BIORCE_AGENTS.filter(a => ["competitive_intel", "regulatory_watch"].includes(a.id));
  }
}

// ─── Agent Execution ──────────────────────────────────────────────────────────

async function runAgent(
  agent: BiorceAgentDefinition,
  context: IntelligenceContext
): Promise<AgentAnalysis> {
  const messages = [
    { role: "system" as const, content: agent.systemPrompt },
    {
      role: "user" as const,
      content: `QUESTION: ${context.question}

KNOWLEDGE BASE (verified intelligence):
${context.knowledgeBase}

REGULATORY CONTEXT:
${context.regulatoryContext}

COMPETITIVE CONTEXT:
${context.competitorContext}

PARTNERSHIP CONTEXT:
${context.partnerContext}

CONVERSATION HISTORY:
${context.conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

Provide your analysis in JSON format:
{
  "finding": "Your primary finding relevant to the question",
  "confidence": 0-100,
  "citations": ["source1", "source2"],
  "flags": ["any warnings or concerns"],
  "recommendations": ["specific actionable recommendations"]
}`,
    },
  ];

  try {
    const result = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agent_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              finding: { type: "string" },
              confidence: { type: "number" },
              citations: { type: "array", items: { type: "string" } },
              flags: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
            },
            required: ["finding", "confidence", "citations", "flags", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content : "{}";
    const parsed = JSON.parse(content) as Omit<AgentAnalysis, "agentId" | "agentName" | "domain">;

    return {
      agentId: agent.id,
      agentName: agent.name,
      domain: agent.domain,
      finding: parsed.finding || "No finding",
      confidence: Math.min(100, Math.max(0, parsed.confidence || 0)),
      citations: parsed.citations || [],
      flags: parsed.flags || [],
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error(`[BiorceOrchestrator] Agent ${agent.id} failed:`, error);
    return {
      agentId: agent.id,
      agentName: agent.name,
      domain: agent.domain,
      finding: "Agent unavailable — manual review recommended",
      confidence: 0,
      citations: [],
      flags: [`Agent error: ${error instanceof Error ? error.message : "Unknown"}`],
      recommendations: [],
    };
  }
}

// ─── Synthesis ────────────────────────────────────────────────────────────────

async function synthesizeAnswer(
  question: string,
  agentResults: AgentAnalysis[],
  context: IntelligenceContext
): Promise<OrchestratedAnswer> {
  const synthAgent = BIORCE_AGENTS.find(a => a.id === "synthesis_agent")!;
  const agentSummary = agentResults.map(r =>
    `[${r.agentName.toUpperCase()} — confidence: ${r.confidence}%]\nFinding: ${r.finding}\nCitations: ${r.citations.join(", ")}\nFlags: ${r.flags.join(", ")}\nRecommendations: ${r.recommendations.join("; ")}`
  ).join("\n\n---\n\n");

  const messages = [
    { role: "system" as const, content: synthAgent.systemPrompt },
    {
      role: "user" as const,
      content: `QUESTION: ${question}

AGENT FINDINGS:
${agentSummary}

FULL KNOWLEDGE BASE:
${context.knowledgeBase}

Synthesize into a structured executive answer:
{
  "directAnswer": "...",
  "verifiedFacts": ["fact [SOURCE: name]", ...],
  "interpretation": "...",
  "assumptions": ["..."],
  "contradictions": ["..."],
  "strategicImplication": "...",
  "recommendedAction": "...",
  "citations": ["source1", "source2"],
  "freshnessDate": "YYYY-MM-DD",
  "confidence": 0-100
}`,
    },
  ];

  try {
    const result = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "orchestrated_answer",
          strict: true,
          schema: {
            type: "object",
            properties: {
              directAnswer: { type: "string" },
              verifiedFacts: { type: "array", items: { type: "string" } },
              interpretation: { type: "string" },
              assumptions: { type: "array", items: { type: "string" } },
              contradictions: { type: "array", items: { type: "string" } },
              strategicImplication: { type: "string" },
              recommendedAction: { type: "string" },
              citations: { type: "array", items: { type: "string" } },
              freshnessDate: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["directAnswer", "verifiedFacts", "interpretation", "assumptions", "contradictions", "strategicImplication", "recommendedAction", "citations", "freshnessDate", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content : "{}";
    const parsed = JSON.parse(content) as Omit<OrchestratedAnswer, "agentsInvoked">;

    return {
      ...parsed,
      agentsInvoked: agentResults.map(r => r.agentName),
    };
  } catch (error) {
    console.error("[BiorceOrchestrator] Synthesis failed:", error);
    // Fallback: assemble from agent results
    const allCitations = Array.from(new Set(agentResults.flatMap(r => r.citations)));
    const allRecs = agentResults.flatMap(r => r.recommendations).slice(0, 3);
    return {
      directAnswer: agentResults.map(r => r.finding).join(" "),
      verifiedFacts: agentResults.flatMap(r => r.citations.map(c => `[SOURCE: ${c}]`)),
      interpretation: "Multiple agents provided findings. See verified facts for details.",
      assumptions: [],
      contradictions: agentResults.flatMap(r => r.flags),
      strategicImplication: allRecs[0] || "Review agent findings for strategic implications.",
      recommendedAction: allRecs[1] || "Consult with strategy team.",
      citations: allCitations,
      freshnessDate: new Date().toISOString().split("T")[0],
      agentsInvoked: agentResults.map(r => r.agentName),
      confidence: Math.round(agentResults.reduce((s, r) => s + r.confidence, 0) / Math.max(agentResults.length, 1)),
    };
  }
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export async function runBiorceOrchestrator(
  context: IntelligenceContext
): Promise<{ answer: OrchestratedAnswer; agentResults: AgentAnalysis[] }> {
  // Step 1: Route to relevant agents
  const selectedAgents = await selectAgentsForQuestion(context.question);
  console.log(`[BiorceOrchestrator] Routing to agents: ${selectedAgents.map(a => a.id).join(", ")}`);

  // Step 2: Run agents in parallel
  const agentResults = await Promise.all(
    selectedAgents.map(agent => runAgent(agent, context))
  );

  // Step 3: Synthesize
  const answer = await synthesizeAnswer(context.question, agentResults, context);

  return { answer, agentResults };
}

// ─── Agent Library (for UI) ───────────────────────────────────────────────────

export function getAvailableAgents() {
  return BIORCE_AGENTS.map(a => ({
    id: a.id,
    name: a.name,
    domain: a.domain,
    description: a.description,
    activationKeywords: a.activationKeywords,
  }));
}
