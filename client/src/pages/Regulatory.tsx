import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Clock, ExternalLink, Scale } from "lucide-react";
import { useState } from "react";

const BODIES = ["all", "FDA_DHCOE", "ICH_M11", "CDISC_USDM", "EU_AI_ACT", "EMA_ITF", "MHRA"];

export default function Regulatory() {
  const [body, setBody] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const { data: items, isLoading } = trpc.regulatory.list.useQuery({ body: body === "all" ? undefined : body, limit: 100 });

  const daysUntil = (deadline: string | null) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return diff;
  };

  return (
    <AppLayout>
      <div className="flex h-full">
        <div className="w-96 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--color-border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h1 className="text-base font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>Regulatory Tracker</h1>
            <div className="flex gap-1 flex-wrap">
              {BODIES.map(b => (
                <button key={b} onClick={() => setBody(b)}
                  className="px-2 py-1 rounded text-xs transition-all"
                  style={{ background: body === b ? "var(--color-primary)" : "var(--color-accent)", color: body === b ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)" }}>
                  {b === "all" ? "All" : b.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <div className="p-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Loading...</div>}
            {items?.map(item => {
              const days = daysUntil(item.deadline as string | null);
              const isUrgent = days !== null && days <= 30;
              return (
                <div key={item.id} onClick={() => setSelected(item)}
                  className="p-4 border-b cursor-pointer transition-all"
                  style={{ borderColor: "var(--color-border)", background: selected?.id === item.id ? "var(--color-accent)" : "transparent" }}
                  onMouseEnter={e => { if (selected?.id !== item.id) (e.currentTarget as HTMLElement).style.background = "var(--color-muted)"; }}
                  onMouseLeave={e => { if (selected?.id !== item.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium leading-tight" style={{ color: "var(--color-foreground)" }}>{item.title.slice(0, 60)}...</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 badge-${item.impactLevel}`}>{item.impactLevel}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-data" style={{ color: "var(--color-muted-foreground)" }}>{item.body}</span>
                    {days !== null && (
                      <span className="text-xs flex items-center gap-1" style={{ color: isUrgent ? "var(--color-critical)" : "var(--color-muted-foreground)" }}>
                        <Clock className="w-3 h-3" />{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Scale className="w-10 h-10" style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Select a regulatory item to view details</p>
            </div>
          )}
          {selected && (
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold leading-tight" style={{ color: "var(--color-foreground)" }}>{selected.title}</h2>
                <span className={`text-xs px-2 py-1 rounded flex-shrink-0 badge-${selected.impactLevel}`}>{selected.impactLevel}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs px-2 py-1 rounded font-data" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{selected.body}</span>
                <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{selected.type}</span>
                {selected.deadline && <span className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "var(--color-destructive)", color: "white" }}><Clock className="w-3 h-3" />Deadline: {new Date(selected.deadline).toLocaleDateString()}</span>}
                {selected.sourceUrl && <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}><ExternalLink className="w-3 h-3" />Source</a>}
              </div>
              <div className="p-4 rounded-lg border mb-4" style={{ background: "var(--color-muted)", borderColor: "var(--color-border)" }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Description</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>{selected.description}</p>
              </div>
              {selected.biorceRelevance && (
                <div className="p-4 rounded-lg border" style={{ background: "oklch(0.65 0.18 200 / 0.05)", borderColor: "oklch(0.65 0.18 200 / 0.3)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-primary)" }}>Biorce Relevance</div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>{selected.biorceRelevance}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

