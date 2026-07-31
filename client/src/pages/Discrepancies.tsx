import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Discrepancies() {
  const [selected, setSelected] = useState<any>(null);
  const { data: items, isLoading, refetch } = trpc.discrepancies.list.useQuery({ limit: 100 });
  const resolve = trpc.discrepancies.resolve.useMutation({ onSuccess: () => { refetch(); toast.success("Status updated"); } });

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = items ? [...items].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)) : [];

  return (
    <AppLayout>
      <div className="flex h-full">
        <div className="w-96 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--color-border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h1 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Discrepancy Detector</h1>
            <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>Flags contradictions between Biorce's claims, strategy, and external data</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <div className="p-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Loading...</div>}
            {sorted.map(item => (
              <div key={item.id} onClick={() => setSelected(item)}
                className="p-4 border-b cursor-pointer transition-all"
                style={{ borderColor: "var(--color-border)", background: selected?.id === item.id ? "var(--color-accent)" : "transparent" }}
                onMouseEnter={e => { if (selected?.id !== item.id) (e.currentTarget as HTMLElement).style.background = "var(--color-muted)"; }}
                onMouseLeave={e => { if (selected?.id !== item.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium leading-tight" style={{ color: "var(--color-foreground)" }}>{item.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 badge-${item.severity}`}>{item.severity}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-data" style={{ color: "var(--color-muted-foreground)" }}>{item.type.replace(/_/g, " ")}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: item.status === "open" ? "oklch(0.60 0.22 25 / 0.15)" : "var(--color-accent)", color: item.status === "open" ? "oklch(0.75 0.18 25)" : "var(--color-muted-foreground)" }}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <AlertTriangle className="w-10 h-10" style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Select a discrepancy to review</p>
            </div>
          )}
          {selected && (
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold leading-tight" style={{ color: "var(--color-foreground)" }}>{selected.title}</h2>
                <span className={`text-xs px-2 py-1 rounded flex-shrink-0 badge-${selected.severity}`}>{selected.severity}</span>
              </div>
              <div className="flex gap-2 mb-4">
                <span className="text-xs px-2 py-1 rounded font-data" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{selected.type.replace(/_/g, " ")}</span>
                <select value={selected.status} onChange={e => { resolve.mutate({ id: selected.id, status: e.target.value as any }); setSelected({ ...selected, status: e.target.value }); }}
                  className="text-xs px-2 py-1 rounded border outline-none" style={{ background: "var(--color-input)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                  {["open", "investigating", "resolved", "dismissed"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="p-4 rounded-lg border mb-4" style={{ background: "var(--color-muted)", borderColor: "var(--color-border)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>{selected.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border" style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Source A</div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>{selected.sourceA}</p>
                </div>
                <div className="p-3 rounded-lg border" style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Source B</div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>{selected.sourceB}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

