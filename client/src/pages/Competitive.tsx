import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { ExternalLink, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function Competitive() {
  const [selectedCompetitor, setSelectedCompetitor] = useState<number | null>(null);
  const { data: competitors } = trpc.competitive.competitors.useQuery();
  const { data: events } = trpc.competitive.events.useQuery({ competitorId: selectedCompetitor ?? undefined, limit: 50 });

  const threatColor = (level: string) => {
    if (level === "critical") return "var(--color-critical)";
    if (level === "high") return "var(--color-high)";
    if (level === "medium") return "var(--color-medium)";
    return "var(--color-low)";
  };

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-base font-semibold mb-6" style={{ color: "var(--color-foreground)" }}>Competitive Intelligence</h1>
        {/* Competitor cards */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {competitors?.map(c => (
            <div key={c.id} onClick={() => setSelectedCompetitor(selectedCompetitor === c.id ? null : c.id)}
              className="p-4 rounded-xl border cursor-pointer transition-all"
              style={{ background: selectedCompetitor === c.id ? "var(--color-accent)" : "var(--color-card)", borderColor: selectedCompetitor === c.id ? threatColor(c.threatLevel ?? "low") : "var(--color-border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>{c.name}</span>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: threatColor(c.threatLevel ?? "low") }} />
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded badge-${c.threatLevel ?? "low"}`}>{c.threatLevel}</span>
              <div className="text-xs mt-2" style={{ color: "var(--color-muted-foreground)" }}>{c.category}</div>
            </div>
          ))}
        </div>

        {/* Selected competitor detail */}
        {selectedCompetitor && competitors && (
          <div className="mb-6 p-5 rounded-xl border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            {competitors.filter(c => c.id === selectedCompetitor).map(c => (
              <div key={c.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>{c.name}</h2>
                    {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--color-primary)" }}><ExternalLink className="w-3 h-3" />{c.website}</a>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Funding</div>
                    <div className="text-sm font-semibold font-data" style={{ color: "var(--color-foreground)" }}>{c.fundingTotal ?? "Unknown"}</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-foreground)" }}>{c.description}</p>
                {c.notes && (
                  <div className="p-3 rounded-lg border" style={{ background: "oklch(0.65 0.18 200 / 0.05)", borderColor: "oklch(0.65 0.18 200 / 0.3)" }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-primary)" }}>Biorce Strategic Notes</div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>{c.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Events */}
        <div className="rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            {selectedCompetitor ? "Events for selected competitor" : "All competitive events"}
          </h2>
          {events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map(e => (
                <div key={e.id} className="p-3 rounded-lg border" style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{e.title}</span>
                    <span className="text-xs font-data px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{e.type}</span>
                  </div>
                  {e.summary && <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>{e.summary}</p>}
                  {e.biorceImplication && <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-primary)" }}>→ {e.biorceImplication}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>No competitive events recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
