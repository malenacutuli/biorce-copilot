import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Users, ExternalLink, Plus, Flag, Activity, X, Check, Trash2, ChevronDown, ChevronUp, Link2 } from "lucide-react";

const STAGES = ["all","prospect","first_contact","discovery","proposal","pilot","negotiation","signed","active","paused","dead"];
const stageColor: Record<string, string> = {
  prospect: "oklch(0.6 0.05 240)", first_contact: "oklch(0.65 0.18 200)", discovery: "oklch(0.65 0.18 270)",
  proposal: "oklch(0.65 0.18 60)", pilot: "oklch(0.65 0.18 145)", negotiation: "oklch(0.65 0.18 30)",
  signed: "oklch(0.65 0.18 145)", active: "oklch(0.65 0.22 145)", paused: "oklch(0.6 0.05 60)", dead: "oklch(0.55 0.05 0)",
};
const flagColor: Record<string, string> = {
  risk: "oklch(0.65 0.2 25)", opportunity: "oklch(0.65 0.18 145)", blocker: "oklch(0.65 0.2 0)",
  follow_up: "oklch(0.65 0.18 200)", intel_conflict: "oklch(0.65 0.18 270)", other: "oklch(0.6 0.05 240)",
};
const activityIcon: Record<string, string> = {
  email: "✉️", call: "📞", meeting: "🤝", demo: "🖥️", proposal_sent: "📄",
  contract_sent: "📋", note: "📝", other: "💬",
};

function ActivityLog({ partnerId }: { partnerId: number }) {
  const { data: activities, refetch } = trpc.partnerCrm.listActivities.useQuery({ partnerId });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ activityType: "note" as any, summary: "", outcome: "", nextAction: "", nextActionDue: "" });
  const log = trpc.partnerCrm.logActivity.useMutation({
    onSuccess: () => { setShowForm(false); setForm({ activityType: "note", summary: "", outcome: "", nextAction: "", nextActionDue: "" }); refetch(); toast.success("Activity logged"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = trpc.partnerCrm.deleteActivity.useMutation({ onSuccess: () => refetch() });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>Activity Log ({activities?.length ?? 0})</div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
          style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
          <Plus className="w-3 h-3" /> Log
        </button>
      </div>
      {showForm && (
        <div className="p-3 rounded-xl border mb-3 space-y-2" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)" }}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Type</label>
              <select value={form.activityType} onChange={e => setForm(f => ({ ...f, activityType: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                {["email","call","meeting","demo","proposal_sent","contract_sent","note","other"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Outcome</label>
              <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                {["","pending","positive","negative","no_response","meeting_booked","referred"].map(t => <option key={t} value={t}>{t || "—"}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Summary *</label>
            <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={2}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border resize-none" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Next Action</label>
              <input value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Due Date</label>
              <input type="date" value={form.nextActionDue} onChange={e => setForm(f => ({ ...f, nextActionDue: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-1.5 rounded-lg text-xs border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>Cancel</button>
            <button onClick={() => form.summary.trim() && log.mutate({ partnerId, ...form } as any)} disabled={log.isPending}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
              {log.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activities?.map((a: any) => (
          <div key={a.id} className="p-3 rounded-xl border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="text-sm flex-shrink-0">{activityIcon[a.activityType] ?? "💬"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{a.activityType?.replace(/_/g," ")}</span>
                    {a.outcome && a.outcome !== "pending" && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>{a.outcome}</span>}
                    <span className="text-xs ml-auto" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{new Date(a.loggedAt ?? a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>{a.summary}</p>
                  {a.nextAction && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-xs" style={{ color: "var(--color-primary)" }}>→ {a.nextAction}</span>
                      {a.nextActionDue && <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>by {new Date(a.nextActionDue).toLocaleDateString()}</span>}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => del.mutate({ id: a.id })} className="flex-shrink-0"><Trash2 className="w-3 h-3" style={{ color: "var(--color-muted-foreground)" }} /></button>
            </div>
          </div>
        ))}
        {(!activities || activities.length === 0) && <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>No activities logged yet.</p>}
      </div>
    </div>
  );
}

function FlagsPanel({ partnerId }: { partnerId: number }) {
  const { data: flags, refetch } = trpc.partnerCrm.listFlags.useQuery({ partnerId });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ flagType: "follow_up" as any, title: "", body: "", severity: "medium" as any });
  const create = trpc.partnerCrm.createFlag.useMutation({
    onSuccess: () => { setShowForm(false); setForm({ flagType: "follow_up", title: "", body: "", severity: "medium" }); refetch(); toast.success("Flag created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const resolve = trpc.partnerCrm.resolveFlag.useMutation({ onSuccess: () => refetch() });
  const del = trpc.partnerCrm.deleteFlag.useMutation({ onSuccess: () => refetch() });
  const open = flags?.filter((f: any) => f.status === "open") ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>Flags</div>
          {open.length > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.65 0.2 25 / 0.2)", color: "oklch(0.65 0.2 25)", fontSize: "10px" }}>{open.length} open</span>}
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
          style={{ background: "oklch(0.65 0.2 25 / 0.15)", color: "oklch(0.65 0.2 25)" }}>
          <Flag className="w-3 h-3" /> Flag
        </button>
      </div>
      {showForm && (
        <div className="p-3 rounded-xl border mb-3 space-y-2" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)" }}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Type</label>
              <select value={form.flagType} onChange={e => setForm(f => ({ ...f, flagType: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                {["risk","opportunity","blocker","follow_up","intel_conflict","other"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                {["low","medium","high","critical"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Details</label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={2}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border resize-none" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-1.5 rounded-lg text-xs border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>Cancel</button>
            <button onClick={() => form.title.trim() && create.mutate({ partnerId, ...form } as any)} disabled={create.isPending}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
              {create.isPending ? "Saving..." : "Create Flag"}
            </button>
          </div>
        </div>
      )}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {flags?.map((f: any) => (
          <div key={f.id} className="p-3 rounded-xl border" style={{ background: "var(--color-card)", borderColor: f.status === "open" ? (flagColor[f.flagType] ?? "var(--color-border)") + "44" : "var(--color-border)", opacity: f.status !== "open" ? 0.6 : 1 }}>
            <div className="flex items-start gap-2">
              <Flag className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: flagColor[f.flagType] ?? "var(--color-muted-foreground)" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{f.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: (flagColor[f.flagType] ?? "var(--color-muted)") + "22", color: flagColor[f.flagType] ?? "var(--color-muted-foreground)", fontSize: "10px" }}>{f.flagType?.replace(/_/g," ")}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded badge-${f.severity}`} style={{ fontSize: "10px" }}>{f.severity}</span>
                </div>
                {f.body && <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{f.body}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {f.status === "open" && <>
                  <button onClick={() => resolve.mutate({ id: f.id, status: "resolved" })} title="Resolve"><Check className="w-3.5 h-3.5 text-green-500" /></button>
                  <button onClick={() => resolve.mutate({ id: f.id, status: "dismissed" })} title="Dismiss"><X className="w-3.5 h-3.5" style={{ color: "var(--color-muted-foreground)" }} /></button>
                </>}
                <button onClick={() => del.mutate({ id: f.id })}><Trash2 className="w-3.5 h-3.5" style={{ color: "var(--color-muted-foreground)" }} /></button>
              </div>
            </div>
          </div>
        ))}
        {(!flags || flags.length === 0) && <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>No flags yet.</p>}
      </div>
    </div>
  );
}

export default function Partnerships() {
  const [stage, setStage] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "flags">("overview");
  const { data: partners, isLoading, refetch } = trpc.partnerships.list.useQuery({
    stage: stage === "all" ? undefined : stage as any, limit: 100,
  });
  const { data: detail } = trpc.partnerships.byId.useQuery({ id: selected! }, { enabled: selected != null });
  const updateStage = trpc.partnerships.updateStage.useMutation({
    onSuccess: () => { refetch(); toast.success("Stage updated"); },
  });

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Left panel */}
        <div className="w-72 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--color-border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h1 className="text-base font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>Partnership Pipeline</h1>
            <div className="flex gap-1 flex-wrap">
              {STAGES.map(s => (
                <button key={s} onClick={() => setStage(s)} className="px-2 py-0.5 rounded text-xs transition-all"
                  style={{ background: stage === s ? "var(--color-primary)" : "var(--color-accent)", color: stage === s ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)" }}>
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <div className="p-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Loading...</div>}
            {partners?.map((p: any) => (
              <div key={p.id} onClick={() => { setSelected(p.id); setActiveTab("overview"); }}
                className="p-3 border-b cursor-pointer transition-all"
                style={{ borderColor: "var(--color-border)", background: selected === p.id ? "var(--color-accent)" : "transparent" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold flex-1 truncate" style={{ color: "var(--color-foreground)" }}>{p.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-data" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>{p.tier}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stageColor[p.stage] ?? "var(--color-muted-foreground)" }} />
                  <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{p.stage?.replace(/_/g, " ")}</span>
                  <span className="text-xs ml-auto" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{p.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto">
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Users className="w-10 h-10" style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Select a partner to view details</p>
            </div>
          )}
          {detail && (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>{detail.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-data px-1.5 py-0.5 rounded" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{detail.tier}</span>
                    <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{detail.type}</span>
                    <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{detail.region}</span>
                    {detail.website && <a href={detail.website} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1" style={{ color: "var(--color-primary)" }}><ExternalLink className="w-3 h-3" />Website</a>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: stageColor[detail.stage] ?? "var(--color-muted-foreground)" }} />
                  <select value={detail.stage} onChange={e => updateStage.mutate({ id: detail.id, stage: e.target.value as any })}
                    className="text-xs px-2 py-1 rounded border outline-none" style={{ background: "var(--color-input)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                    {STAGES.filter(s => s !== "all").map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-5 border-b" style={{ borderColor: "var(--color-border)" }}>
                {(["overview","activities","flags"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="px-3 py-2 text-xs font-medium transition-all border-b-2 -mb-px"
                    style={{ borderColor: activeTab === tab ? "var(--color-primary)" : "transparent", color: activeTab === tab ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>
                    {tab === "activities" ? <span className="flex items-center gap-1"><Activity className="w-3 h-3" />Activities</span>
                     : tab === "flags" ? <span className="flex items-center gap-1"><Flag className="w-3 h-3" />Flags</span>
                     : "Overview"}
                  </button>
                ))}
              </div>

              {/* Overview tab */}
              {activeTab === "overview" && (
                <div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-foreground)" }}>{detail.description}</p>
                  {[
                    { label: "Mutual Value", content: detail.mutualValue },
                    { label: "Deal Economics", content: detail.dealEconomics },
                    { label: "Kill Criteria", content: detail.killCriteria },
                    { label: "Next Action", content: detail.nextAction },
                    { label: "Estimated ARR Impact", content: detail.estimatedArrImpact },
                  ].filter(f => f.content).map(({ label, content }) => (
                    <div key={label} className="p-3 rounded-lg border mb-3" style={{ background: "var(--color-muted)", borderColor: "var(--color-border)" }}>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-muted-foreground)" }}>{label}</div>
                      <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{content}</p>
                    </div>
                  ))}
                  {detail.executives && detail.executives.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Key Executives</div>
                      {detail.executives.map((e: any) => (
                        <div key={e.id} className="p-3 rounded-lg border mb-2" style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}>
                          <div className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{e.name} — {e.title}</div>
                          {e.linkedinUrl && <a href={e.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--color-primary)" }}>LinkedIn →</a>}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Interconnectivity — linked knowledge/press items */}
                  <div className="mt-5 p-4 rounded-xl border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-3.5 h-3.5" style={{ color: "var(--color-muted-foreground)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>Connected Sources</span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      Log activities with linked knowledge items, press mentions, or pharma signals to build a connected intelligence graph for this partner.
                    </p>
                  </div>
                </div>
              )}

              {/* Activities tab */}
              {activeTab === "activities" && <ActivityLog partnerId={detail.id} />}

              {/* Flags tab */}
              {activeTab === "flags" && <FlagsPanel partnerId={detail.id} />}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
