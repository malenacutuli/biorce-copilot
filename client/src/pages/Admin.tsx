import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, TrendingUp, BookOpen, Users, Bot, Play, Clock, CheckCircle, AlertCircle } from "lucide-react";

// ─── Agent Registry (mirrors langchainOrchestrator.ts) ───────────────────────
const AGENT_REGISTRY = [
  { id: "regulatory_watch",    name: "Regulatory Watch Agent",       domain: "regulatory",    schedule: "Daily 07:00 UTC",   path: "/api/scheduled/agent-regulatory-watch",    color: "text-blue-400" },
  { id: "competitive_intel",   name: "Competitive Intelligence Agent", domain: "competitive", schedule: "Daily 07:30 UTC",   path: "/api/scheduled/agent-competitive-intel",   color: "text-orange-400" },
  { id: "partnership_pulse",   name: "Partnership Pulse Agent",      domain: "partnerships",  schedule: "Daily 08:00 UTC",   path: "/api/scheduled/daily-partnership-pulse",   color: "text-purple-400" },
  { id: "pharma_signal",       name: "Pharma Signal Engine",         domain: "pharma",        schedule: "Daily 08:30 UTC",   path: "/api/scheduled/agent-pharma-signal",       color: "text-green-400" },
  { id: "opportunity_agent",   name: "Opportunity Agent",            domain: "opportunity",   schedule: "Daily 09:00 UTC",   path: "/api/scheduled/agent-opportunity",          color: "text-yellow-400" },
  { id: "contradiction_agent", name: "Contradiction Agent",          domain: "contradictions", schedule: "Daily 09:30 UTC",  path: "/api/scheduled/agent-contradiction",        color: "text-red-400" },
  { id: "strategy_execution",  name: "Strategy Execution Agent",     domain: "execution",     schedule: "Daily 10:00 UTC",   path: "/api/scheduled/agent-strategy-execution",  color: "text-cyan-400" },
  { id: "claims_guardian",     name: "Claims Guardian",              domain: "claims",        schedule: "Mon 09:30 UTC",     path: "/api/scheduled/agent-claims-guardian",     color: "text-pink-400" },
  { id: "vision_consistency",  name: "Vision Consistency Agent",     domain: "vision",        schedule: "Mon 10:00 UTC",     path: "/api/scheduled/agent-vision-consistency",  color: "text-indigo-400" },
  { id: "scientific_evidence", name: "Scientific Evidence Agent",    domain: "science",       schedule: "Tue 08:00 UTC",     path: "/api/scheduled/agent-scientific-evidence", color: "text-teal-400" },
  { id: "standards_watch",     name: "Standards Watch Agent",        domain: "standards",     schedule: "Wed 08:00 UTC",     path: "/api/scheduled/agent-standards-watch",     color: "text-lime-400" },
  { id: "weekly_digest",       name: "Weekly Intelligence Digest",   domain: "digest",        schedule: "Mon 09:00 UTC",     path: "/api/scheduled/weekly-digest",             color: "text-amber-400" },
  { id: "board_intelligence",  name: "Board Intelligence Agent",     domain: "board",         schedule: "1st of month 08:00 UTC", path: "/api/scheduled/agent-board-intelligence", color: "text-rose-400" },
] as const;

function AgentsPanel() {
  const [triggering, setTriggering] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const triggerMutation = trpc.scheduledAgents.triggerJob.useMutation({
    onSuccess: (data, variables) => {
      const agentId = variables.path.split("/").pop() ?? variables.path;
      setResults(prev => ({
        ...prev,
        [agentId]: { ok: data.ok, message: data.ok ? "Triggered successfully" : `Error: ${JSON.stringify(data.body)}` },
      }));
      toast[data.ok ? "success" : "error"](data.ok ? "Agent triggered successfully" : "Agent trigger failed");
      setTriggering(null);
    },
    onError: (err, variables) => {
      const agentId = variables.path.split("/").pop() ?? variables.path;
      setResults(prev => ({ ...prev, [agentId]: { ok: false, message: err.message } }));
      toast.error(`Agent trigger failed: ${err.message}`);
      setTriggering(null);
    },
  });

  function handleTrigger(path: string) {
    const agentId = path.split("/").pop() ?? path;
    setTriggering(agentId);
    triggerMutation.mutate({ path });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bot size={16} style={{ color: "var(--color-primary)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>LangChain Agent Network</h2>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">13 agents live</span>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--color-muted-foreground)" }}>
        All agents run on live cron schedules via Heartbeat. Each uses the LangChain orchestrator: structured prompt → ChatOpenAI → JSON output with confidence scoring, citations, and retry logic. Use "Run Now" to trigger any agent manually.
      </p>
      <div className="grid gap-2">
        {AGENT_REGISTRY.map(agent => {
          const agentId = agent.path.split("/").pop() ?? agent.id;
          const result = results[agentId];
          const isTriggering = triggering === agentId;
          return (
            <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
              <div className={`w-2 h-2 rounded-full bg-current flex-shrink-0 ${agent.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate" style={{ color: "var(--color-foreground)" }}>{agent.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground flex-shrink-0">{agent.domain}</span>
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
                onClick={() => handleTrigger(agent.path)}
                disabled={isTriggering}
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
          <KnowledgeForm />
        <CiEventForm />
          <PartnerForm />
        </div>
      </div>
    </AppLayout>
  );
}
