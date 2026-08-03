import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Activity, AlertTriangle, ArrowRight, Brain, CheckCircle2,
  ChevronRight, Clock, Gavel, Shield, Target, TrendingUp, Zap,
} from "lucide-react";
import { useLocation } from "wouter";

const ASSET_META: Record<string, {
  label: string; color: string; bg: string; border: string; icon: React.ElementType;
}> = {
  lighthouse_sponsor:    { label: "Lighthouse Sponsor",    color: "#6366f1", bg: "#6366f10d", border: "#6366f130", icon: Target },
  workflow_distribution: { label: "Workflow Distribution", color: "#0ea5e9", bg: "#0ea5e90d", border: "#0ea5e930", icon: Activity },
  standards_position:    { label: "Standards Position",   color: "#10b981", bg: "#10b9810d", border: "#10b98130", icon: Shield },
  execution_data_loop:   { label: "Execution Data Loop",  color: "#f59e0b", bg: "#f59e0b0d", border: "#f59e0b30", icon: TrendingUp },
  independent_evidence:  { label: "Independent Evidence", color: "#ec4899", bg: "#ec48990d", border: "#ec489930", icon: Brain },
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "#6b7280", in_progress: "#3b82f6", at_risk: "#ef4444",
  on_track: "#10b981", achieved: "#6366f1",
};

const DEFAULT_ASSETS = [
  {
    assetType: "lighthouse_sponsor", title: "Novo Nordisk",
    accountableOwner: "Pedro Coelho", status: "in_progress",
    currentConfidence: 62, targetConfidence: 80,
    nextMilestone: "Confirm paid evaluation scope with Novo Nordisk digital health team",
    decisionRequired: "Should Biorce prioritise a paid retrospective evaluation with Novo Nordisk as the first lighthouse partnership?",
    currentBlocker: "No confirmed internal champion — need warm intro via Hospital Clinic or BSC",
    evidenceProduced: ["Novo Nordisk 2025 digital health strategy confirms AI infrastructure investment", "DCT pilot data shows 40% enrolment improvement"],
    commercialImpact: "€2.1M ARR + case study unlocks 8 additional pharma conversations",
    strategicImpact: "Validates Biorce as lighthouse-grade infrastructure for top-10 pharma",
    decisionDeadline: "2026-08-10",
  },
  {
    assetType: "workflow_distribution", title: "Veeva / Medidata",
    accountableOwner: "Diogo Coelho", status: "in_progress",
    currentConfidence: 45, targetConfidence: 75,
    nextMilestone: "Submit Veeva Technology Partner Program application",
    decisionRequired: "Prioritise Veeva or Medidata first given resource constraints?",
    currentBlocker: "Veeva partner program requires 3 joint customer references — currently 0",
    evidenceProduced: ["Veeva partner program open", "Medidata Rave has 70% Phase II/III market share"],
    commercialImpact: "Distribution to 1,200+ pharma companies using Veeva Vault",
    strategicImpact: "Embeddedness prevents competitive displacement",
    decisionDeadline: "2026-08-20",
  },
  {
    assetType: "standards_position", title: "CDISC / TransCelerate",
    accountableOwner: "Clara Bernardes", status: "in_progress",
    currentConfidence: 38, targetConfidence: 70,
    nextMilestone: "Submit CDISC Registered Solutions Partner application",
    decisionRequired: "Join TransCelerate before CDISC alignment is complete?",
    currentBlocker: "CDISC USDM v2.0 compliance requires 6–8 weeks engineering",
    evidenceProduced: ["CDISC USDM v2.0 published Q1 2025", "TransCelerate open partner program confirmed"],
    commercialImpact: "Table-stakes for enterprise pharma procurement",
    strategicImpact: "Regulatory legitimacy across 20+ pharma members",
    decisionDeadline: "2026-09-01",
  },
  {
    assetType: "execution_data_loop", title: "Velocity / Care Access",
    accountableOwner: "Pedro Coelho", status: "on_track",
    currentConfidence: 71, targetConfidence: 85,
    nextMilestone: "Sign pilot agreement with Velocity Clinical Research (3 sites)",
    decisionRequired: "Offer Velocity equity-for-data or standard commercial terms?",
    currentBlocker: "Legal review of data rights and IP ownership in pilot agreement",
    evidenceProduced: ["Velocity operates 100+ research sites across US", "Care Access DCT shows 3× faster enrolment"],
    commercialImpact: "€800K ARR from site licensing + Series B data asset",
    strategicImpact: "Real-world execution data is the most defensible Series B asset",
    decisionDeadline: "2026-08-15",
  },
  {
    assetType: "independent_evidence", title: "Tufts CSDD",
    accountableOwner: "Clara Bernardes", status: "in_progress",
    currentConfidence: 29, targetConfidence: 65,
    nextMilestone: "Initial meeting with Tufts CSDD Director of Research",
    decisionRequired: "Fund full independent study (€180K) or co-sponsor with a pharma partner?",
    currentBlocker: "No existing relationship with Tufts CSDD — need warm intro",
    evidenceProduced: ["Tufts CSDD is gold standard for trial cost/time benchmarks", "Independent validation required for Series B due diligence"],
    commercialImpact: "Unlocks enterprise procurement at 15+ pharma companies",
    strategicImpact: "Removes 'unproven' objection from every investor conversation",
    decisionDeadline: "2026-09-15",
  },
];

type AssetData = {
  id?: number;
  assetType: string;
  title: string;
  accountableOwner?: string | null;
  status?: string | null;
  currentConfidence?: number | null;
  targetConfidence?: number | null;
  nextMilestone?: string | null;
  decisionRequired?: string | null;
  currentBlocker?: string | null;
  evidenceProduced?: string[] | null;
  commercialImpact?: string | null;
  strategicImpact?: string | null;
  decisionDeadline?: string | null;
};

function ConfidenceBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span style={{ color: "var(--color-muted-foreground)" }}>Consensus confidence</span>
        <span className="font-semibold tabular-nums" style={{ color }}>
          {value}% <span style={{ color: "var(--color-muted-foreground)", fontWeight: 400 }}>/ {target}% target</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function AssetCard({ asset, onOpen }: { asset: AssetData; onOpen: () => void }) {
  const meta = ASSET_META[asset.assetType] ?? ASSET_META.lighthouse_sponsor;
  const Icon = meta.icon;
  const statusColor = STATUS_COLORS[asset.status ?? "not_started"];
  const daysToDeadline = asset.decisionDeadline
    ? Math.ceil((new Date(asset.decisionDeadline).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div
      className="rounded-2xl border flex flex-col gap-4 p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ background: meta.bg, borderColor: meta.border }}
      onClick={onOpen}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}20` }}>
            <Icon className="w-4.5 h-4.5" style={{ color: meta.color }} strokeWidth={1.25} />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: meta.color }}>{meta.label}</div>
            <div className="text-base font-semibold leading-tight" style={{ color: "var(--color-foreground)" }}>{asset.title}</div>
          </div>
        </div>
        <Badge className="text-[10px] font-medium capitalize flex-shrink-0 px-2 py-0.5"
          style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}35` }}>
          {(asset.status ?? "not_started").replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Confidence */}
      <ConfidenceBar value={asset.currentConfidence ?? 0} target={asset.targetConfidence ?? 80} color={meta.color} />

      {/* Key fields */}
      <div className="flex flex-col gap-2 text-xs">
        {asset.accountableOwner && (
          <div className="flex items-start gap-2">
            <span className="w-16 flex-shrink-0 font-medium" style={{ color: "var(--color-muted-foreground)" }}>Owner</span>
            <span style={{ color: "var(--color-foreground)" }}>{asset.accountableOwner}</span>
          </div>
        )}
        {asset.nextMilestone && (
          <div className="flex items-start gap-2">
            <span className="w-16 flex-shrink-0 font-medium" style={{ color: "var(--color-muted-foreground)" }}>Next step</span>
            <span style={{ color: "var(--color-foreground)" }}>{asset.nextMilestone}</span>
          </div>
        )}
        {daysToDeadline !== null && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 flex-shrink-0" style={{ color: daysToDeadline <= 7 ? "#ef4444" : "var(--color-muted-foreground)" }} strokeWidth={1.25} />
            <span style={{ color: daysToDeadline <= 7 ? "#ef4444" : "var(--color-muted-foreground)" }}>
              Decision deadline: {daysToDeadline <= 0 ? "overdue" : `${daysToDeadline}d`}
            </span>
          </div>
        )}
      </div>

      {/* Decision required */}
      {asset.decisionRequired && (
        <div className="rounded-lg p-2.5 text-xs" style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}25` }}>
          <div className="flex items-start gap-1.5">
            <Gavel className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: meta.color }} strokeWidth={1.25} />
            <span style={{ color: "var(--color-foreground)" }}>{asset.decisionRequired}</span>
          </div>
        </div>
      )}

      {/* Blocker */}
      {asset.currentBlocker && (
        <div className="flex items-start gap-1.5 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} strokeWidth={1.25} />
          <span style={{ color: "#ef4444" }}>{asset.currentBlocker}</span>
        </div>
      )}

      {/* Evidence */}
      {Array.isArray(asset.evidenceProduced) && asset.evidenceProduced.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Strategic output</div>
          <div className="flex flex-col gap-1">
            {(asset.evidenceProduced as string[]).slice(0, 2).map((e, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#10b981" }} strokeWidth={1.25} />
                <span style={{ color: "var(--color-foreground)" }}>{e}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commercial impact */}
      {asset.commercialImpact && (
        <div className="text-xs rounded-lg p-2.5" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <span className="font-medium" style={{ color: "var(--color-muted-foreground)" }}>Commercial: </span>
          <span style={{ color: "var(--color-foreground)" }}>{asset.commercialImpact}</span>
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center gap-1.5 text-xs font-medium mt-auto pt-1" style={{ color: meta.color }}>
        <Gavel className="w-3.5 h-3.5" strokeWidth={1.25} />
        Open Decision Room
        <ArrowRight className="w-3.5 h-3.5 ml-auto" strokeWidth={1.25} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: assets, isLoading } = trpc.partnershipAssets.list.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const { data: alerts } = trpc.alerts.list.useQuery(
    { isRead: false, limit: 3 }, { enabled: isAuthenticated }
  );
  const { data: rooms } = trpc.decisionRooms.list.useQuery(
    { limit: 3 }, { enabled: isAuthenticated }
  );

  const displayAssets: AssetData[] = (assets && assets.length > 0)
    ? assets.map(a => ({
        ...a,
        evidenceProduced: Array.isArray(a.evidenceProduced) ? a.evidenceProduced as string[] : [],
        currentBlocker: a.currentBlocker ?? undefined,
        decisionRequired: a.decisionRequired ?? undefined,
        nextMilestone: a.nextMilestone ?? undefined,
        commercialImpact: a.commercialImpact ?? undefined,
        accountableOwner: a.accountableOwner ?? undefined,
        decisionDeadline: undefined,
      }))
    : DEFAULT_ASSETS;

  const overallConf = displayAssets.length > 0
    ? Math.round(displayAssets.reduce((s, a) => s + (a.currentConfidence ?? 0), 0) / displayAssets.length)
    : 0;
  const decisionsAwaiting = displayAssets.filter(a => a.decisionRequired).length;
  const criticalBlockers = displayAssets.filter(a => a.currentBlocker).length;
  const evidenceInValidation = displayAssets.filter(a => (a.evidenceProduced as string[])?.length > 0).length;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6 max-w-screen-2xl mx-auto w-full">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5" style={{ color: "#6366f1" }} strokeWidth={1.25} />
              <h1 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                Five assets required to build Aika's adoption moat
              </h1>
            </div>
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              Track confidence, decisions, and blockers across all five strategic partnership assets
            </p>
          </div>
          <Button size="sm" onClick={() => setLocation("/decision-rooms")}
            style={{ background: "#6366f1", color: "white" }}>
            <Gavel className="w-4 h-4 mr-1.5" strokeWidth={1.25} />
            All Decision Rooms
          </Button>
        </div>

        {/* Executive indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Assets tracked", value: "5", icon: Target, color: "#6366f1" },
            { label: "Decisions awaiting approval", value: String(decisionsAwaiting), icon: Gavel, color: "#f59e0b" },
            { label: "Critical blockers", value: String(criticalBlockers), icon: AlertTriangle, color: "#ef4444" },
            { label: "Evidence in validation", value: String(evidenceInValidation), icon: CheckCircle2, color: "#10b981" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border p-4 flex items-center gap-3"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18` }}>
                <Icon className="w-4.5 h-4.5" style={{ color }} strokeWidth={1.25} />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-foreground)" }}>{value}</div>
                <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall confidence strip */}
        <div className="rounded-xl border p-4 flex items-center gap-4"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="text-sm font-medium flex-shrink-0" style={{ color: "var(--color-muted-foreground)" }}>
            Overall portfolio confidence
          </div>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallConf}%`, background: overallConf >= 60 ? "#10b981" : overallConf >= 40 ? "#f59e0b" : "#ef4444" }} />
          </div>
          <div className="text-xl font-bold tabular-nums flex-shrink-0"
            style={{ color: overallConf >= 60 ? "#10b981" : overallConf >= 40 ? "#f59e0b" : "#ef4444" }}>
            {overallConf}%
          </div>
        </div>

        {/* Asset cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl border p-6 animate-pulse h-72"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayAssets.map((asset, i) => (
              <AssetCard
                key={asset.assetType ?? i}
                asset={asset}
                onOpen={() => setLocation(`/decision-rooms?asset=${asset.assetType}`)}
              />
            ))}
          </div>
        )}

        {/* Bottom row: alerts + recent decisions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: "#f59e0b" }} strokeWidth={1.25} />
                <span className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>Recent Alerts</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/alerts")} className="text-xs">
                View all <ChevronRight className="w-3.5 h-3.5 ml-1" strokeWidth={1.25} />
              </Button>
            </div>
            {!alerts || alerts.length === 0 ? (
              <div className="text-sm text-center py-6" style={{ color: "var(--color-muted-foreground)" }}>No unread alerts</div>
            ) : (
              <div className="flex flex-col gap-2">
                {alerts.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: "var(--color-muted)" }}>
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: a.severity === "critical" ? "#ef4444" : a.severity === "high" ? "#f59e0b" : "#6366f1" }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{a.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                        {(a.body ?? "").slice(0, 90)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4" style={{ color: "#6366f1" }} strokeWidth={1.25} />
                <span className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>Recent Decision Rooms</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/decision-rooms")} className="text-xs">
                View all <ChevronRight className="w-3.5 h-3.5 ml-1" strokeWidth={1.25} />
              </Button>
            </div>
            {!rooms || rooms.length === 0 ? (
              <div className="text-sm text-center py-6" style={{ color: "var(--color-muted-foreground)" }}>
                No decision rooms yet — ask the Copilot a strategic question to create one
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {rooms.map(r => (
                  <button key={r.id} onClick={() => setLocation(`/decision-rooms/${r.id}`)}
                    className="flex items-start gap-3 p-3 rounded-lg text-left w-full transition-colors hover:bg-accent/50"
                    style={{ background: "var(--color-muted)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "#6366f120" }}>
                      <Gavel className="w-4 h-4" style={{ color: "#6366f1" }} strokeWidth={1.25} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>{r.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3" style={{ color: "var(--color-muted-foreground)" }} strokeWidth={1.25} />
                        <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                          {r.consensusScore != null ? `${r.consensusScore}% consensus` : r.status}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "var(--color-muted-foreground)" }} strokeWidth={1.25} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
