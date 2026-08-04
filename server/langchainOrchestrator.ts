/**
 * Biorce LangChain Orchestrator
 *
 * Architecture:
 *   1. ROUTER CHAIN  — selects which agents are relevant for the question
 *   2. AGENT CHAINS  — each selected agent runs independently (parallel)
 *   3. DEBATE ROUND  — agents with conflicting findings challenge each other
 *   4. CONSENSUS     — a consensus chain resolves conflicts and scores agreement
 *   5. SYNTHESIS     — executive synthesis agent produces the final answer
 *
 * All LLM calls go through the Manus built-in proxy (OpenAI-compatible).
 */

import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnableParallel } from "@langchain/core/runnables";
import { ENV } from "./_core/env";

// ─── LLM Factory ─────────────────────────────────────────────────────────────

function makeLLM(temperature = 0.2) {
  const baseURL = ENV.forgeApiUrl
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1`
    : "https://forge.manus.im/v1";
  return new ChatOpenAI({
    openAIApiKey: ENV.forgeApiKey,
    configuration: { baseURL },
    temperature,
    maxRetries: 3,
  });
}

// ─── Agent Definitions ───────────────────────────────────────────────────────

export const LANGCHAIN_AGENTS = [
  {
    id: "regulatory_watch",
    name: "Regulatory Watch Agent",
    domain: "regulatory",
    systemPrompt: `You are the Biorce Regulatory Watch Agent. You specialise in FDA, EMA, EU AI Act, ICH, and CDISC regulatory intelligence. 
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Only cite primary regulatory sources. Distinguish VERIFIED from INFERRED. Be concise and precise.`,
    activationKeywords: ["fda", "ema", "regulatory", "compliance", "approval", "eu ai act", "ich", "cdisc", "510k", "ce mark"],
  },
  {
    id: "competitive_intel",
    name: "Competitive Intelligence Agent",
    domain: "competitive",
    systemPrompt: `You are the Biorce Competitive Intelligence Agent. You track Medidata, Veeva Vault, Oracle Clinical, Castor EDC, and other clinical AI competitors.
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Focus on competitive positioning, market moves, and strategic threats to Biorce.`,
    activationKeywords: ["competitor", "medidata", "veeva", "oracle", "castor", "market", "competitive", "rival", "landscape"],
  },
  {
    id: "pharma_signal",
    name: "Pharma Signal Engine",
    domain: "pharma",
    systemPrompt: `You are the Biorce Pharma Signal Engine. You identify partnership and commercial signals from pharma companies (Novo Nordisk, Roche, Pfizer, AZ, BMS, Lilly, Sanofi, GSK, Novartis, J&J).
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Focus on signals that indicate readiness for AI infrastructure partnerships.`,
    activationKeywords: ["pharma", "novo nordisk", "roche", "pfizer", "partnership", "signal", "biotech", "clinical trial", "sponsor"],
  },
  {
    id: "claims_guardian",
    name: "Claims Guardian",
    domain: "claims",
    systemPrompt: `You are the Biorce Claims Guardian. You audit all factual claims for accuracy, source quality, and internal consistency.
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Flag any unsupported claims, circular references, or statements that exceed the evidence base.`,
    activationKeywords: ["claim", "evidence", "fact", "verify", "source", "accuracy", "citation", "support"],
  },
  {
    id: "vision_consistency",
    name: "Vision Consistency Agent",
    domain: "vision",
    systemPrompt: `You are the Biorce Vision Consistency Agent. You ensure all strategy, messaging, and decisions align with Biorce's core positioning: neutral AI infrastructure for clinical trials, NOT a CRO, NOT a pharma company.
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Flag any drift from the neutral platform vision.`,
    activationKeywords: ["vision", "positioning", "brand", "messaging", "strategy", "mission", "identity", "neutral"],
  },
  {
    id: "scientific_evidence",
    name: "Scientific Evidence Agent",
    domain: "science",
    systemPrompt: `You are the Biorce Scientific Evidence Agent. You assess the scientific validity of claims about AI in clinical trials, decentralised trials, and digital health.
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Cite peer-reviewed sources where available. Distinguish clinical evidence from commercial claims.`,
    activationKeywords: ["scientific", "evidence", "study", "trial", "clinical", "research", "paper", "publication", "data"],
  },
  {
    id: "partnership_intel",
    name: "Partnership Intelligence Agent",
    domain: "partnerships",
    systemPrompt: `You are the Biorce Partnership Intelligence Agent. You manage intelligence on 63 strategic partners across pharma, AI labs, hospitals, CROs, investors, and regulators.
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Focus on partnership readiness, mutual value, deal economics, and next actions.`,
    activationKeywords: ["partner", "partnership", "alliance", "collaboration", "deal", "outreach", "relationship", "pipeline"],
  },
  {
    id: "opportunity_agent",
    name: "Opportunity Agent",
    domain: "opportunity",
    systemPrompt: `You are the Biorce Opportunity Agent. You identify asymmetric strategic opportunities by cross-referencing regulatory windows, competitive gaps, and partnership readiness.
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Focus on time-sensitive opportunities with high leverage for Biorce.`,
    activationKeywords: ["opportunity", "gap", "window", "timing", "leverage", "asymmetric", "advantage", "market entry"],
  },
  {
    id: "contradiction_agent",
    name: "Contradiction Agent",
    domain: "contradictions",
    systemPrompt: `You are the Biorce Contradiction Agent. You detect internal contradictions, inconsistencies, and logical conflicts across Biorce's knowledge base, strategy documents, and agent findings.
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Be precise about the nature and severity of each contradiction found.`,
    activationKeywords: ["contradiction", "conflict", "inconsistency", "discrepancy", "conflict", "disagree", "mismatch"],
  },
  {
    id: "strategy_execution",
    name: "Strategy Execution Agent",
    domain: "execution",
    systemPrompt: `You are the Biorce Strategy Execution Agent. You track progress against the 5 strategic sequences: Ecosystem Credibility, Channel & Embeddedness, Proof of Execution, Regulatory Validation, and Series B Asset.
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Focus on execution gaps, overdue actions, and milestone risks.`,
    activationKeywords: ["execution", "milestone", "progress", "roadmap", "sprint", "series b", "fundraise", "kpi", "okr"],
  },
  {
    id: "board_intelligence",
    name: "Board Intelligence Agent",
    domain: "board",
    systemPrompt: `You are the Biorce Board Intelligence Agent. You prepare board-level intelligence: risk register, opportunity pipeline, regulatory deadlines, competitive threats, and strategic progress.
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Write at board-memo level: concise, evidence-based, decision-oriented.`,
    activationKeywords: ["board", "investor", "fundraise", "deck", "memo", "governance", "risk", "fiduciary"],
  },
  {
    id: "standards_watch",
    name: "Standards Watch Agent",
    domain: "standards",
    systemPrompt: `You are the Biorce Standards Watch Agent. You monitor ICH M11, CDISC USDM, HL7 FHIR R4/R5, ISO 13485, and EU AI Act technical standards relevant to clinical AI infrastructure.
Analyse the question and context. Return a JSON object with keys: finding (string), confidence (0-100), citations (string[]), flags (string[]), recommendations (string[]).
Focus on standards that affect Biorce's product compliance and partner interoperability.`,
    activationKeywords: ["standard", "ich", "cdisc", "fhir", "hl7", "iso", "interoperability", "protocol", "specification"],
  },
] as const;

export type AgentId = typeof LANGCHAIN_AGENTS[number]["id"];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AgentFinding {
  agentId: string;
  agentName: string;
  finding: string;
  confidence: number;
  citations: string[];
  flags: string[];
  recommendations: string[];
  debateChallenge?: string;
  debateResponse?: string;
}

export interface ConsensusResult {
  agreementScore: number;        // 0-100
  conflictingAgents: string[];
  resolvedConflicts: string[];
  consensusStatement: string;
}

export interface LangChainOrchestratorResult {
  directAnswer: string;
  verifiedFacts: string[];
  interpretation: string;
  assumptions: string[];
  contradictions: string[];
  strategicImplication: string;
  recommendedAction: string;
  citations: string[];
  freshnessDate: string;
  confidence: number;
  agentsInvoked: string[];
  agentFindings: AgentFinding[];
  consensus: ConsensusResult;
  debateRounds: number;
}

export interface OrchestratorInput {
  question: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  knowledgeBase: string;
  regulatoryContext: string;
  competitorContext: string;
  partnerContext: string;
}

// ─── Step 1: Router Chain ─────────────────────────────────────────────────────

async function routeToAgents(question: string): Promise<typeof LANGCHAIN_AGENTS[number][]> {
  const llm = makeLLM(0.0);
  const routerPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are an agent router for the Biorce Strategy Copilot. Given a question, select the most relevant agents from this list:
${LANGCHAIN_AGENTS.map(a => `- ${a.id}: ${a.name} (keywords: ${a.activationKeywords.join(", ")})`).join("\n")}

Return ONLY a JSON array of agent IDs, e.g. ["regulatory_watch", "competitive_intel"].
Select 2-6 agents. Always include at least one domain-specific agent. For broad strategic questions, include strategy_execution and opportunity_agent.`
    ),
    HumanMessagePromptTemplate.fromTemplate("Question: {question}"),
  ]);

  const chain = RunnableSequence.from([routerPrompt, llm, new StringOutputParser()]);

  try {
    const raw = await chain.invoke({ question });
    const match = raw.match(/\[[^\]]*\]/);
    if (!match) throw new Error("No JSON array found");
    const ids: string[] = JSON.parse(match[0]);
    const selected = LANGCHAIN_AGENTS.filter(a => ids.includes(a.id));
    return selected.length > 0 ? selected : LANGCHAIN_AGENTS.slice(0, 3);
  } catch {
    // Fallback: keyword matching
    const q = question.toLowerCase();
    const scored = LANGCHAIN_AGENTS.map(a => ({
      agent: a,
      score: a.activationKeywords.filter(k => q.includes(k)).length,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map(s => s.agent);
  }
}

// ─── Step 2: Agent Chains (parallel) ─────────────────────────────────────────

async function runAgentChain(
  agent: typeof LANGCHAIN_AGENTS[number],
  input: OrchestratorInput
): Promise<AgentFinding> {
  const llm = makeLLM(0.1);
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(agent.systemPrompt),
    HumanMessagePromptTemplate.fromTemplate(
      `QUESTION: {question}

KNOWLEDGE BASE (most relevant items):
{knowledgeBase}

REGULATORY CONTEXT:
{regulatoryContext}

COMPETITIVE CONTEXT:
{competitorContext}

PARTNER CONTEXT:
{partnerContext}

Respond with ONLY a valid JSON object matching this schema:
{{
  "finding": "Your primary finding (2-4 sentences)",
  "confidence": <0-100>,
  "citations": ["source1", "source2"],
  "flags": ["flag1"],
  "recommendations": ["action1", "action2"]
}}`
    ),
  ]);

  const chain = RunnableSequence.from([prompt, llm, new StringOutputParser()]);

  try {
    const raw = await chain.invoke({
      question: input.question,
      knowledgeBase: input.knowledgeBase.slice(0, 3000),
      regulatoryContext: input.regulatoryContext.slice(0, 1000),
      competitorContext: input.competitorContext.slice(0, 1000),
      partnerContext: input.partnerContext.slice(0, 1000),
    });

    const match = raw.match(/\{[^]*\}/);
    if (!match) throw new Error("No JSON object found");
    const parsed = JSON.parse(match[0]);

    return {
      agentId: agent.id,
      agentName: agent.name,
      finding: parsed.finding ?? "No finding produced.",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 50,
      citations: Array.isArray(parsed.citations) ? parsed.citations : [],
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (err) {
    console.error(`[LangChain] Agent ${agent.id} failed:`, err);
    return {
      agentId: agent.id,
      agentName: agent.name,
      finding: `${agent.name} could not produce a finding for this question.`,
      confidence: 0,
      citations: [],
      flags: ["agent_error"],
      recommendations: [],
    };
  }
}

// ─── Step 3: Debate Round ─────────────────────────────────────────────────────

async function runDebateRound(findings: AgentFinding[]): Promise<AgentFinding[]> {
  // Identify conflicting pairs: agents whose flags or findings contradict each other
  const highConfidence = findings.filter(f => f.confidence >= 70);
  const lowConfidence = findings.filter(f => f.confidence < 50 && f.confidence > 0);

  if (highConfidence.length === 0 || lowConfidence.length === 0) {
    return findings; // No meaningful debate possible
  }

  const llm = makeLLM(0.3);
  const debatePrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are a debate moderator for the Biorce Strategy Copilot. 
A high-confidence agent has made a finding. A lower-confidence agent has a potentially conflicting view.
Your job: generate a brief challenge from the lower-confidence agent to the higher-confidence agent (1-2 sentences), 
then generate the higher-confidence agent's response (1-2 sentences).
Return JSON: {{"challenge": "...", "response": "..."}}`
    ),
    HumanMessagePromptTemplate.fromTemplate(
      `HIGH-CONFIDENCE AGENT ({highAgent}): {highFinding}
LOW-CONFIDENCE AGENT ({lowAgent}): {lowFinding}`
    ),
  ]);

  const chain = RunnableSequence.from([debatePrompt, llm, new StringOutputParser()]);

  // Run one debate between the highest and lowest confidence agents
  const highest = highConfidence[0];
  const lowest = lowConfidence[lowConfidence.length - 1];

  try {
    const raw = await chain.invoke({
      highAgent: highest.agentName,
      highFinding: highest.finding,
      lowAgent: lowest.agentName,
      lowFinding: lowest.finding,
    });
    const match = raw.match(/\{[^]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return findings.map(f => {
        if (f.agentId === lowest.agentId) return { ...f, debateChallenge: parsed.challenge };
        if (f.agentId === highest.agentId) return { ...f, debateResponse: parsed.response };
        return f;
      });
    }
  } catch (err) {
    console.error("[LangChain] Debate round failed:", err);
  }

  return findings;
}

// ─── Step 4: Consensus Chain ──────────────────────────────────────────────────

async function runConsensusChain(findings: AgentFinding[]): Promise<ConsensusResult> {
  const llm = makeLLM(0.1);
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are the Biorce Consensus Engine. You receive findings from multiple specialised agents and determine:
1. The overall agreement score (0-100, where 100 = full consensus)
2. Which agents have conflicting views
3. How those conflicts are resolved
4. A single consensus statement that all agents can agree on
Return ONLY valid JSON: {{"agreementScore": <0-100>, "conflictingAgents": ["agent1", "agent2"], "resolvedConflicts": ["resolution1"], "consensusStatement": "..."}}`
    ),
    HumanMessagePromptTemplate.fromTemplate(
      `AGENT FINDINGS:
{findings}

Produce the consensus analysis.`
    ),
  ]);

  const chain = RunnableSequence.from([prompt, llm, new StringOutputParser()]);

  const findingsSummary = findings.map(f =>
    `[${f.agentName} | confidence: ${f.confidence}%]\n${f.finding}\nFlags: ${f.flags.join(", ") || "none"}`
  ).join("\n\n---\n\n");

  try {
    const raw = await chain.invoke({ findings: findingsSummary });
    const match = raw.match(/\{[^]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    return {
      agreementScore: typeof parsed.agreementScore === "number" ? parsed.agreementScore : 70,
      conflictingAgents: Array.isArray(parsed.conflictingAgents) ? parsed.conflictingAgents : [],
      resolvedConflicts: Array.isArray(parsed.resolvedConflicts) ? parsed.resolvedConflicts : [],
      consensusStatement: parsed.consensusStatement ?? "Agents reached partial consensus.",
    };
  } catch {
    const avgConfidence = findings.reduce((s, f) => s + f.confidence, 0) / Math.max(findings.length, 1);
    return {
      agreementScore: Math.round(avgConfidence),
      conflictingAgents: [],
      resolvedConflicts: [],
      consensusStatement: findings.map(f => f.finding).join(" "),
    };
  }
}

// ─── Step 5: Synthesis Chain ──────────────────────────────────────────────────

async function runSynthesisChain(
  question: string,
  findings: AgentFinding[],
  consensus: ConsensusResult,
  context: OrchestratorInput
): Promise<Omit<LangChainOrchestratorResult, "agentFindings" | "consensus" | "debateRounds" | "agentsInvoked">> {
  const llm = makeLLM(0.2);
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are the Biorce Executive Synthesis Agent. You receive findings from multiple specialised agents, a consensus analysis, and the original question. 
Your role: produce a definitive, board-ready executive answer.

RULES:
- Every factual claim must include [SOURCE: name]
- Distinguish VERIFIED from INFERRED
- Be concise but complete
- The directAnswer must be actionable
- Confidence reflects the quality of evidence, not your certainty

Return ONLY valid JSON matching this exact schema:
{{
  "directAnswer": "...",
  "verifiedFacts": ["fact [SOURCE: name]", ...],
  "interpretation": "...",
  "assumptions": ["..."],
  "contradictions": ["..."],
  "strategicImplication": "...",
  "recommendedAction": "...",
  "citations": ["source1", "source2"],
  "freshnessDate": "YYYY-MM-DD",
  "confidence": <0-100>
}}`
    ),
    HumanMessagePromptTemplate.fromTemplate(
      `QUESTION: {question}

AGENT FINDINGS:
{agentFindings}

CONSENSUS ANALYSIS:
Agreement Score: {agreementScore}%
Consensus Statement: {consensusStatement}
Conflicts Resolved: {resolvedConflicts}

KNOWLEDGE BASE CONTEXT:
{knowledgeBase}

Produce the executive synthesis.`
    ),
  ]);

  const chain = RunnableSequence.from([prompt, llm, new StringOutputParser()]);

  const agentFindingsSummary = findings.map(f =>
    `[${f.agentName} | ${f.confidence}% confidence]\n${f.finding}\nCitations: ${f.citations.join(", ")}\nRecommendations: ${f.recommendations.join("; ")}`
  ).join("\n\n---\n\n");

  try {
    const raw = await chain.invoke({
      question,
      agentFindings: agentFindingsSummary,
      agreementScore: consensus.agreementScore,
      consensusStatement: consensus.consensusStatement,
      resolvedConflicts: consensus.resolvedConflicts.join("; ") || "none",
      knowledgeBase: context.knowledgeBase.slice(0, 2000),
    });

    const match = raw.match(/\{[^]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);

    return {
      directAnswer: parsed.directAnswer ?? consensus.consensusStatement,
      verifiedFacts: Array.isArray(parsed.verifiedFacts) ? parsed.verifiedFacts : [],
      interpretation: parsed.interpretation ?? "",
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      contradictions: Array.isArray(parsed.contradictions) ? parsed.contradictions : consensus.conflictingAgents,
      strategicImplication: parsed.strategicImplication ?? "",
      recommendedAction: parsed.recommendedAction ?? "",
      citations: Array.isArray(parsed.citations) ? parsed.citations : [],
      freshnessDate: parsed.freshnessDate ?? new Date().toISOString().split("T")[0],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : consensus.agreementScore,
    };
  } catch (err) {
    console.error("[LangChain] Synthesis failed:", err);
    const allCitations = Array.from(new Set(findings.flatMap(f => f.citations)));
    return {
      directAnswer: consensus.consensusStatement,
      verifiedFacts: allCitations.map(c => `[SOURCE: ${c}]`),
      interpretation: "Multiple agents provided findings. See verified facts.",
      assumptions: [],
      contradictions: consensus.conflictingAgents,
      strategicImplication: findings.flatMap(f => f.recommendations)[0] ?? "",
      recommendedAction: findings.flatMap(f => f.recommendations)[1] ?? "",
      citations: allCitations,
      freshnessDate: new Date().toISOString().split("T")[0],
      confidence: consensus.agreementScore,
    };
  }
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export async function runLangChainOrchestrator(
  input: OrchestratorInput
): Promise<LangChainOrchestratorResult> {
  const startTime = Date.now();
  console.log(`[LangChain] Starting orchestration for: "${input.question.slice(0, 80)}..."`);

  // Step 1: Route to relevant agents
  const selectedAgents = await routeToAgents(input.question);
  console.log(`[LangChain] Routing to: ${selectedAgents.map(a => a.id).join(", ")}`);

  // Step 2: Run all selected agents in parallel
  const agentFindings = await Promise.all(
    selectedAgents.map(agent => runAgentChain(agent, input))
  );
  console.log(`[LangChain] ${agentFindings.length} agents completed in ${Date.now() - startTime}ms`);

  // Step 3: Debate round (resolve conflicts)
  const debatedFindings = await runDebateRound(agentFindings);
  const debateRounds = debatedFindings.some(f => f.debateChallenge) ? 1 : 0;

  // Step 4: Consensus
  const consensus = await runConsensusChain(debatedFindings);
  console.log(`[LangChain] Consensus score: ${consensus.agreementScore}%`);

  // Step 5: Synthesis
  const synthesis = await runSynthesisChain(input.question, debatedFindings, consensus, input);
  console.log(`[LangChain] Orchestration complete in ${Date.now() - startTime}ms`);

  return {
    ...synthesis,
    agentsInvoked: selectedAgents.map(a => a.name),
    agentFindings: debatedFindings,
    consensus,
    debateRounds,
  };
}

// ─── Scheduled Agent Helper ───────────────────────────────────────────────────

/**
 * Run a single named agent in isolation (used by scheduled handlers).
 * Returns the agent finding without the full orchestration pipeline.
 */
export async function runSingleAgent(
  agentId: AgentId,
  question: string,
  context: OrchestratorInput
): Promise<AgentFinding> {
  const agent = LANGCHAIN_AGENTS.find(a => a.id === agentId);
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);
  return runAgentChain(agent, context);
}

// ─── Decision Room Creation Gate ─────────────────────────────────────────────

export type GateMateriality = "low" | "medium" | "high" | "critical";

export interface DecisionGateResult {
  isDecision: boolean;
  materiality: GateMateriality;
  confidence: number;           // 0-100
  normalizedQuestion: string;
  alternatives: string[];
  proposedOwner: string | null;
  proposedDeadline: string | null;
  rationale: string;
  signalsMatched: string[];
  gateVersion: string;
}

// ── Pattern constants ─────────────────────────────────────────────────────────
const DECISION_VERBS = /\bshould\s+(we|biorce|i)\b|\bwhether\s+(we|biorce|to)\b|\bchoose\b|\bchoosing\b|\bselect\b|\bprioritize\b|\bprioritise\b|\bproceed\b|\bapprove\b|\breject\b|\bsign\b|\benter\b|\bexit\b|\bterminate\b|\bpause\b|\binvest\b|\bcommit\b/i;
const WHETHER_PATTERN = /\bwhether\b/i;
const CHOICE_PATTERN = /\bchoose\b|\bchoosing\b|\bselect\b|\bprioritize\b|\bprioritise\b|\bbest\s+\S+\s+(partner|option|route|strategy|vendor|platform)\b/i;
const YES_NO_COMMITMENT = /\bshould\s+(we|biorce|i)\b|\brecommend\s+whether\b|\badvise\s+(us\s+)?whether\b/i;
const INFORMATIONAL_PREFIX = /^(what\s+(is|are|does|do|was|were|has|have)|how\s+(does|do|can|could|would|to)|explain|describe|summarize|summarise|list|give\s+me|show\s+me|find|search|look\s+up|tell\s+me\s+about|what\s+happened|what\s+is\s+the\s+status|what\s+is\s+the\s+current)\b/i;
const INFORMATIONAL_REQUEST = /^(draft|write|rewrite|generate|create\s+a\s+(template|email|memo|brief|deck))\b/i;
const EXPLICIT_ALTERNATIVES = /\bversus\b|\bvs\.?\b|\bbetween\b|\bover\b/i;
const OR_ALTERNATIVES = /\b(\w[\w-]*)\s+or\s+(\w[\w-]*)\b/i;

/**
 * Precedence-model Decision Room gate classifier.
 * Evaluation order:
 *   1. Detect decision intent (DECISION_VERBS, WHETHER_PATTERN, CHOICE_PATTERN, YES_NO_COMMITMENT)
 *   2. Detect informational form (INFORMATIONAL_PREFIX, INFORMATIONAL_REQUEST)
 *   3. Exclude ONLY when informational AND no decision intent
 *   4. Weighted signal scoring (choice 30, alternatives+implicit_yesno 25, consequences 25, owner 10, deadline 10)
 *
 * Confidence tiers:
 *   >= 80 + materiality high/critical  → create automatically
 *   55-79                              → return for user confirmation prompt
 *   < 55                               → keep as normal Copilot conversation
 */
export function classifyDecisionGate(question: string): DecisionGateResult {
  const GATE_VERSION = "v1.3-precedence";
  const q = question.toLowerCase().trim();
  const signalsMatched: string[] = [];
  const alternatives: string[] = [];
  let proposedOwner: string | null = null;
  let proposedDeadline: string | null = null;

  // ── Step 1: Detect decision intent (BEFORE any exclusion check) ──────────
  const hasDecisionIntent = (
    DECISION_VERBS.test(q) ||
    WHETHER_PATTERN.test(q) ||
    CHOICE_PATTERN.test(q) ||
    YES_NO_COMMITMENT.test(q)
  );

  // ── Step 2: Detect informational form ────────────────────────────────────
  const isInformational = INFORMATIONAL_PREFIX.test(q) || INFORMATIONAL_REQUEST.test(q);

  // ── Step 3: Exclude ONLY when informational AND no decision intent ────────
  if (isInformational && !hasDecisionIntent) {
    return {
      isDecision: false,
      materiality: "low",
      confidence: 0,
      normalizedQuestion: question,
      alternatives,
      proposedOwner,
      proposedDeadline,
      rationale: "Excluded: definitional, explanatory, or drafting question — not a strategic decision.",
      signalsMatched: [],
      gateVersion: GATE_VERSION,
    };
  }

  // ── Step 4: Weighted signal scoring ──────────────────────────────────────
  // Weights: material_choice 30, alternatives+implicit_yesno 25, consequences 25, owner 10, deadline 10
  let weightedScore = 0;

  // Signal A: Material choice or commitment (weight 30)
  const hasMaterialChoice = DECISION_VERBS.test(q) || WHETHER_PATTERN.test(q) || CHOICE_PATTERN.test(q) || YES_NO_COMMITMENT.test(q);
  if (hasMaterialChoice) {
    signalsMatched.push("material_choice");
    weightedScore += 30;
  }

  // Signal B: Alternatives — explicit OR implicit yes/no (weight 25)
  // Binary decisions ("should we proceed?") have two implicit alternatives: proceed / do not proceed.
  // Any question with a decision verb inherently has at least two options.
  const hasExplicitAlts = EXPLICIT_ALTERNATIVES.test(q) || OR_ALTERNATIVES.test(q) || /\balternative\b|\boption\b|\bcompare\b/.test(q);
  const hasImplicitYesNo = hasMaterialChoice;
  const altMatch = q.match(/\b(\w[\w-]*)\s+(?:or|vs\.?|versus|over)\s+(\w[\w-]*)/);
  if (hasExplicitAlts || hasImplicitYesNo) {
    signalsMatched.push(hasExplicitAlts ? "alternatives_explicit" : "alternatives_implicit_yesno");
    weightedScore += 25;
    if (altMatch) {
      alternatives.push(altMatch[1].trim(), altMatch[2].trim());
    } else if (hasImplicitYesNo && !hasExplicitAlts) {
      alternatives.push("proceed", "do not proceed");
    }
  }

  // Signal C: Meaningful consequences (weight 25)
  const hasConsequences = (
    /\b(partner|invest|commit|sign|launch|approve|engage|pursue|revenue|contract|deal|agreement|regulatory|compliance|risk|liability|budget|headcount|roadmap)\b/.test(q) ||
    /\b(distribution|strategy|execution|pipeline|integration|adoption|moat|milestone|series\s+[ab]|fundraise|acquisition)\b/.test(q) ||
    /\b(affect|impact|implication|consequence|outcome|result|effect)\b/.test(q)
  );
  if (hasConsequences) {
    signalsMatched.push("meaningful_consequences");
    weightedScore += 25;
  }

  // Signal D: Identifiable decision owner (weight 10)
  const ownerMatch = q.match(/\b(pedro|malena|ceo|cto|coo|board|team|biorce|head\s+of\s+\w+)\b/);
  if (ownerMatch) {
    signalsMatched.push("decision_owner");
    proposedOwner = ownerMatch[1];
    weightedScore += 10;
  }

  // Signal E: Decision deadline or triggering event (weight 10)
  const deadlineMatch = q.match(/\b(before|by|until|deadline|q[1-4]\s*\d{4}|august|september|october|november|december|january|\d{4}|next\s+\w+|this\s+\w+|within\s+\d+)\b/);
  const hasTrigger = /\b(before|by|deadline|trigger|when|if\s+we|once|after|upon|following)\b/.test(q);
  if (deadlineMatch || hasTrigger) {
    signalsMatched.push("deadline_or_trigger");
    if (deadlineMatch) proposedDeadline = deadlineMatch[1];
    weightedScore += 10;
  }

  // ── Step 5: Materiality ───────────────────────────────────────────────────
  let materiality: GateMateriality = "medium";
  const criticalTerms = /\b(invest|commit|sign|contract|regulatory|compliance|series\s+b|fundraise|acquisition|merger|exclusivity|ip\s+rights|data\s+rights)\b/.test(q);
  const highTerms = /\b(partner|launch|approve|pursue|proceed|engage|deal|agreement|budget|headcount)\b/.test(q);
  if (criticalTerms) materiality = "critical";
  else if (highTerms || weightedScore >= 80) materiality = "high";

  // ── Step 6: Confidence ────────────────────────────────────────────────────
  // weightedScore is already 0-100 (max 30+25+25+10+10 = 100)
  const materialityBonus = materiality === "critical" ? 5 : materiality === "high" ? 3 : 0;
  const confidence = Math.min(95, weightedScore + materialityBonus);
  const isDecision = confidence >= 55;

  // ── Step 7: Safe logging (no question text, no entity names) ─────────────
  console.log(`[DecisionGate] version=${GATE_VERSION} signals=[${signalsMatched.join(",")}] score=${weightedScore} confidence=${confidence} tier=${isDecision ? (confidence >= 80 ? "auto" : "prompt") : "skip"} materiality=${materiality}`);

  return {
    isDecision,
    materiality,
    confidence,
    normalizedQuestion: question,
    alternatives,
    proposedOwner,
    proposedDeadline,
    rationale: isDecision
      ? `${signalsMatched.length} signals matched: ${signalsMatched.join(", ")}. Weighted score: ${weightedScore}. Materiality: ${materiality}.`
      : `Weighted score ${weightedScore} below threshold (55). Signals: ${signalsMatched.join(", ") || "none"}.`,
    signalsMatched,
    gateVersion: GATE_VERSION,
  };
}

/** Backward-compatible boolean helper used by the router for the auto-create path */
export function shouldCreateDecisionRoom(question: string): boolean {
  const result = classifyDecisionGate(question);
  return result.isDecision && result.confidence >= 80 && (result.materiality === "high" || result.materiality === "critical");
}

/** Returns true when confidence is in the 55-79 range — caller should prompt user to confirm */
export function shouldPromptDecisionRoom(question: string): boolean {
  const result = classifyDecisionGate(question);
  return result.isDecision && result.confidence >= 55 && result.confidence < 80;
}

// ─── DB Persistence Layer ─────────────────────────────────────────────────────
/**
 * Persists a completed LangChain orchestration run as a Decision Room record.
 * Creates: 1 decision_room row, N agent_claim rows, M claim_vote rows, evidence entries.
 * Safe to call after runLangChainOrchestrator — never throws, just logs on error.
 */
export async function persistDecisionRoom(
  title: string,
  question: string,
  result: LangChainOrchestratorResult,
  opts: {
    partnerId?: number;
    context?: string;
    gateConfidence?: number;
    gateMateriality?: "low" | "medium" | "high" | "critical";
    gateRationale?: string;
    gateVersion?: string;
    roomSource?: "auto" | "user_confirmed" | "seeded" | "api";
    initiatedBy?: string;
    existingRoomId?: number;  // if set, append to existing room instead of creating
  } = {}
): Promise<number | null> {
  try {
    const {
      createDecisionRoom, updateDecisionRoom,
      createAgentClaim, updateAgentClaimAdjudication,
      createClaimVote, createEvidenceEntry, createOutcomePrediction,
    } = await import("./db");

    // 1. Create or append to an existing Decision Room
    let roomId: number;
    if (opts.existingRoomId) {
      // Append: update the existing room with latest consensus data
      await updateDecisionRoom(opts.existingRoomId, {
        consensusScore: result.consensus.agreementScore,
        recommendedAction: result.recommendedAction,
        agentsInvoked: result.agentsInvoked as any,
        debateRounds: result.debateRounds,
      });
      roomId = opts.existingRoomId;
      console.log(`[LangChain] Appending to existing Decision Room #${roomId} (duplicate detected)`);
    } else {
      roomId = await createDecisionRoom({
        title,
        question,
        context: opts.context ?? null,
        partnerId: opts.partnerId ?? null,
        status: "consensus_reached",
        consensusScore: result.consensus.agreementScore,
        recommendedAction: result.recommendedAction,
        minorityReport: result.consensus.conflictingAgents.length > 0
          ? `Dissenting agents: ${result.consensus.conflictingAgents.join(", ")}. Unresolved: ${result.contradictions.join("; ")}`
          : null,
        conflictingAgents: result.consensus.conflictingAgents as any,
        resolvedConflicts: result.consensus.resolvedConflicts as any,
        agentsInvoked: result.agentsInvoked as any,
        debateRounds: result.debateRounds,
        predictedOutcome: result.strategicImplication,
        // Gate metadata
        gateConfidence: opts.gateConfidence ?? null,
        gateMateriality: opts.gateMateriality ?? null,
        gateRationale: opts.gateRationale ?? null,
        gateVersion: opts.gateVersion ?? "v1.1",
        roomSource: opts.roomSource ?? "auto",
        initiatedBy: opts.initiatedBy ?? null,
      });
    }

    // 2. Persist each agent finding as a claim (round 1 = independent findings)
    const claimIdMap: Record<string, number> = {};
    for (const finding of result.agentFindings) {
      const claimId = await createAgentClaim({
        decisionRoomId: roomId,
        agentId: finding.agentId,
        agentName: finding.agentName,
        claimText: finding.finding,
        claimType: "finding",
        confidence: finding.confidence,
        round: 1,
        citations: finding.citations as any,
        excerpts: finding.recommendations as any,
        knowledgeItemIds: [] as any,
      });
      claimIdMap[finding.agentId] = claimId;

      // 3. Persist evidence entries for each citation
      for (const citation of finding.citations) {
        await createEvidenceEntry({
          decisionRoomId: roomId,
          claimId,
          agentId: finding.agentId,
          excerpt: citation,
          sourceName: citation.length > 80 ? citation.slice(0, 80) : citation,
          relationship: "supports",
          verificationStatus: "unverified",
        });
      }
    }

    // 4. Persist debate challenges as round-2 claims
    for (const finding of result.agentFindings) {
      if (finding.debateChallenge) {
        await createAgentClaim({
          decisionRoomId: roomId,
          agentId: finding.agentId,
          agentName: finding.agentName,
          claimText: finding.debateChallenge,
          claimType: "challenge",
          confidence: finding.confidence,
          round: 2,
          citations: [] as any,
          excerpts: [] as any,
          knowledgeItemIds: [] as any,
        });
      }
      if (finding.debateResponse) {
        await createAgentClaim({
          decisionRoomId: roomId,
          agentId: finding.agentId,
          agentName: finding.agentName,
          claimText: finding.debateResponse,
          claimType: "rebuttal",
          confidence: finding.confidence,
          round: 2,
          citations: [] as any,
          excerpts: [] as any,
          knowledgeItemIds: [] as any,
        });
      }
    }

    // 5. Cross-agent votes on each claim
    for (const [agentId, claimId] of Object.entries(claimIdMap)) {
      let support = 0, oppose = 0, abstain = 0;
      for (const voter of result.agentFindings) {
        if (voter.agentId === agentId) continue;
        const isConflicting = result.consensus.conflictingAgents.includes(agentId) &&
          result.consensus.conflictingAgents.includes(voter.agentId);
        const vote = isConflicting ? "oppose" : voter.confidence >= 60 ? "support" : "abstain";
        await createClaimVote({
          claimId,
          decisionRoomId: roomId,
          votingAgentId: voter.agentId,
          vote: vote as "support" | "oppose" | "abstain" | "insufficient_evidence",
          rationale: isConflicting
            ? `${voter.agentName} findings conflict with this claim`
            : `${voter.agentName} findings consistent (confidence: ${voter.confidence}%)`,
          confidence: voter.confidence,
        });
        if (vote === "support") support++;
        else if (vote === "oppose") oppose++;
        else abstain++;
      }
      const total = support + oppose + abstain;
      const adjStatus = total === 0 ? "pending"
        : oppose > support ? "contested"
        : support >= Math.ceil(total * 0.6) ? "supported"
        : "pending";
      await updateAgentClaimAdjudication(claimId, adjStatus as any, support, oppose, abstain, 0);
    }

    // 6. Record outcome prediction for learning loop
    if (opts.partnerId) {
      await createOutcomePrediction({
        decisionRoomId: roomId,
        partnerId: opts.partnerId,
        agentId: "executive_synthesis",
        predictedOutcome: result.strategicImplication,
        predictedConfidence: result.confidence,
      });
    }

    console.log(`[LangChain] Persisted decision room #${roomId} with ${result.agentFindings.length} claims`);
    return roomId;
  } catch (err) {
    console.error("[LangChain] Failed to persist decision room:", err);
    return null;
  }
}

// ─── Backward-compatible export ───────────────────────────────────────────────

/** Maps LangChain result to the legacy OrchestratedAnswer shape used by the copilot router */
export function toLegacyAnswer(result: LangChainOrchestratorResult) {
  return {
    directAnswer: result.directAnswer,
    verifiedFacts: result.verifiedFacts,
    interpretation: result.interpretation,
    assumptions: result.assumptions,
    contradictions: result.contradictions,
    strategicImplication: result.strategicImplication,
    recommendedAction: result.recommendedAction,
    citations: result.citations,
    freshnessDate: result.freshnessDate,
    confidence: result.confidence,
    agentsInvoked: result.agentsInvoked,
    // Extra LangChain-specific fields
    consensusScore: result.consensus.agreementScore,
    debateRounds: result.debateRounds,
    conflictingAgents: result.consensus.conflictingAgents,
  };
}
