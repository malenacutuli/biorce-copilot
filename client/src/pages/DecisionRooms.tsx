import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, ArrowLeft, BookOpen, Brain, CheckCircle2,
  ChevronRight, Clock, ExternalLink, Gavel, MessageSquare,
  MinusCircle, ThumbsDown, ThumbsUp, XCircle,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

// ─── Shared types ────────────────────────────────────────────────────────────
type Vote = { agentId: string; agentName: string; vote: string; rationale?: string | null };
type Claim = {
  id: number; claimText: string; claimType: string;
  evidenceCount?: number | null; supportCount?: number | null;
  opposeCount?: number | null; abstainCount?: number | null;
  verdict?: string | null; confidence?: number | null;
  votes?: Vote[];
};
type EvidenceEntry = {
  id: number; excerpt: string; source: string; sourceUrl?: string | null;
  publishedDate?: Date | null; sourceType: string; verificationStatus: string;
  claimsSupported?: string[] | null; claimsContradicted?: string[] | null;
};
type AgentPosition = {
  agentId: string; agentName: string; domain: string;
  position: string; primaryClaim: string; evidenceUsed?: string | null;
  challengeRaised?: string | null; responseToOthers?: string | null;
  remainingUncertainty?: string | null; confidence?: number | null;
};
type Room = {
  id: number; title: string; question: string; status: string;
  consensusScore?: number | null; consensusVerdict?: string | null; executiveDecision?: string | null;
  executiveNotes?: string | null; decisionOwner?: string | null;
  decisionDeadline?: Date | null; decisionMadeAt?: Date | null; createdAt: Date;
  agentPositions?: AgentPosition[] | null;
  synthesisText?: string | null; recommendedAction?: string | null;
  requiredConditions?: string[] | null; principalRisk?: string | null;
  claims?: Claim[]; evidence?: EvidenceEntry[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const POSITION_COLORS: Record<string, string> = {
  support: "#10b981", oppose: "#ef4444", abstain: "#6b7280",
  conditional: "#f59e0b", insufficient_evidence: "#8b5cf6",
};
const VERDICT_LABELS: Record<string, string> = {
  supported: "Supported", opposed: "Opposed", unresolved: "Unresolved",
  insufficient_evidence: "Insufficient evidence",
};
const DECISION_COLORS: Record<string, string> = {
  approved: "#10b981", modified: "#f59e0b", rejected: "#ef4444",
  more_evidence: "#8b5cf6", pending: "#6b7280",
};

function VerdictBadge({ verdict }: { verdict?: string | null }) {
  const label = VERDICT_LABELS[verdict ?? ""] ?? verdict ?? "Pending";
  const color = verdict === "supported" ? "#10b981" : verdict === "opposed" ? "#ef4444" : verdict === "unresolved" ? "#f59e0b" : "#6b7280";
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}>
      {label}
    </span>
  );
}

// ─── Room List ────────────────────────────────────────────────────────────────
function RoomList({ onSelect }: { onSelect: (id: number) => void }) {
  const { isAuthenticated } = useAuth();
  const { data: rooms, isLoading } = trpc.decisionRooms.list.useQuery(
    { limit: 50 }, { enabled: isAuthenticated }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border p-5 animate-pulse h-20"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }} />
        ))}
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="rounded-xl border p-10 text-center"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <Gavel className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-muted-foreground)" }} strokeWidth={1.25} />
        <div className="font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>No decision rooms yet</div>
        <div className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Ask the Copilot a strategic question to create the first decision room.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rooms.map(r => {
        return (
          <button key={r.id} onClick={() => onSelect(r.id)}
            className="rounded-xl border p-5 text-left flex items-start gap-4 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 w-full"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#6366f118" }}>
              <Gavel className="w-5 h-5" style={{ color: "#6366f1" }} strokeWidth={1.25} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm mb-1 truncate" style={{ color: "var(--color-foreground)" }}>{r.title}</div>
              <div className="text-xs mb-2 line-clamp-2" style={{ color: "var(--color-muted-foreground)" }}>{r.question}</div>
              <div className="flex items-center gap-3 flex-wrap">
                {r.consensusScore != null && (
                  <span className="text-xs font-medium" style={{ color: "#6366f1" }}>
                    {r.consensusScore}% consensus
                  </span>
                )}
                {r.consensusVerdict && (() => {
                  const cv = r.consensusVerdict;
                  const cvColor = cv === "go" ? "#10b981" : cv === "conditional_go" ? "#f59e0b" : cv === "hold" ? "#6b7280" : cv === "no_go" ? "#ef4444" : cv === "insufficient_evidence" ? "#8b5cf6" : "#6b7280";
                  return (
                    <span className="flex items-center gap-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>AI</span>
                      <Badge className="text-[10px] capitalize"
                        style={{ background: `${cvColor}12`, color: cvColor, border: `1px dashed ${cvColor}50`, fontStyle: "italic" }}>
                        {cv.replace(/_/g, " ")}
                      </Badge>
                    </span>
                  );
                })()}
                {r.executiveDecision ? (
                  <span className="flex items-center gap-1">
                    <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>Exec</span>
                    <Badge className="text-[10px] capitalize font-bold"
                      style={{ background: DECISION_COLORS[r.executiveDecision] ?? "#6366f1", color: "white", border: "none" }}>
                      {r.executiveDecision.replace(/_/g, " ")}
                    </Badge>
                  </span>
                ) : (
                  <span className="text-[10px]" style={{ color: "var(--color-muted-foreground)", fontStyle: "italic" }}>
                    Awaiting exec review
                  </span>
                )}
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "var(--color-muted-foreground)" }} strokeWidth={1.25} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Room Detail ──────────────────────────────────────────────────────────────
function RoomDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [approvalState, setApprovalState] = useState<{
    decision: string; note: string; owner: string; deadline: string;
  }>({ decision: "", note: "", owner: "", deadline: "" });
  const [showApproval, setShowApproval] = useState(false);
  const [activeTab, setActiveTab] = useState<"claims" | "agents" | "evidence">("claims");

  const { data: room, isLoading } = trpc.decisionRooms.byId.useQuery(
    { id }, { enabled: isAuthenticated }
  ) as { data: Room | null | undefined; isLoading: boolean };

  const approveMut = trpc.decisionRooms.approve.useMutation({
    onSuccess: () => {
      utils.decisionRooms.byId.invalidate({ id });
      setShowApproval(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border p-6 animate-pulse h-24"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }} />
        ))}
      </div>
    );
  }

  if (!room) {
    return (
      <div className="rounded-xl border p-10 text-center"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div style={{ color: "var(--color-muted-foreground)" }}>Decision room not found.</div>
      </div>
    );
  }

  const agentPositions: AgentPosition[] = Array.isArray(room.agentPositions) ? room.agentPositions as AgentPosition[] : [];
  const claims: Claim[] = room.claims ?? [];
  const evidence: EvidenceEntry[] = room.evidence ?? [];
  const requiredConditions: string[] = Array.isArray(room.requiredConditions) ? room.requiredConditions as string[] : [];
  const decColor = DECISION_COLORS[room.executiveDecision ?? "pending"];
  const hasDisagreement = claims.some(c => (c.opposeCount ?? 0) > 0 || c.verdict === "unresolved");

  return (
    <div className="flex flex-col gap-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
        style={{ color: "var(--color-muted-foreground)" }}>
        <ArrowLeft className="w-4 h-4" strokeWidth={1.25} />
        All decision rooms
      </button>

      {/* ── 5-question header ── */}
      <div className="rounded-2xl border p-6"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#6366f1" }}>Decision Room</div>
            <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-foreground)" }}>{room.title}</h1>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
            {/* AI Consensus — advisory, dashed border, italic — clearly NOT a human decision */}
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-muted-foreground)" }}>AI Consensus</span>
              {room.consensusVerdict ? (() => {
                const cv = room.consensusVerdict!;
                const cvColor = cv === "go" ? "#10b981" : cv === "conditional_go" ? "#f59e0b" : cv === "hold" ? "#6b7280" : cv === "no_go" ? "#ef4444" : cv === "insufficient_evidence" ? "#8b5cf6" : "#6b7280";
                return (
                  <Badge className="text-xs capitalize"
                    style={{ background: `${cvColor}12`, color: cvColor, border: `1px dashed ${cvColor}60`, fontStyle: "italic" }}>
                    {cv.replace(/_/g, " ")}
                  </Badge>
                );
              })() : (
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontStyle: "italic" }}>Deliberating</span>
              )}
            </div>
            {/* Human Decision — authoritative, solid fill, bold — strongest visual authority */}
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-muted-foreground)" }}>Human Decision</span>
              {room.executiveDecision ? (
                <Badge className="text-xs capitalize font-bold"
                  style={{ background: decColor, color: "white", border: "none", boxShadow: `0 0 0 2px ${decColor}40` }}>
                  {room.executiveDecision.replace(/_/g, " ")}
                </Badge>
              ) : (
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontStyle: "italic" }}>Awaiting executive review</span>
              )}
            </div>
          </div>
        </div>

        {/* 5 questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl p-4" style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6366f1" }}>
              1. What decision are we making?
            </div>
            <div className="text-sm" style={{ color: "var(--color-foreground)" }}>{room.question}</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#10b981" }}>
              2. What does the evidence indicate?
            </div>
            <div className="text-sm" style={{ color: "var(--color-foreground)" }}>
              {room.synthesisText ?? "Evidence synthesis pending — run the Copilot to generate analysis."}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: hasDisagreement ? "#f59e0b" : "#10b981" }}>
              3. Do the agents agree?
            </div>
            <div className="flex items-center gap-2">
              {room.consensusScore != null ? (
                <>
                  <div className="text-2xl font-bold tabular-nums"
                    style={{ color: room.consensusScore >= 70 ? "#10b981" : room.consensusScore >= 50 ? "#f59e0b" : "#ef4444" }}>
                    {room.consensusScore}%
                  </div>
                  <div className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>evidence-weighted consensus</div>
                </>
              ) : (
                <div className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Not yet calculated</div>
              )}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: hasDisagreement ? "#ef444410" : "var(--color-muted)", border: `1px solid ${hasDisagreement ? "#ef444430" : "var(--color-border)"}` }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: hasDisagreement ? "#ef4444" : "var(--color-muted-foreground)" }}>
              4. Where do they disagree?
            </div>
            {hasDisagreement ? (
              <div className="flex flex-col gap-1">
                {claims.filter(c => (c.opposeCount ?? 0) > 0 || c.verdict === "unresolved").slice(0, 2).map(c => (
                  <div key={c.id} className="flex items-start gap-1.5 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} strokeWidth={1.25} />
                    <span style={{ color: "var(--color-foreground)" }}>{c.claimText}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                {claims.length > 0 ? "No significant disagreement detected." : "No claims analysed yet."}
              </div>
            )}
          </div>
        </div>

        {/* Recommended action */}
        {room.recommendedAction && (
          <div className="mt-4 rounded-xl p-4" style={{ background: "#6366f10d", border: "1px solid #6366f130" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6366f1" }}>
              5. What should Biorce do next?
            </div>
            <div className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{room.recommendedAction}</div>
            {requiredConditions.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {requiredConditions.map((c, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#6366f1" }} strokeWidth={1.25} />
                    <span style={{ color: "var(--color-foreground)" }}>{c}</span>
                  </div>
                ))}
              </div>
            )}
            {room.principalRisk && (
              <div className="mt-2 flex items-start gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} strokeWidth={1.25} />
                <span style={{ color: "#ef4444" }}>Principal risk: {room.principalRisk}</span>
              </div>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="mt-4 flex items-center gap-4 flex-wrap text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" strokeWidth={1.25} />Created {new Date(room.createdAt).toLocaleDateString()}</span>
          {room.decisionOwner && <span className="flex items-center gap-1"><Brain className="w-3.5 h-3.5" strokeWidth={1.25} />Owner: {room.decisionOwner}</span>}
          {room.decisionDeadline && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" strokeWidth={1.25} />Deadline: {new Date(room.decisionDeadline).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* ── Approval controls ── */}
      <div className="rounded-2xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>Executive Decision</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              {room.executiveDecision
                ? "Decision recorded — binding"
                : room.consensusVerdict
                  ? "AI consensus reached — awaiting executive review"
                  : "Deliberation in progress"}
            </div>
          </div>
          {!showApproval && !room.executiveDecision && (
            <Button size="sm" variant="outline" onClick={() => setShowApproval(true)}>
              <Gavel className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.25} />
              Record decision
            </Button>
          )}
        </div>
        {showApproval ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { value: "approved", label: "Approve", icon: CheckCircle2, color: "#10b981" },
                { value: "modified", label: "Approve with conditions", icon: MessageSquare, color: "#f59e0b" },
                { value: "more_evidence", label: "Request more evidence", icon: BookOpen, color: "#8b5cf6" },
                { value: "modified", label: "Modify recommendation", icon: MessageSquare, color: "#0ea5e9" },
                { value: "rejected", label: "Reject", icon: XCircle, color: "#ef4444" },
              ].map(opt => (
                <button key={opt.label} onClick={() => setApprovalState(s => ({ ...s, decision: opt.value }))}
                  className="rounded-xl border p-3 text-center text-xs font-medium transition-all duration-150"
                  style={{
                    background: approvalState.decision === opt.value ? `${opt.color}18` : "var(--color-muted)",
                    borderColor: approvalState.decision === opt.value ? opt.color : "var(--color-border)",
                    color: approvalState.decision === opt.value ? opt.color : "var(--color-foreground)",
                  }}>
                  <opt.icon className="w-4 h-4 mx-auto mb-1" strokeWidth={1.25} style={{ color: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Accountable owner"
                style={{ background: "var(--color-muted)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
                value={approvalState.owner} onChange={e => setApprovalState(s => ({ ...s, owner: e.target.value }))} />
              <input type="date" className="rounded-lg border px-3 py-2 text-sm"
                style={{ background: "var(--color-muted)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
                value={approvalState.deadline} onChange={e => setApprovalState(s => ({ ...s, deadline: e.target.value }))} />
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Executive note (optional)"
                style={{ background: "var(--color-muted)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
                value={approvalState.note} onChange={e => setApprovalState(s => ({ ...s, note: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={!approvalState.decision || approveMut.isPending}
                onClick={() => approveMut.mutate({ id: room.id, decision: approvalState.decision as any, executiveNote: approvalState.note, owner: approvalState.owner, deadline: approvalState.deadline })}
                style={{ background: "#6366f1", color: "white" }}>
                {approveMut.isPending ? "Saving..." : "Confirm decision"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowApproval(false)}>Cancel</Button>
            </div>
          </div>
        ) : room.executiveDecision ? (
          <div className="rounded-xl p-4" style={{ background: `${decColor}10`, border: `2px solid ${decColor}` }}>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="text-sm font-bold capitalize"
                style={{ background: decColor, color: "white", border: "none", boxShadow: `0 0 0 2px ${decColor}40` }}>
                {room.executiveDecision.replace(/_/g, " ")}
              </Badge>
              {room.decisionOwner && (
                <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                  Owner: {room.decisionOwner}
                </span>
              )}
              {room.decisionMadeAt && (
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  {new Date(room.decisionMadeAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {room.executiveNotes && (
              <div className="text-sm" style={{ color: "var(--color-foreground)" }}>{room.executiveNotes}</div>
            )}
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: decColor }}>
              Executive decision — binding
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-4" style={{ background: "var(--color-muted)", border: "1px dashed var(--color-border)" }}>
            <div className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>Awaiting executive review</div>
            <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              AI consensus is a working hypothesis. An authorized executive must record the binding decision.
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--color-border)" }}>
        {(["claims", "agents", "evidence"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-medium capitalize transition-colors"
            style={{
              color: activeTab === tab ? "#6366f1" : "var(--color-muted-foreground)",
              borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
            }}>
            {tab === "claims" ? `Claim matrix (${claims.length})` : tab === "agents" ? `Agent council (${agentPositions.length})` : `Evidence ledger (${evidence.length})`}
          </button>
        ))}
      </div>

      {/* ── Claim-level consensus matrix ── */}
      {activeTab === "claims" && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
          {claims.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              No claims extracted yet. Run the Copilot to generate claim-level analysis.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--color-muted)", borderBottom: "1px solid var(--color-border)" }}>
                  {["Claim", "Evidence", "Support", "Oppose", "Abstain", "Verdict"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--color-muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? "var(--color-card)" : "var(--color-muted)", borderBottom: "1px solid var(--color-border)" }}>
                    <td className="px-4 py-3 max-w-xs" style={{ color: "var(--color-foreground)" }}>{c.claimText}</td>
                    <td className="px-4 py-3 text-center tabular-nums" style={{ color: "var(--color-muted-foreground)" }}>{c.evidenceCount ?? 0} sources</td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 font-semibold" style={{ color: "#10b981" }}>
                        <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1.25} />{c.supportCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 font-semibold" style={{ color: (c.opposeCount ?? 0) > 0 ? "#ef4444" : "var(--color-muted-foreground)" }}>
                        <ThumbsDown className="w-3.5 h-3.5" strokeWidth={1.25} />{c.opposeCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                        <MinusCircle className="w-3.5 h-3.5" strokeWidth={1.25} />{c.abstainCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3"><VerdictBadge verdict={c.verdict} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Agent council ── */}
      {activeTab === "agents" && (
        <div className="flex flex-col gap-4">
          {agentPositions.length === 0 ? (
            <div className="rounded-xl border p-10 text-center text-sm"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
              No agent positions recorded yet.
            </div>
          ) : (
            agentPositions.map((agent, i) => {
              const posColor = POSITION_COLORS[agent.position] ?? "#6b7280";
              return (
                <div key={i} className="rounded-2xl border p-5"
                  style={{ background: "var(--color-card)", borderColor: agent.position === "oppose" ? "#ef444430" : "var(--color-border)" }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>{agent.agentName}</div>
                      <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{agent.domain}</div>
                    </div>
                    <Badge className="text-xs capitalize flex-shrink-0"
                      style={{ background: `${posColor}18`, color: posColor, border: `1px solid ${posColor}35` }}>
                      {agent.position.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="rounded-lg p-3" style={{ background: "var(--color-muted)" }}>
                      <div className="font-semibold mb-1" style={{ color: "var(--color-muted-foreground)" }}>Primary claim</div>
                      <div style={{ color: "var(--color-foreground)" }}>{agent.primaryClaim}</div>
                    </div>
                    {agent.evidenceUsed && (
                      <div className="rounded-lg p-3" style={{ background: "var(--color-muted)" }}>
                        <div className="font-semibold mb-1" style={{ color: "var(--color-muted-foreground)" }}>Evidence used</div>
                        <div style={{ color: "var(--color-foreground)" }}>{agent.evidenceUsed}</div>
                      </div>
                    )}
                    {agent.challengeRaised && (
                      <div className="rounded-lg p-3" style={{ background: "#ef444408", border: "1px solid #ef444425" }}>
                        <div className="font-semibold mb-1 flex items-center gap-1" style={{ color: "#ef4444" }}>
                          <AlertTriangle className="w-3 h-3" strokeWidth={1.25} />Challenge raised
                        </div>
                        <div style={{ color: "var(--color-foreground)" }}>{agent.challengeRaised}</div>
                      </div>
                    )}
                    {agent.responseToOthers && (
                      <div className="rounded-lg p-3" style={{ background: "var(--color-muted)" }}>
                        <div className="font-semibold mb-1" style={{ color: "var(--color-muted-foreground)" }}>Response to other agents</div>
                        <div style={{ color: "var(--color-foreground)" }}>{agent.responseToOthers}</div>
                      </div>
                    )}
                    {agent.remainingUncertainty && (
                      <div className="rounded-lg p-3" style={{ background: "#f59e0b08", border: "1px solid #f59e0b25" }}>
                        <div className="font-semibold mb-1" style={{ color: "#f59e0b" }}>Remaining uncertainty</div>
                        <div style={{ color: "var(--color-foreground)" }}>{agent.remainingUncertainty}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Evidence ledger ── */}
      {activeTab === "evidence" && (
        <div className="flex flex-col gap-4">
          {evidence.length === 0 ? (
            <div className="rounded-xl border p-10 text-center text-sm"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
              No evidence entries yet.
            </div>
          ) : (
            evidence.map(e => {
              const typeColor = e.sourceType === "primary" ? "#10b981" : e.sourceType === "secondary" ? "#0ea5e9" : "#6b7280";
              const verColor = e.verificationStatus === "verified" ? "#10b981" : e.verificationStatus === "unverified" ? "#ef4444" : "#f59e0b";
              const claimsSupported: string[] = Array.isArray(e.claimsSupported) ? e.claimsSupported as string[] : [];
              const claimsContradicted: string[] = Array.isArray(e.claimsContradicted) ? e.claimsContradicted as string[] : [];
              return (
                <div key={e.id} className="rounded-2xl border p-5"
                  style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="text-[10px] capitalize"
                        style={{ background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}35` }}>
                        {e.sourceType}
                      </Badge>
                      <Badge className="text-[10px] capitalize"
                        style={{ background: `${verColor}18`, color: verColor, border: `1px solid ${verColor}35` }}>
                        {e.verificationStatus}
                      </Badge>
                      {e.publishedDate && (
                        <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                          {new Date(e.publishedDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {e.sourceUrl && (
                      <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                        style={{ color: "#6366f1" }}>
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.25} />
                        {e.source}
                      </a>
                    )}
                  </div>
                  <blockquote className="text-sm italic border-l-2 pl-3 mb-3"
                    style={{ borderColor: "#6366f1", color: "var(--color-foreground)" }}>
                    "{e.excerpt}"
                  </blockquote>
                  {!e.sourceUrl && (
                    <div className="text-xs mb-2" style={{ color: "var(--color-muted-foreground)" }}>Source: {e.source}</div>
                  )}
                  {claimsSupported.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs font-medium" style={{ color: "#10b981" }}>Supports:</span>
                      {claimsSupported.map((c, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "#10b98118", color: "#10b981" }}>{c}</span>
                      ))}
                    </div>
                  )}
                  {claimsContradicted.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-xs font-medium" style={{ color: "#ef4444" }}>Contradicts:</span>
                      {claimsContradicted.map((c, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "#ef444418", color: "#ef4444" }}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DecisionRooms() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        {selectedId === null ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gavel className="w-5 h-5" style={{ color: "#6366f1" }} strokeWidth={1.25} />
                  <h1 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>Decision Rooms</h1>
                </div>
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  Agent-adjudicated evidence with claim-level consensus and executive approval controls
                </p>
              </div>
            </div>
            <RoomList onSelect={setSelectedId} />
          </>
        ) : (
          <RoomDetail id={selectedId} onBack={() => setSelectedId(null)} />
        )}
      </div>
    </DashboardLayout>
  );
}
