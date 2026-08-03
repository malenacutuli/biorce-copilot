import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState, Fragment } from "react";
import { toast } from "sonner";
import { Plus, TrendingUp, BookOpen, Users, Bot, Play, Clock, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, RefreshCw, ChevronDown, ChevronUp, XCircle, Loader2 } from "lucide-react";

// ─── Agent Registry (mirrors langchainOrchestrator.ts) ───────────────────────
// executionMode:
//   "on_demand"       — participates in Copilot Q&A only; no background job
//   "manual_enabled"  — wired to the audited server-side service; "Run Now" available
//   "not_wired"       — registered in Heartbeat but direct trigger not yet connected to job runner
const AGENT_REGISTRY = [
  { id: "regulatory_watch",    name: "Regulatory Watch Agent",         domain: "regulatory",     schedule: "Daily 07:00 UTC",        executionMode: "not_wired"      as const, color: "text-blue-400" },
  { id: "competitive_intel",   name: "Competitive Intelligence Agent", domain: "competitive",    schedule: "Daily 07:30 UTC",        executionMode: "not_wired"      as const, color: "text-orange-400" },
  { id: "partnership_pulse",   name: "Partnership Pulse Agent",        domain: "partnerships",   schedule: "Daily 08:00 UTC",        executionMode: "manual_enabled" as const, color: "text-purple-400" },
  { id: "pharma_signal",       name: "Pharma Signal Engine",           domain: "pharma",         schedule: "Daily 08:30 UTC",        executionMode: "not_wired"      as const, color: "text-green-400" },
  { id: "opportunity_agent",   name: "Opportunity Agent",              domain: "opportunity",    schedule: "Daily 09:00 UTC",        executionMode: "not_wired"      as const, color: "text-yellow-400" },
  { id: "contradiction_agent", name: "Contradiction Agent",            domain: "contradictions", schedule: "Daily 09:30 UTC",        executionMode: "on_demand"      as const, color: "text-red-400" },
  { id: "strategy_execution",  name: "Strategy Execution Agent",       domain: "execution",      schedule: "Daily 10:00 UTC",        executionMode: "not_wired"      as const, color: "text-cyan-400" },
  { id: "claims_guardian",     name: "Claims Guardian",                domain: "claims",         schedule: "Mon 09:30 UTC",          executionMode: "on_demand"      as const, color: "text-pink-400" },
  { id: "vision_consistency",  name: "Vision Consistency Agent",       domain: "vision",         schedule: "Mon 10:00 UTC",          executionMode: "not_wired"      as const, color: "text-indigo-400" },
  { id: "scientific_evidence", name: "Scientific Evidence Agent",      domain: "science",        schedule: "Tue 08:00 UTC",          executionMode: "on_demand"      as const, color: "text-teal-400" },
  { id: "standards_watch",     name: "Standards Watch Agent",          domain: "standards",      schedule: "Wed 08:00 UTC",          executionMode: "not_wired"      as const, color: "text-lime-400" },
  { id: "weekly_digest",       name: "Weekly Intelligence Digest",     domain: "digest",         schedule: "Mon 09:00 UTC",          executionMode: "not_wired"      as const, color: "text-amber-400" },
  { id: "board_intelligence",  name: "Board Intelligence Agent",       domain: "board",          schedule: "1st of month 08:00 UTC", executionMode: "not_wired"      as const, color: "text-rose-400" },
] as const;

const EXECUTION_MODE_BADGE = {
  on_demand:      { label: "On Demand",            cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",       title: "Participates in Copilot Q&A reasoning. No background automation." },
  manual_enabled: { label: "Manual Run Enabled",   cls: "bg-purple-500/10 text-purple-400 border-purple-500/20", title: "Wired to the audited server-side job runner. Use Run Now to trigger." },
  not_wired:      { label: "Automation Not Wired", cls: "bg-muted/50 text-muted-foreground border-border",       title: "Registered in Heartbeat but direct trigger is not yet connected to the audited job runner." },
} as const;

function AgentsPanel() {
  const [triggering, setTriggering] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const triggerMutation = trpc.scheduledAgents.triggerJob.useMutation({
    onSuccess: (data, variables) => {
      const agentId = variables.jobName;
      const skipped = (data as any).skipped;
      const msg = skipped
        ? `Skipped: ${(data as any).reason ?? "already ran today"}`
        : data.ok
        ? `Done — ${(data as any).staleCount ?? 0} stale, ${(data as any).alertsCreated ?? 0} alert(s)`
        : "Trigger failed";
      setResults(prev => ({ ...prev, [agentId]: { ok: !!data.ok, message: msg } }));
      toast[data.ok ? "success" : "error"](msg);
      setTriggering(null);
    },
    onError: (err, variables) => {
      const agentId = variables.jobName;
      setResults(prev => ({ ...prev, [agentId]: { ok: false, message: err.message } }));
      toast.error(`Agent trigger failed: ${err.message}`);
      setTriggering(null);
    },
  });

  function handleTrigger(agent: typeof AGENT_REGISTRY[number]) {
    if (agent.executionMode !== "manual_enabled") {
      if (agent.executionMode === "on_demand") {
        toast.info(`${agent.name} participates in Copilot Q&A reasoning but has no background automation.`);
      } else {
        toast.info("Manual execution is not yet connected to the audited job runner.");
      }
      return;
    }
    setTriggering(agent.id);
    triggerMutation.mutate({ jobName: "daily-partnership-pulse", force: false });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bot size={16} style={{ color: "var(--color-primary)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>LangChain Agent Network</h2>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">13 agents live</span>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--color-muted-foreground)" }}>
        Agents serve three roles: <strong>On Demand</strong> — available in Copilot Q&amp;A; <strong>Automation Not Wired</strong> — registered in Heartbeat but manual trigger not yet connected to the audited job runner; <strong>Manual Run Enabled</strong> — wired end-to-end and safe to trigger directly.
      </p>
      <div className="grid gap-2">
        {AGENT_REGISTRY.map(agent => {
          const agentId = agent.id;
          const result = results[agentId];
          const isTriggering = triggering === agentId;
          const badge = EXECUTION_MODE_BADGE[agent.executionMode];
          const isWired = agent.executionMode === "manual_enabled";
          return (
            <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
              <div className={`w-2 h-2 rounded-full bg-current flex-shrink-0 ${agent.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate" style={{ color: "var(--color-foreground)" }}>{agent.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground flex-shrink-0">{agent.domain}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${badge.cls}`} title={badge.title}>{badge.label}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock size={10} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{agent.schedule}</span>
                  {result && (
                    <span className={`ml-2 text-xs flex items-center gap-1 ${result.ok ? "text-green-400" : "text-red-400"}`}>
                      {result.ok ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                      {result.message}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleTrigger(agent)}
                disabled={isTriggering}
                title={isWired ? "Run now (admin only)" : badge.title}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                style={{ color: "var(--color-foreground)" }}
              >
                {isTriggering ? (
                  <span className="animate-spin inline-block w-3 h-3 border border-current border-t-transparent rounded-full" />
                ) : (
                  <Play size={10} />
                )}
                {isTriggering ? "Running…" : "Run Now"}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          <strong>Architecture:</strong> Router Chain → Parallel Agent Chains → Debate Round → Consensus Chain → Synthesis Chain. 
          Each agent writes findings to the DB as alerts, discrepancies, or knowledge items. 
          The Copilot Q&A uses the full 5-step orchestration pipeline.
        </p>
      </div>
    </div>
  );
}

const KNOWLEDGE_CATEGORIES = [
  { value: "podcast", label: "Podcast" },
  { value: "press_release", label: "Press Release" },
  { value: "regulatory", label: "Regulatory" },
  { value: "competitor", label: "Competitor Intel" },
  { value: "internal", label: "Internal" },
  { value: "investor", label: "Investor" },
  { value: "public_statement", label: "Public Statement" },
  { value: "research", label: "Research" },
] as const;

const CI_EVENT_TYPES = [
  { value: "press_release", label: "Press Release" },
  { value: "product_launch", label: "Product Launch" },
  { value: "partnership", label: "Partnership" },
  { value: "funding", label: "Funding" },
  { value: "regulatory", label: "Regulatory" },
  { value: "personnel", label: "Personnel" },
  { value: "other", label: "Other" },
] as const;

function KnowledgeForm() {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ title: "", category: "press_release", content: "", summary: "", sourceName: "", sourceUrl: "", verificationStatus: "unverified" });
  const create = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      toast.success("Knowledge item added successfully");
      setForm({ title: "", category: "press_release", content: "", summary: "", sourceName: "", sourceUrl: "", verificationStatus: "unverified" });
      utils.knowledge.list.invalidate();
      utils.dashboard.kpis.invalidate();
    },
    onError: (e) => toast.error(`Failed to add item: ${e.message}`),
  });

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 transition-all";
  const inputStyle = { background: "var(--color-input)", borderColor: "var(--color-border)", color: "var(--color-foreground)" };

  return (
    <div className="rounded-xl border p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Add Knowledge Item</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Title *</label>
          <input className={inputCls} style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. FDA DHCoE AI/ML Action Plan 2026" />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Category *</label>
          <select className={inputCls} style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {KNOWLEDGE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Verification Status</label>
          <select className={inputCls} style={inputStyle} value={form.verificationStatus} onChange={e => setForm(f => ({ ...f, verificationStatus: e.target.value }))}>
            <option value="verified">Verified</option>
            <option value="inferred">Inferred</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Source Name</label>
          <input className={inputCls} style={inputStyle} value={form.sourceName} onChange={e => setForm(f => ({ ...f, sourceName: e.target.value }))} placeholder="e.g. FDA.gov" />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Source URL</label>
          <input className={inputCls} style={inputStyle} value={form.sourceUrl} onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))} placeholder="https://..." />
        </div>
        <div className="col-span-2">
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Summary</label>
          <textarea className={inputCls} style={inputStyle} rows={2} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Brief 1-2 sentence summary..." />
        </div>
        <div className="col-span-2">
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Full Content *</label>
          <textarea className={inputCls} style={inputStyle} rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Full text, transcript, or detailed notes..." />
        </div>
      </div>
      <button
        onClick={() => create.mutate({ title: form.title, category: form.category as typeof KNOWLEDGE_CATEGORIES[number]["value"], content: form.content, summary: form.summary || undefined, sourceName: form.sourceName || undefined, sourceUrl: form.sourceUrl || undefined, verificationStatus: form.verificationStatus as "verified" | "inferred" | "unverified" })}
        disabled={create.isPending || !form.title || !form.content}
        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-60"
        style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
        <Plus className="w-3.5 h-3.5" />
        {create.isPending ? "Adding..." : "Add to Knowledge Base"}
      </button>
    </div>
  );
}

function CiEventForm() {
  const utils = trpc.useUtils();
  const { data: competitors } = trpc.competitive.competitors.useQuery();
  const [form, setForm] = useState({ competitorId: "", title: "", type: "press_release", summary: "", sourceUrl: "", biorceImplication: "" });
  const add = trpc.competitive.addEvent.useMutation({
    onSuccess: () => {
      toast.success("Competitive event recorded");
      setForm({ competitorId: "", title: "", type: "press_release", summary: "", sourceUrl: "", biorceImplication: "" });
      utils.competitive.events.invalidate();
    },
    onError: (e) => toast.error(`Failed to add event: ${e.message}`),
  });

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 transition-all";
  const inputStyle = { background: "var(--color-input)", borderColor: "var(--color-border)", color: "var(--color-foreground)" };

  return (
    <div className="rounded-xl border p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Log Competitive Event</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Competitor *</label>
          <select className={inputCls} style={inputStyle} value={form.competitorId} onChange={e => setForm(f => ({ ...f, competitorId: e.target.value }))}>
            <option value="">Select competitor...</option>
            {competitors?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Event Type *</label>
          <select className={inputCls} style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {CI_EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Event Title *</label>
          <input className={inputCls} style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Evinova announces partnership with Roche for DCT platform" />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Source URL</label>
          <input className={inputCls} style={inputStyle} value={form.sourceUrl} onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))} placeholder="https://..." />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Biorce Implication</label>
          <input className={inputCls} style={inputStyle} value={form.biorceImplication} onChange={e => setForm(f => ({ ...f, biorceImplication: e.target.value }))} placeholder="How does this affect Biorce?" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Summary</label>
          <textarea className={inputCls} style={inputStyle} rows={3} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Brief description of the event..." />
        </div>
      </div>
      <button
        onClick={() => add.mutate({ competitorId: Number(form.competitorId), title: form.title, type: form.type as typeof CI_EVENT_TYPES[number]["value"], summary: form.summary || undefined, sourceUrl: form.sourceUrl || undefined, biorceImplication: form.biorceImplication || undefined })}
        disabled={add.isPending || !form.competitorId || !form.title}
        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-60"
        style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
        <Plus className="w-3.5 h-3.5" />
        {add.isPending ? "Logging..." : "Log Event"}
      </button>
    </div>
  );
}

function PartnerForm() {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ name: "", type: "pharma", tier: "P2", stage: "identified", region: "US", website: "", description: "", nextAction: "" });
  const create = trpc.partnerships.create.useMutation({
    onSuccess: () => {
      toast.success("Partner added to pipeline");
      setForm({ name: "", type: "pharma", tier: "P2", stage: "identified", region: "US", website: "", description: "", nextAction: "" });
      utils.partnerships.list.invalidate();
      utils.dashboard.kpis.invalidate();
    },
    onError: (e) => toast.error(`Failed to add partner: ${e.message}`),
  });
  const inputCls = "w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 transition-all";
  const inputStyle = { background: "var(--color-input)", borderColor: "var(--color-border)", color: "var(--color-foreground)" };
  return (
    <div className="rounded-xl border p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Add Partnership Target</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Company Name *</label>
          <input className={inputCls} style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Novartis AG" />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Type *</label>
          <select className={inputCls} style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {[["pharma","Pharma"],["cro","CRO"],["tech","Tech"],["hospital","Hospital"],["regulator","Regulator"],["investor","Investor"],["standards_body","Standards Body"],["lobby","Lobby"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Tier</label>
          <select className={inputCls} style={inputStyle} value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
            {["P0","P1","P2","P3"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Stage</label>
          <select className={inputCls} style={inputStyle} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
            {[["identified","Identified"],["researching","Researching"],["outreach","Outreach"],["intro_meeting","Intro Meeting"],["negotiating","Negotiating"],["loi_signed","LOI Signed"],["active","Active"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Region</label>
          <select className={inputCls} style={inputStyle} value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
            {["US","EU","GLOBAL"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Website</label>
          <input className={inputCls} style={inputStyle} value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
        </div>
        <div className="col-span-2">
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Description</label>
          <textarea className={inputCls} style={inputStyle} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the company and partnership opportunity..." />
        </div>
        <div className="col-span-2">
          <label className="block text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>Next Action</label>
          <input className={inputCls} style={inputStyle} value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))} placeholder="e.g. Schedule intro call with BD team" />
        </div>
      </div>
      <button
        onClick={() => create.mutate({ name: form.name, type: form.type as any, tier: form.tier as any, stage: form.stage as any, region: form.region as any, website: form.website || undefined, description: form.description || undefined, nextAction: form.nextAction || undefined })}
        disabled={create.isPending || !form.name}
        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-60"
        style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
        <Plus className="w-3.5 h-3.5" />
        {create.isPending ? "Adding..." : "Add to Pipeline"}
      </button>
    </div>
  );
}

function ExecutionHistoryDrawer({ jobName, onClose }: { jobName: string; onClose: () => void }) {
  const { data: execs, isLoading } = trpc.scheduledAgents.listExecutions.useQuery({ jobName, limit: 10 });

  function fmtDate(d: any) {
    if (!d) return "—";
    return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function fmtDuration(ms: number | null | undefined) {
    if (!ms) return "—";
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  const statusIcon = (s: string) => {
    if (s === "success") return <CheckCircle size={12} className="text-green-400" />;
    if (s === "running") return <Loader2 size={12} className="text-blue-400 animate-spin" />;
    if (s === "failed") return <XCircle size={12} className="text-red-400" />;
    return <AlertCircle size={12} className="text-muted-foreground" />;
  };

  return (
    <div className="mt-2 p-3 rounded-lg border border-border bg-background/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>Execution History — {jobName}</span>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : !execs || execs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No executions recorded yet. Trigger a run to see history.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {execs.map((ex: any) => (
            <div key={ex.id} className="text-xs grid grid-cols-[16px_1fr] gap-x-2 gap-y-0.5 items-start">
              <div className="mt-0.5">{statusIcon(ex.status)}</div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium" style={{ color: "var(--color-foreground)" }}>{fmtDate(ex.startedAt)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{fmtDuration(ex.durationMs)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">read {ex.recordsRead ?? 0} / wrote {ex.recordsWritten ?? 0} / alerts {ex.alertsCreated ?? 0}</span>
                  {ex.triggeredBy !== "cron" && (
                    <span className="px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{ex.triggeredBy}</span>
                  )}
                  {ex.escalated && (
                    <span className="px-1 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">escalated</span>
                  )}
                </div>
                {ex.errorMessage && (
                  <p className="text-red-400 mt-0.5 truncate" title={ex.errorMessage}>{ex.errorMessage}</p>
                )}
                {ex.escalationNote && (
                  <p className="text-orange-400 mt-0.5">{ex.escalationNote}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduledJobRow({ job, latestExec }: { job: any; latestExec: any }) {
  const [open, setOpen] = useState(false);
  const toggleMut = trpc.scheduledAgents.toggleJob.useMutation({
    onSuccess: (_, vars) => toast.success(vars.enable ? "Job enabled" : "Job paused"),
    onError: (err) => toast.error(`Toggle failed: ${err.message}`),
  });

  function fmtDate(d: any) {
    if (!d) return "—";
    return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const lastStatus = latestExec?.status;
  const lastStatusIcon = lastStatus === "success" ? <CheckCircle size={11} className="text-green-400" />
    : lastStatus === "failed" ? <XCircle size={11} className="text-red-400" />
    : lastStatus === "running" ? <Loader2 size={11} className="text-blue-400 animate-spin" />
    : null;

  return (
    <div className="rounded-lg border border-border hover:bg-accent/10 transition-colors">
      <div className="flex items-start gap-3 p-3">
        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${job.isEnable ? "bg-green-400" : "bg-muted-foreground"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{job.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded border ${job.isEnable ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-muted/50 text-muted-foreground border-border"}`}>
              {job.isEnable ? "Active" : "Paused"}
            </span>
            {lastStatusIcon && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {lastStatusIcon}
                <span>Last run: {lastStatus}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground"><span className="opacity-60">Cron:</span> {job.cronExpression}</span>
            <span className="text-xs text-muted-foreground"><span className="opacity-60">Last:</span> {fmtDate(job.lastExecutedAt)}</span>
            <span className="text-xs text-muted-foreground"><span className="opacity-60">Next:</span> {fmtDate(job.nextExecutionAt)}</span>
            {latestExec?.durationMs && (
              <span className="text-xs text-muted-foreground"><span className="opacity-60">Duration:</span> {latestExec.durationMs < 1000 ? `${latestExec.durationMs}ms` : `${(latestExec.durationMs / 1000).toFixed(1)}s`}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setOpen(o => !o)}
            className="p-1 rounded hover:bg-accent transition-colors"
            title="Execution history"
          >
            {open ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
          </button>
          <button
            onClick={() => toggleMut.mutate({ taskUid: job.taskUid, enable: !job.isEnable })}
            disabled={toggleMut.isPending}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-border hover:bg-accent transition-colors disabled:opacity-50"
            style={{ color: "var(--color-foreground)" }}
            title={job.isEnable ? "Pause job" : "Enable job"}
          >
            {job.isEnable ? <ToggleRight size={14} className="text-green-400" /> : <ToggleLeft size={14} className="text-muted-foreground" />}
            {job.isEnable ? "Pause" : "Enable"}
          </button>
        </div>
      </div>
      {open && <div className="px-3 pb-3"><ExecutionHistoryDrawer jobName={job.name} onClose={() => setOpen(false)} /></div>}
    </div>
  );
}

function ScheduledJobsPanel() {
  const { data: jobs, isLoading, refetch } = trpc.scheduledAgents.listJobs.useQuery();
  const { data: latestExecs } = trpc.scheduledAgents.latestExecutions.useQuery();

  // Build a map from jobName → latest execution record
  const execMap: Record<string, any> = {};
  if (latestExecs) {
    for (const ex of latestExecs as any[]) {
      execMap[ex.jobName] = ex;
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} style={{ color: "var(--color-primary)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Scheduled Jobs</h2>
        <span className="text-xs text-muted-foreground ml-1">— registered and enabled does not mean working; check execution history</span>
        <button onClick={() => refetch()} className="ml-auto p-1 rounded hover:bg-accent transition-colors" title="Refresh">
          <RefreshCw size={12} style={{ color: "var(--color-muted-foreground)" }} />
        </button>
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading jobs…</p>
      ) : !jobs || jobs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No scheduled jobs found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {(jobs as any[]).map((job) => (
            <ScheduledJobRow key={job.taskUid} job={job} latestExec={execMap[job.name]} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Admin Panel</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>Add knowledge items, log competitive events, and manage intelligence data</p>
        </div>
        <div className="flex flex-col gap-6">
          <AgentsPanel />
          <ScheduledJobsPanel />
          <KnowledgeForm />
        <CiEventForm />
          <PartnerForm />
        </div>
      </div>
    </AppLayout>
  );
}
