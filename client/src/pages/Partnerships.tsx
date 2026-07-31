import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { ExternalLink, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STAGES = ["all", "identified", "researching", "outreach", "intro_meeting", "negotiating", "loi_signed", "active", "closed_won", "closed_lost", "on_hold"];
const TIERS = ["all", "P0", "P1", "P2"];
const TYPES = ["all", "pharma", "cro", "tech", "hospital", "regulator", "standards_body", "investor"];

const stageColor: Record<string, string> = {
  identified: "var(--color-muted-foreground)", researching: "var(--color-medium)", outreach: "var(--color-high)",
  intro_meeting: "var(--color-high)", negotiating: "var(--color-primary)", loi_signed: "var(--color-success)",
  active: "var(--color-success)", closed_won: "var(--color-success)", closed_lost: "var(--color-critical)", on_hold: "var(--color-medium)",
};

export default function Partnerships() {
  const [tier, setTier] = useState("all");
  const [type, setType] = useState("all");
  const [stage, setStage] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);

  const { data: partners, isLoading } = trpc.partnerships.list.useQuery({
    tier: tier === "all" ? undefined : tier,
    type: type === "all" ? undefined : type,
    stage: stage === "all" ? undefined : stage,
    limit: 100,
  });

  const { data: detail } = trpc.partnerships.byId.useQuery({ id: selected! }, { enabled: selected != null });
  const utils = trpc.useUtils();
  const updateStage = trpc.partnerships.updateStage.useMutation({
    onSuccess: () => {
      utils.partnerships.list.invalidate();
      utils.partnerships.byId.invalidate();
      toast.success("Stage updated");
    },
    onError: () => toast.error("Failed to update stage"),
  });

  return (
    <AppLayout>
      <div className="flex h-full">
        <div className="w-80 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--color-border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h1 className="text-base font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>Partnership Pipeline</h1>
            <div className="space-y-2">
              <div className="flex gap-1 flex-wrap">
                {TIERS.map(t => <button key={t} onClick={() => setTier(t)} className="px-2 py-0.5 rounded text-xs transition-all" style={{ background: tier === t ? "var(--color-primary)" : "var(--color-accent)", color: tier === t ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)" }}>{t}</button>)}
              </div>
              <div className="flex gap-1 flex-wrap">
                {TYPES.map(t => <button key={t} onClick={() => setType(t)} className="px-2 py-0.5 rounded text-xs transition-all" style={{ background: type === t ? "var(--color-primary)" : "var(--color-accent)", color: type === t ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)" }}>{t}</button>)}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <div className="p-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Loading...</div>}
            {partners?.map(p => (
              <div key={p.id} onClick={() => setSelected(p.id)}
                className="p-3 border-b cursor-pointer transition-all"
                style={{ borderColor: "var(--color-border)", background: selected === p.id ? "var(--color-accent)" : "transparent" }}
                onMouseEnter={e => { if (selected !== p.id) (e.currentTarget as HTMLElement).style.background = "var(--color-muted)"; }}
                onMouseLeave={e => { if (selected !== p.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{p.name}</span>
                  <span className="text-xs font-data px-1.5 py-0.5 rounded" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{p.tier}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stageColor[p.stage] ?? "var(--color-muted-foreground)" }} />
                  <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{p.stage.replace(/_/g, " ")}</span>
                  <span className="text-xs ml-auto" style={{ color: "var(--color-muted-foreground)" }}>{p.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Users className="w-10 h-10" style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Select a partner to view details</p>
            </div>
          )}
          {detail && (
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>{detail.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
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
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
