import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, Brain, CheckCircle2, ChevronDown, ChevronUp,
  Cpu, FileText, FolderOpen, Lightbulb, Send, Shield, Sparkles, Target, X, Zap
} from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { Streamdown } from "streamdown";
import { Link, useLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrchestratedAnswer = {
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
};

type AgentResult = {
  agentId: string;
  agentName: string;
  domain: string;
  finding: string;
  confidence: number;
  citations: string[];
  flags: string[];
  recommendations: string[];
};

type Source = { id: number; title: string; sourceName: string | null; verificationStatus: string };

type Message = {
  role: "user" | "assistant";
  content?: string;
  orchestratedAnswer?: OrchestratedAnswer;
  agentResults?: AgentResult[];
  sources?: Source[];
  gateResult?: {
    isDecision: boolean;
    confidence: number;
    materiality: string;
    rationale: string;
    alternatives: string[];
    proposedOwner: string | null;
    proposedDeadline: string | null;
    autoCreated: boolean;
    promptUser: boolean;
    candidateToken?: string;
    gateVersion?: string;
  };
};
type DuplicateCandidateInfo = { roomId: number; similarity: number; status: string; question: string } | null;
// Extend Message gateResult to include duplicateCandidate from server
type FullGateResult = NonNullable<Message["gateResult"]> & {
  duplicateCandidate?: DuplicateCandidateInfo;
};

// ─── Decision Room Prompt Banner ─────────────────────────────────────────────

type DuplicateCandidate = { roomId: number; similarity: number; status: string; question: string } | null;

function DecisionRoomPromptBanner({
  gateResult,
  duplicateCandidate,
}: {
  gateResult: NonNullable<Message["gateResult"]>;
  duplicateCandidate?: DuplicateCandidate;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [, setLocation] = useLocation();
  const confirmMutation = trpc.decisionRooms.confirmCandidate.useMutation();

  const handleConfirm = useCallback(async (duplicateAction?: "add_evidence" | "open_existing" | "create_separate") => {
    if (!gateResult.candidateToken) return;
    try {
      const result = await confirmMutation.mutateAsync({
        candidateToken: gateResult.candidateToken,
        duplicateAction: duplicateAction,
      });
      setLocation(`/decision-rooms/${result.roomId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[DecisionRoomPromptBanner] confirmCandidate failed:", msg);
    }
  }, [gateResult, duplicateCandidate, confirmMutation, setLocation]);

  if (dismissed) return null;
  const materialityColor =
    gateResult.materiality === "critical" ? "oklch(0.65 0.18 0)" :
    gateResult.materiality === "high" ? "oklch(0.65 0.18 30)" :
    "oklch(0.65 0.18 60)";
  const closedStatuses = ["approved", "modified", "rejected"];
  const isDuplicateClosed = duplicateCandidate ? closedStatuses.includes(duplicateCandidate.status) : false;

  return (
    <div
      className="mb-3 rounded-xl p-4"
      style={{
        background: "oklch(0.65 0.18 60 / 0.08)",
        border: "1px solid oklch(0.65 0.18 60 / 0.35)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <FolderOpen className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: materialityColor }} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold mb-1" style={{ color: materialityColor }}>
              This question may require a Decision Room
            </div>
            <div className="text-xs mb-2.5" style={{ color: "var(--color-muted-foreground)" }}>
              Gate confidence: {gateResult.confidence}% · Materiality: {gateResult.materiality}
              {gateResult.alternatives.length > 0 && (
                <span> · Alternatives: {gateResult.alternatives.slice(0, 2).join(" vs ")}</span>
              )}
            </div>

            {/* Three-way duplicate choice */}
            {duplicateCandidate ? (
              <div className="flex flex-col gap-2">
                <div className="text-xs rounded-lg px-3 py-2" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>
                  <span className="font-medium">Similar room found</span> ({duplicateCandidate.similarity}% match · status: {duplicateCandidate.status}):{" "}
                  <span className="italic opacity-75">{duplicateCandidate.question.slice(0, 70)}{duplicateCandidate.question.length > 70 ? "…" : ""}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={confirmMutation.isPending || isDuplicateClosed}
                    onClick={() => handleConfirm("add_evidence")}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                    style={{ background: materialityColor, color: "oklch(0.98 0 0)" }}
                    title={isDuplicateClosed ? "Cannot append to a closed room" : undefined}
                  >
                    {confirmMutation.isPending ? "…" : "Add evidence to existing room"}
                  </button>
                  <button
                    disabled={confirmMutation.isPending}
                    onClick={() => handleConfirm("open_existing")}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 disabled:opacity-40 active:scale-[0.97]"
                    style={{ background: "var(--color-accent)", color: "var(--color-accent-foreground)" }}
                  >
                    Open existing room
                  </button>
                  <button
                    disabled={confirmMutation.isPending}
                    onClick={() => handleConfirm("create_separate")}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 disabled:opacity-40 active:scale-[0.97]"
                    style={{ background: "var(--color-secondary)", color: "var(--color-secondary-foreground)" }}
                  >
                    Create separate Decision Room
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  disabled={confirmMutation.isPending}
                  onClick={() => handleConfirm()}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 disabled:opacity-60 active:scale-[0.97]"
                  style={{ background: materialityColor, color: "oklch(0.98 0 0)" }}
                >
                  <FolderOpen className="w-3 h-3" />
                  {confirmMutation.isPending ? "Opening…" : "Open Decision Room"}
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
                  style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}
                >
                  Keep as conversation
                </button>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setDismissed(true)} style={{ color: "var(--color-muted-foreground)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Domain colours ───────────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  regulatory: "oklch(0.65 0.18 240)",
  competitive: "oklch(0.65 0.18 30)",
  pharma_signal: "oklch(0.65 0.18 280)",
  claims: "oklch(0.65 0.18 60)",
  vision: "oklch(0.65 0.18 145)",
  scientific: "oklch(0.65 0.18 200)",
  partnership: "oklch(0.65 0.18 320)",
  opportunity: "oklch(0.65 0.18 80)",
  contradiction: "oklch(0.65 0.18 0)",
  execution: "oklch(0.65 0.18 160)",
  board: "oklch(0.65 0.18 260)",
  standards: "oklch(0.65 0.18 180)",
  synthesis: "oklch(0.65 0.18 120)",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 75 ? "oklch(0.65 0.18 145)" :
    value >= 50 ? "oklch(0.65 0.18 60)" :
    "oklch(0.65 0.18 0)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs tabular-nums" style={{ color: "var(--color-muted-foreground)" }}>{value}%</span>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentResult }) {
  const [expanded, setExpanded] = useState(false);
  const domainColor = DOMAIN_COLORS[agent.domain] ?? "var(--color-primary)";
  return (
    <div
      className="rounded-lg border p-3 text-xs"
      style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: `${domainColor}20` }}
          >
            <Cpu className="w-3 h-3" style={{ color: domainColor }} />
          </div>
          <span className="font-medium" style={{ color: "var(--color-foreground)" }}>{agent.agentName}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px]"
            style={{ background: `${domainColor}15`, color: domainColor }}
          >
            {agent.domain}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
      <ConfidenceBar value={agent.confidence} />
      {expanded && (
        <div className="mt-3 space-y-2">
          <p style={{ color: "var(--color-muted-foreground)" }}>{agent.finding}</p>
          {agent.flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {agent.flags.map((f, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{ background: "oklch(0.65 0.18 0 / 0.1)", color: "oklch(0.65 0.18 0)" }}
                >
                  ⚠ {f}
                </span>
              ))}
            </div>
          )}
          {agent.recommendations.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              {agent.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StructuredAnswer({
  answer,
  agentResults,
  sources,
}: {
  answer: OrchestratedAnswer;
  agentResults: AgentResult[];
  sources: Source[];
}) {
  const [showAgents, setShowAgents] = useState(false);

  return (
    <div className="space-y-3">
      {/* Direct Answer */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Direct Answer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Confidence</span>
            <div className="w-24"><ConfidenceBar value={answer.confidence} /></div>
          </div>
        </div>
        <div className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>
          <Streamdown>{answer.directAnswer}</Streamdown>
        </div>
      </div>

      {/* Verified Facts */}
      {answer.verifiedFacts.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: "oklch(0.65 0.18 145 / 0.05)", border: "1px solid oklch(0.65 0.18 145 / 0.2)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: "oklch(0.65 0.18 145)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.65 0.18 145)" }}>
              Verified Facts
            </span>
          </div>
          <ul className="space-y-1.5">
            {answer.verifiedFacts.map((fact, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--color-foreground)" }}>
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "oklch(0.65 0.18 145)" }}
                />
                <Streamdown>{fact}</Streamdown>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interpretation + Strategic Implication */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 60)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.65 0.18 60)" }}>
              Interpretation
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{answer.interpretation}</p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "oklch(0.65 0.18 240 / 0.05)", border: "1px solid oklch(0.65 0.18 240 / 0.2)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 240)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.65 0.18 240)" }}>
              Strategic Implication
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{answer.strategicImplication}</p>
        </div>
      </div>

      {/* Recommended Action */}
      <div
        className="rounded-xl p-4"
        style={{ background: "oklch(0.65 0.18 280 / 0.05)", border: "1px solid oklch(0.65 0.18 280 / 0.3)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4" style={{ color: "oklch(0.65 0.18 280)" }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.65 0.18 280)" }}>
            Recommended Action
          </span>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{answer.recommendedAction}</p>
      </div>

      {/* Assumptions & Contradictions */}
      {(answer.assumptions.length > 0 || answer.contradictions.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {answer.assumptions.length > 0 && (
            <div
              className="rounded-xl p-3"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-muted-foreground)" }}>
                Assumptions
              </div>
              <ul className="space-y-1">
                {answer.assumptions.map((a, i) => (
                  <li key={i} className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>• {a}</li>
                ))}
              </ul>
            </div>
          )}
          {answer.contradictions.length > 0 && (
            <div
              className="rounded-xl p-3"
              style={{ background: "oklch(0.65 0.18 0 / 0.05)", border: "1px solid oklch(0.65 0.18 0 / 0.2)" }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3 h-3" style={{ color: "oklch(0.65 0.18 0)" }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.65 0.18 0)" }}>
                  Contradictions
                </span>
              </div>
              <ul className="space-y-1">
                {answer.contradictions.map((c, i) => (
                  <li key={i} className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>• {c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer: citations + freshness + agents toggle */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          {answer.citations.length > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {answer.citations.length} source{answer.citations.length !== 1 ? "s" : ""}
            </span>
          )}
          {answer.freshnessDate && <span>Updated: {answer.freshnessDate}</span>}
          {sources.length > 0 && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {sources.filter(s => s.verificationStatus === "verified").length} verified
            </span>
          )}
        </div>
        {agentResults.length > 0 && (
          <button
            onClick={() => setShowAgents(!showAgents)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all"
            style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}
          >
            <Sparkles className="w-3 h-3" />
            {agentResults.length} agents
            {showAgents ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Agent breakdown (collapsible) */}
      {showAgents && agentResults.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
            Agent Findings
          </div>
          {agentResults.map(agent => <AgentCard key={agent.agentId} agent={agent} />)}
        </div>
      )}
    </div>
  );
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED = [
  "What is Biorce's most defensible competitive moat against Faro Health?",
  "What EU AI Act compliance risks exist for Biorce's Barcelona R&D operations?",
  "Who are the top 3 partnership targets and what is the outreach strategy for each?",
  "What discrepancies exist between Biorce's public claims and verified data?",
  "What regulatory deadlines require action in the next 90 days?",
  "How does Evinova's internal build strategy affect Biorce's AstraZeneca opportunity?",
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Copilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useOrchestrator, setUseOrchestrator] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ask = trpc.copilot.ask.useMutation();

  const handleSend = async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || isLoading) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setIsLoading(true);
    try {
      const result = await ask.mutateAsync({
        question: q,
        conversationHistory: messages
          .filter(m => m.role === "user" || m.role === "assistant")
          .map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content ?? m.orchestratedAnswer?.directAnswer ?? "",
          })),
        useOrchestrator,
      });
      const msg: Message = {
        role: "assistant",
        content: result.answer != null ? String(result.answer) : undefined,
        orchestratedAnswer: (result.orchestratedAnswer as unknown as OrchestratedAnswer) ?? undefined,
        agentResults: (result.agentResults as unknown as AgentResult[]) ?? [],
        sources: result.sourcesUsed ?? [],
        gateResult: (result.gateResult as Message["gateResult"]) ?? undefined,
      };
      setMessages(prev => [...prev, msg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Unable to process request. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--color-primary)" }}
            >
              <Brain className="w-4 h-4" style={{ color: "var(--color-primary-foreground)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Strategy Copilot</div>
              <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                13-agent intelligence orchestrator
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUseOrchestrator(!useOrchestrator)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{
                background: useOrchestrator ? "var(--color-primary)" : "var(--color-accent)",
                color: useOrchestrator ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
              }}
            >
              <Sparkles className="w-3 h-3" />
              {useOrchestrator ? "Multi-agent ON" : "Single agent"}
            </button>
            <div
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
              style={{
                background: "oklch(0.65 0.18 145 / 0.1)",
                color: "oklch(0.75 0.15 145)",
                border: "1px solid oklch(0.65 0.18 145 / 0.3)",
              }}
            >
              <Shield className="w-3 h-3" />
              Primary sources only
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8 mt-8">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "var(--color-primary)" }}
                >
                  <Brain className="w-7 h-7" style={{ color: "var(--color-primary-foreground)" }} />
                </div>
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
                  Biorce Strategy Copilot
                </h2>
                <p className="text-sm mb-1" style={{ color: "var(--color-muted-foreground)" }}>
                  13 specialist agents: regulatory, competitive, pharma signal, claims, vision, scientific,
                  partnership, opportunity, contradiction, execution, board, standards, synthesis.
                </p>
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  Every answer shows: direct answer · verified facts · interpretation · assumptions ·
                  contradictions · strategic implication · recommended action · citations.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-left text-xs p-3 rounded-xl border transition-all duration-150"
                    style={{
                      borderColor: "var(--color-border)",
                      color: "var(--color-muted-foreground)",
                      background: "var(--color-card)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`mb-6 ${msg.role === "user" ? "flex justify-end" : ""}`}>
              {msg.role === "user" ? (
                <div
                  className="max-w-lg rounded-2xl px-4 py-3 text-sm"
                  style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                >
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-3xl w-full">
                  {/* Decision Room prompt banner — shown when gate confidence is 55-79 */}
                  {msg.gateResult?.promptUser && (
                    <DecisionRoomPromptBanner
                      gateResult={msg.gateResult}
                      duplicateCandidate={(msg.gateResult as FullGateResult)?.duplicateCandidate ?? null}
                    />
                  )}
                  {/* Auto-created notification */}
                  {msg.gateResult?.autoCreated && (
                    <div
                      className="mb-3 rounded-lg px-4 py-2.5 flex items-center gap-2.5 text-xs"
                      style={{
                        background: "oklch(0.55 0.18 145 / 0.12)",
                        border: "1px solid oklch(0.55 0.18 145 / 0.35)",
                        color: "oklch(0.75 0.15 145)",
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        Decision Room opened automatically — this question meets the governance threshold.{" "}
                        <Link href="/decision-rooms" className="underline font-medium">View rooms →</Link>
                      </span>
                    </div>
                  )}
                  {msg.orchestratedAnswer ? (
                    <StructuredAnswer
                      answer={msg.orchestratedAnswer}
                      agentResults={msg.agentResults ?? []}
                      sources={msg.sources ?? []}
                    />
                  ) : (
                    <div
                      className="rounded-xl p-4 text-sm"
                      style={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-foreground)",
                      }}
                    >
                      <Streamdown>{msg.content ?? ""}</Streamdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="mb-6">
              <div
                className="max-w-3xl rounded-xl p-4"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(j => (
                      <div
                        key={j}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: "var(--color-primary)", animationDelay: `${j * 150}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                    {useOrchestrator ? "Routing to specialist agents…" : "Generating response…"}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about strategy, regulatory, competitive intelligence, partnerships…"
              rows={2}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
              }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)"; }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-40"
              style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            Enter to send · Shift+Enter for new line ·{" "}
            {useOrchestrator
              ? "Multi-agent: 3–4 specialist agents + synthesis"
              : "Single-agent: faster, less structured"}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
