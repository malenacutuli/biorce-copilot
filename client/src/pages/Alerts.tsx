import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";

export default function Alerts() {
  const { data: alerts, isLoading, refetch } = trpc.alerts.list.useQuery({ limit: 100 });
  const markRead = trpc.alerts.markRead.useMutation({ onSuccess: () => { refetch(); } });

  const grouped = alerts?.reduce((acc: Record<string, typeof alerts>, a) => {
    if (!acc[a.type]) acc[a.type] = [];
    acc[a.type].push(a);
    return acc;
  }, {}) ?? {};

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Alerts & Digests</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>Proactive intelligence updates — regulatory, competitive, and partnership</p>
          </div>
          <button onClick={() => { alerts?.filter(a => !a.isRead).forEach(a => markRead.mutate({ id: a.id })); toast.success("All marked as read"); }}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all" style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
            Mark all read
          </button>
        </div>
        {isLoading && <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Loading...</div>}
        {Object.entries(grouped).map(([type, typeAlerts]) => (
          <div key={type} className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-muted-foreground)" }}>{type.replace(/_/g, " ")}</div>
            <div className="space-y-2">
              {typeAlerts.map((a: any) => (
                <div key={a.id} className="p-4 rounded-xl border transition-all" style={{ background: a.isRead ? "var(--color-card)" : "var(--color-card)", borderColor: a.isRead ? "var(--color-border)" : "oklch(0.65 0.18 200 / 0.3)", opacity: a.isRead ? 0.7 : 1 }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!a.isRead && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--color-primary)" }} />}
                        <span className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>{a.title}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded badge-${a.severity}`}>{a.severity}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>{a.body}</p>
                    </div>
                    {!a.isRead && (
                      <button onClick={() => markRead.mutate({ id: a.id })}
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: "var(--color-accent)" }}>
                        <Check className="w-3 h-3" style={{ color: "var(--color-muted-foreground)" }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {(!alerts || alerts.length === 0) && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Bell className="w-10 h-10" style={{ color: "var(--color-muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No alerts yet</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

