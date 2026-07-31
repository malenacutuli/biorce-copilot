import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Activity, AlertTriangle, ArrowUpRight, Building2, ChevronDown, ChevronUp,
  ExternalLink, Filter, Flame, Globe, Linkedin, Mail, MessageSquare,
  Phone, Plus, RefreshCw, Star, Target, TrendingUp, Users, X
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Signal = {
  id: number;
  companyName: string;
  companySlug: string;
  companyType: string;
  region: string;
  signalType: string;
  signalTitle: string;
  signalSummary: string;
  signalDate: Date | null;
  sourceUrl: string | null;
  sourceName: string | null;
  signalStrength: number;
  fitScore: number;
  urgencyScore: number;
  accessScore: number;
  compositeScore: number;
  status: string;
  keyContact: string | null;
  keyContactTitle: string | null;
  keyContactLinkedin: string | null;
  biorceAngle: string | null;
  proposedOutreach: string | null;
  notes: string | null;
  createdAt: Date;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  new: "oklch(0.65 0.18 240)",
  qualified: "oklch(0.65 0.18 145)",
  in_outreach: "oklch(0.65 0.18 60)",
  meeting_booked: "oklch(0.65 0.18 280)",
  closed_won: "oklch(0.65 0.18 145)",
  closed_lost: "oklch(0.65 0.18 0)",
  watching: "oklch(0.65 0.18 200)",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New Signal",
  qualified: "Qualified",
  in_outreach: "In Outreach",
  meeting_booked: "Meeting Booked",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  watching: "Watching",
};

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  executive_hire: "Executive Hire",
  internal_build: "Internal Build",
  failed_internal: "Failed Internal",
  conference_presentation: "Conference",
  rfp_activity: "RFP Activity",
  hiring_cluster: "Hiring Cluster",
  partnership_gap: "Partnership Gap",
  regulatory_pressure: "Regulatory Pressure",
  funding_event: "Funding Event",
};

const SIGNAL_TYPE_ICONS: Record<string, React.ReactNode> = {
  executive_hire: <Users className="w-3 h-3" />,
  internal_build: <Building2 className="w-3 h-3" />,
  failed_internal: <AlertTriangle className="w-3 h-3" />,
  conference_presentation: <MessageSquare className="w-3 h-3" />,
  rfp_activity: <Target className="w-3 h-3" />,
  hiring_cluster: <Users className="w-3 h-3" />,
  partnership_gap: <Activity className="w-3 h-3" />,
  regulatory_pressure: <AlertTriangle className="w-3 h-3" />,
  funding_event: <TrendingUp className="w-3 h-3" />,
};

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, max = 10, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>{label}</span>
        <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Composite Score Ring ─────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const pct = score / 10;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const color =
    score >= 7.5 ? "oklch(0.65 0.18 145)" :
    score >= 5.5 ? "oklch(0.65 0.18 60)" :
    "oklch(0.65 0.18 0)";
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-border)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none" style={{ color }}>{score.toFixed(1)}</span>
      </div>
    </div>
  );
}

// ─── Signal Card ──────────────────────────────────────────────────────────────

function SignalCard({ signal, rank, onClick }: { signal: Signal; rank: number; onClick: () => void }) {
  const statusColor = STATUS_COLORS[signal.status] ?? "var(--color-muted-foreground)";
  return (
    <div
      className="rounded-xl border p-4 cursor-pointer transition-all duration-150 group"
      style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
      onClick={onClick}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-1"
          style={{
            background: rank <= 3 ? "var(--color-primary)" : "var(--color-accent)",
            color: rank <= 3 ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
          }}
        >
          {rank}
        </div>

        {/* Score ring */}
        <ScoreRing score={signal.compositeScore} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <div className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>
                {signal.companyName}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                {signal.signalTitle}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: `${statusColor}15`, color: statusColor }}
              >
                {STATUS_LABELS[signal.status] ?? signal.status}
              </span>
            </div>
          </div>

          {/* Signal type + region badges */}
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}
            >
              {SIGNAL_TYPE_ICONS[signal.signalType]}
              {SIGNAL_TYPE_LABELS[signal.signalType] ?? signal.signalType}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}
            >
              <Globe className="w-2.5 h-2.5" />
              {signal.region}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}
            >
              {signal.companyType.replace("_", " ")}
            </span>
          </div>

          {/* Summary */}
          <p className="text-xs line-clamp-2 mb-3" style={{ color: "var(--color-muted-foreground)" }}>
            {signal.signalSummary}
          </p>

          {/* Score bars */}
          <div className="grid grid-cols-4 gap-2">
            <ScoreBar label="Signal" value={signal.signalStrength} color="oklch(0.65 0.18 240)" />
            <ScoreBar label="Fit" value={signal.fitScore} color="oklch(0.65 0.18 145)" />
            <ScoreBar label="Urgency" value={signal.urgencyScore} color="oklch(0.65 0.18 30)" />
            <ScoreBar label="Access" value={signal.accessScore} color="oklch(0.65 0.18 280)" />
          </div>

          {/* Key contact */}
          {signal.keyContact && (
            <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              <Users className="w-3 h-3" />
              <span>{signal.keyContact}</span>
              {signal.keyContactTitle && <span>· {signal.keyContactTitle}</span>}
            </div>
          )}
        </div>

        <ArrowUpRight
          className="w-4 h-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function SignalDetail({
  signal,
  onClose,
  onStatusChange,
}: {
  signal: Signal;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  const [showOutreachForm, setShowOutreachForm] = useState(false);
  const [outreachType, setOutreachType] = useState("email");
  const [outreachSummary, setOutreachSummary] = useState("");
  const [outreachOutcome, setOutreachOutcome] = useState("no_response");
  const [nextStep, setNextStep] = useState("");

  const { data: log, refetch: refetchLog } = trpc.pharmaSignal.getOutreachLog.useQuery({ signalId: signal.id });
  const logOutreach = trpc.pharmaSignal.logOutreach.useMutation({
    onSuccess: () => {
      refetchLog();
      setShowOutreachForm(false);
      setOutreachSummary("");
      setNextStep("");
      toast.success("Outreach logged");
    },
  });
  const updateStatus = trpc.pharmaSignal.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      onStatusChange(signal.id, vars.status);
      toast.success("Status updated");
    },
  });

  const statusColor = STATUS_COLORS[signal.status] ?? "var(--color-muted-foreground)";

  return (
    <div
      className="fixed inset-y-0 right-0 w-[520px] border-l overflow-y-auto z-50 flex flex-col"
      style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 px-6 py-4 border-b flex items-center justify-between z-10"
        style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
      >
        <div>
          <div className="font-semibold" style={{ color: "var(--color-foreground)" }}>{signal.companyName}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{signal.signalTitle}</div>
        </div>
        <button onClick={onClose} style={{ color: "var(--color-muted-foreground)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-6 py-4 space-y-5 flex-1">
        {/* Score overview */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
        >
          <ScoreRing score={signal.compositeScore} />
          <div className="flex-1 grid grid-cols-2 gap-3">
            <ScoreBar label="Signal Strength" value={signal.signalStrength} color="oklch(0.65 0.18 240)" />
            <ScoreBar label="Fit Score" value={signal.fitScore} color="oklch(0.65 0.18 145)" />
            <ScoreBar label="Urgency" value={signal.urgencyScore} color="oklch(0.65 0.18 30)" />
            <ScoreBar label="Access" value={signal.accessScore} color="oklch(0.65 0.18 280)" />
          </div>
        </div>

        {/* Status + change */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-muted-foreground)" }}>
            Pipeline Status
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(STATUS_LABELS).map(([s, label]) => (
              <button
                key={s}
                onClick={() => updateStatus.mutate({ id: signal.id, status: s as any })}
                className="text-xs px-2.5 py-1 rounded-lg transition-all duration-150"
                style={{
                  background: signal.status === s ? `${STATUS_COLORS[s]}20` : "var(--color-accent)",
                  color: signal.status === s ? STATUS_COLORS[s] : "var(--color-muted-foreground)",
                  border: signal.status === s ? `1px solid ${STATUS_COLORS[s]}50` : "1px solid transparent",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Signal summary */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-muted-foreground)" }}>
            Signal Summary
          </div>
          <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{signal.signalSummary}</p>
          {signal.sourceUrl && (
            <a
              href={signal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs mt-2"
              style={{ color: "var(--color-primary)" }}
            >
              <ExternalLink className="w-3 h-3" />
              {signal.sourceName ?? "View source"}
            </a>
          )}
        </div>

        {/* Biorce angle */}
        {signal.biorceAngle && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-muted-foreground)" }}>
              Biorce Angle
            </div>
            <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{signal.biorceAngle}</p>
          </div>
        )}

        {/* Proposed outreach */}
        {signal.proposedOutreach && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-muted-foreground)" }}>
              Proposed Outreach
            </div>
            <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{signal.proposedOutreach}</p>
          </div>
        )}

        {/* Key contact */}
        {signal.keyContact && (
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-muted-foreground)" }}>
              Key Contact
            </div>
            <div className="font-medium text-sm" style={{ color: "var(--color-foreground)" }}>{signal.keyContact}</div>
            {signal.keyContactTitle && (
              <div className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{signal.keyContactTitle}</div>
            )}
            {signal.keyContactLinkedin && (
              <a
                href={signal.keyContactLinkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs mt-2"
                style={{ color: "oklch(0.65 0.18 240)" }}
              >
                <Linkedin className="w-3 h-3" />
                LinkedIn Profile
              </a>
            )}
          </div>
        )}

        {/* Outreach log */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
              Outreach Log ({log?.length ?? 0})
            </div>
            <button
              onClick={() => setShowOutreachForm(!showOutreachForm)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all"
              style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
            >
              <Plus className="w-3 h-3" />
              Log outreach
            </button>
          </div>

          {showOutreachForm && (
            <div
              className="rounded-xl p-4 mb-3 space-y-3"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--color-muted-foreground)" }}>Type</div>
                  <select
                    value={outreachType}
                    onChange={e => setOutreachType(e.target.value)}
                    className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
                    style={{ background: "var(--color-background)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                  >
                    {["email", "linkedin", "call", "meeting", "conference", "intro", "follow_up"].map(t => (
                      <option key={t} value={t}>{t.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--color-muted-foreground)" }}>Outcome</div>
                  <select
                    value={outreachOutcome}
                    onChange={e => setOutreachOutcome(e.target.value)}
                    className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
                    style={{ background: "var(--color-background)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                  >
                    {["no_response", "positive", "negative", "meeting_booked", "referred", "not_ready"].map(o => (
                      <option key={o} value={o}>{o.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--color-muted-foreground)" }}>Summary</div>
                <textarea
                  value={outreachSummary}
                  onChange={e => setOutreachSummary(e.target.value)}
                  rows={2}
                  placeholder="What happened? Who did you contact?"
                  className="w-full text-xs rounded-lg px-2 py-1.5 outline-none resize-none"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                />
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--color-muted-foreground)" }}>Next Step</div>
                <input
                  value={nextStep}
                  onChange={e => setNextStep(e.target.value)}
                  placeholder="What's the next action?"
                  className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => logOutreach.mutate({
                    signalId: signal.id,
                    outreachType: outreachType as any,
                    summary: outreachSummary,
                    outcome: outreachOutcome as any,
                    nextStep: nextStep || undefined,
                  })}
                  disabled={!outreachSummary.trim() || logOutreach.isPending}
                  className="flex-1 text-xs py-1.5 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                >
                  {logOutreach.isPending ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setShowOutreachForm(false)}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {log?.length === 0 && (
              <div className="text-xs text-center py-4" style={{ color: "var(--color-muted-foreground)" }}>
                No outreach logged yet
              </div>
            )}
            {log?.map(entry => (
              <div
                key={entry.id}
                className="rounded-lg p-3 text-xs"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium capitalize" style={{ color: "var(--color-foreground)" }}>
                    {entry.outreachType.replace("_", " ")}
                  </span>
                  <span style={{ color: "var(--color-muted-foreground)" }}>
                    {new Date(entry.loggedAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ color: "var(--color-muted-foreground)" }}>{entry.summary}</p>
                {entry.outcome && (
                  <span
                    className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px]"
                    style={{
                      background: entry.outcome === "positive" || entry.outcome === "meeting_booked"
                        ? "oklch(0.65 0.18 145 / 0.1)"
                        : "var(--color-accent)",
                      color: entry.outcome === "positive" || entry.outcome === "meeting_booked"
                        ? "oklch(0.65 0.18 145)"
                        : "var(--color-muted-foreground)",
                    }}
                  >
                    {entry.outcome.replace("_", " ")}
                  </span>
                )}
                {entry.nextStep && (
                  <div className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                    → {entry.nextStep}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PharmaSignal() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>("all");
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);

  const { data, isLoading, refetch } = trpc.pharmaSignal.list.useQuery(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      signalType: signalTypeFilter !== "all" ? signalTypeFilter : undefined,
      companyType: companyTypeFilter !== "all" ? companyTypeFilter : undefined,
      region: regionFilter !== "all" ? regionFilter : undefined,
      limit: 100,
    },
  );

  useEffect(() => {
    if (data) setSignals(data as Signal[]);
  }, [data]);

  const displaySignals = (data as Signal[] | undefined) ?? signals;

  const handleStatusChange = (id: number, newStatus: string) => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    if (selectedSignal?.id === id) {
      setSelectedSignal(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Summary stats
  const totalSignals = displaySignals.length;
  const hotSignals = displaySignals.filter(s => s.compositeScore >= 7.5).length;
  const inOutreach = displaySignals.filter(s => s.status === "in_outreach" || s.status === "meeting_booked").length;
  const avgScore = totalSignals > 0
    ? (displaySignals.reduce((sum, s) => sum + s.compositeScore, 0) / totalSignals).toFixed(1)
    : "0.0";

  const activeFilters = [statusFilter, signalTypeFilter, companyTypeFilter, regionFilter].filter(f => f !== "all").length;

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Main content */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${selectedSignal ? "mr-[520px]" : ""}`}>
          {/* Header */}
          <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                  Pharma Signal Engine
                </h1>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                  BD buying signals ranked by composite score — signal strength · fit · urgency · access
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total Signals", value: totalSignals, icon: <Activity className="w-4 h-4" />, color: "oklch(0.65 0.18 240)" },
                { label: "Hot (≥7.5)", value: hotSignals, icon: <Flame className="w-4 h-4" />, color: "oklch(0.65 0.18 30)" },
                { label: "In Outreach", value: inOutreach, icon: <Target className="w-4 h-4" />, color: "oklch(0.65 0.18 145)" },
                { label: "Avg Score", value: avgScore, icon: <Star className="w-4 h-4" />, color: "oklch(0.65 0.18 60)" },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${stat.color}15`, color: stat.color }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-lg font-bold leading-none" style={{ color: "var(--color-foreground)" }}>
                      {stat.value}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg px-2.5 py-1.5 outline-none"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select
                value={signalTypeFilter}
                onChange={e => setSignalTypeFilter(e.target.value)}
                className="text-xs rounded-lg px-2.5 py-1.5 outline-none"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              >
                <option value="all">All Signal Types</option>
                {Object.entries(SIGNAL_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select
                value={companyTypeFilter}
                onChange={e => setCompanyTypeFilter(e.target.value)}
                className="text-xs rounded-lg px-2.5 py-1.5 outline-none"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              >
                <option value="all">All Company Types</option>
                <option value="big_pharma">Big Pharma</option>
                <option value="mid_pharma">Mid Pharma</option>
                <option value="biotech">Biotech</option>
                <option value="cro">CRO</option>
                <option value="tech_pharma">Tech Pharma</option>
              </select>
              <select
                value={regionFilter}
                onChange={e => setRegionFilter(e.target.value)}
                className="text-xs rounded-lg px-2.5 py-1.5 outline-none"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              >
                <option value="all">All Regions</option>
                <option value="US">US</option>
                <option value="EU">EU</option>
                <option value="GLOBAL">Global</option>
                <option value="APAC">APAC</option>
              </select>
              {activeFilters > 0 && (
                <button
                  onClick={() => { setStatusFilter("all"); setSignalTypeFilter("all"); setCompanyTypeFilter("all"); setRegionFilter("all"); }}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                  style={{ background: "oklch(0.65 0.18 0 / 0.1)", color: "oklch(0.65 0.18 0)" }}
                >
                  <X className="w-3 h-3" />
                  Clear {activeFilters} filter{activeFilters !== 1 ? "s" : ""}
                </button>
              )}
              <span className="ml-auto text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                {displaySignals.length} signal{displaySignals.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Signal list */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "var(--color-primary)", animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            {!isLoading && displaySignals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity className="w-10 h-10 mb-3" style={{ color: "var(--color-muted-foreground)" }} />
                <div className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>No signals found</div>
                <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  {activeFilters > 0 ? "Try clearing the filters" : "Signals will appear here as they are identified"}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {displaySignals.map((signal, i) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  rank={i + 1}
                  onClick={() => setSelectedSignal(signal)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Detail drawer */}
        {selectedSignal && (
          <SignalDetail
            signal={selectedSignal}
            onClose={() => setSelectedSignal(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </AppLayout>
  );
}
