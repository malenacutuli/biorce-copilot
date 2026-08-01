import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Bell, Check, ExternalLink, AlertTriangle, TrendingUp, Scale, Users, Zap } from "lucide-react";
import { toast } from "sonner";

const typeIcon: Record<string, any> = {
  regulatory: Scale, competitive: TrendingUp, partnership: Users, discrepancy: AlertTriangle, digest: Bell,
};
const typeColor: Record<string, string> = {
  regulatory: "oklch(0.65 0.18 270)", competitive: "oklch(0.65 0.18 200)", partnership: "oklch(0.65 0.18 145)",
  discrepancy: "oklch(0.65 0.2 25)", digest: "oklch(0.65 0.18 60)",
};

export default function Alerts() {
  const { data: alerts, isLoading, refetch } = trpc.alerts.list.useQuery({ limit: 100 });
  const markRead = trpc.alerts.markRead.useMutation({ onSuccess: () => refetch() });

  const grouped = alerts?.reduce((acc: Record<string, typeof alerts>, a) => {
    if (!acc[a.type]) acc[a.type] = [];
    acc[a.type].push(a);
    return acc;
  }, {}) ?? {};

  const unreadCount = alerts?.filter((a: any) => !a.isRead).length ?? 0;

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Alerts & Digests</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              Proactive intelligence updates — regulatory, competitive, and partnership
              {unreadCount > 0 && <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>{unreadCount} unread</span>}
            </p>
          </div>
          <button
            onClick={() => { alerts?.filter((a: any) => !a.isRead).forEach((a: any) => markRead.mutate({ id: a.id })); toast.success("All marked as read"); }}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
            Mark all read
          </button>
        </div>

        {isLoading && <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Loading...</div>}

        {Object.entries(grouped).map(([type, typeAlerts]) => {
          const Icon = typeIcon[type] ?? Bell;
          const color = typeColor[type] ?? "var(--color-muted-foreground)";
          return (
            <div key={type} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>{type.replace(/_/g, " ")}</div>
                <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{(typeAlerts as any[]).length}</span>
              </div>
              <div className="space-y-2">
                {(typeAlerts as any[]).map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border transition-all"
                    style={{ background: "var(--color-card)", borderColor: !a.isRead ? color + "44" : "var(--color-border)", opacity: a.isRead ? 0.7 : 1 }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {!a.isRead && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />}
                          <span className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>{a.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded badge-${a.severity}`}>{a.severity}</span>
                          {a.publishedAt && (
                            <span className="text-xs ml-auto" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>
                              {new Date(a.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--color-muted-foreground)" }}>{a.body}</p>
                        {/* Biorce implication */}
                        {a.biorceImplication && (
                          <div className="p-2.5 rounded-lg mb-2" style={{ background: color + "11", border: `1px solid ${color}33` }}>
                            <div className="text-xs font-semibold mb-0.5" style={{ color }}>Biorce Implication</div>
                            <p className="text-xs" style={{ color: "var(--color-foreground)" }}>{a.biorceImplication}</p>
                          </div>
                        )}
                        {/* Full source link — always shown, never fabricated */}
                        {a.sourceUrl ? (
                          <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                            style={{ background: "var(--color-accent)", color: "var(--color-foreground)" }}>
                            <ExternalLink className="w-3 h-3" />
                            Open Full Source
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
                            style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>
                            No source URL — add one to verify
                          </span>
                        )}
                      </div>
                      {!a.isRead && (
                        <button onClick={() => markRead.mutate({ id: a.id })}
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ background: "var(--color-accent)" }}>
                          <Check className="w-3.5 h-3.5" style={{ color: "var(--color-muted-foreground)" }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

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
