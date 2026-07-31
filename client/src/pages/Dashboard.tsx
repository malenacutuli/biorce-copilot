import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Bell, BookOpen, Brain, Clock, TrendingUp, Users, Zap } from "lucide-react";
import { Link } from "wouter";

function KpiCard({ title, value, subtitle, icon: Icon, color, href }: { title: string; value: string | number; subtitle: string; icon: React.ElementType; color: string; href?: string }) {
  const content = (
    <div className="p-5 rounded-xl border transition-all duration-150 cursor-pointer" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>{title}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}1a` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-semibold mb-1 font-data" style={{ color: "var(--color-foreground)" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{subtitle}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function Dashboard() {
  const { data: kpis, isLoading } = trpc.dashboard.kpis.useQuery();
  const { data: alerts } = trpc.alerts.list.useQuery({ isRead: false, limit: 5 });
  const { data: discrepancies } = trpc.discrepancies.list.useQuery({ status: "open", limit: 5 });
  const { data: regulatoryItems } = trpc.regulatory.list.useQuery({ status: "active", impactLevel: "critical", limit: 3 });

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>Strategy Dashboard</h1>
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Biorce executive intelligence — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <KpiCard title="Knowledge Items" value={isLoading ? "—" : kpis?.knowledgeCount ?? 0} subtitle="Verified intelligence records" icon={BookOpen} color="var(--color-primary)" href="/knowledge" />
          <KpiCard title="Open Discrepancies" value={isLoading ? "—" : kpis?.openDiscrepancies ?? 0} subtitle="Flags requiring review" icon={AlertTriangle} color="var(--color-critical)" href="/discrepancies" />
          <KpiCard title="Unread Alerts" value={isLoading ? "—" : kpis?.unreadAlerts ?? 0} subtitle="Intelligence updates" icon={Bell} color="var(--color-high)" href="/alerts" />
          <KpiCard title="Pipeline Targets" value={isLoading ? "—" : kpis?.pipelineTotal ?? 0} subtitle="Priority partnerships tracked" icon={Users} color="var(--color-success)" href="/partnerships" />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Critical Regulatory Deadlines */}
          <div className="rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Critical Regulatory</h2>
              <Link href="/regulatory"><span className="text-xs" style={{ color: "var(--color-primary)", cursor: "pointer" }}>View all →</span></Link>
            </div>
            <div className="space-y-3">
              {regulatoryItems?.map(item => (
                <div key={item.id} className="p-3 rounded-lg border" style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium leading-tight" style={{ color: "var(--color-foreground)" }}>{item.title.slice(0, 60)}...</span>
                    <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 badge-critical">{item.impactLevel}</span>
                  </div>
                  <div className="text-xs font-data" style={{ color: "var(--color-muted-foreground)" }}>{item.body}</div>
                  {item.deadline && <div className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--color-critical)" }}><Clock className="w-3 h-3" />{new Date(item.deadline).toLocaleDateString()}</div>}
                </div>
              ))}
              {(!regulatoryItems || regulatoryItems.length === 0) && <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>No critical items</div>}
            </div>
          </div>

          {/* Open Discrepancies */}
          <div className="rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Open Discrepancies</h2>
              <Link href="/discrepancies"><span className="text-xs" style={{ color: "var(--color-primary)", cursor: "pointer" }}>View all →</span></Link>
            </div>
            <div className="space-y-3">
              {discrepancies?.map(d => (
                <div key={d.id} className="p-3 rounded-lg border" style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium leading-tight" style={{ color: "var(--color-foreground)" }}>{d.title.slice(0, 55)}...</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 badge-${d.severity}`}>{d.severity}</span>
                  </div>
                  <div className="text-xs font-data" style={{ color: "var(--color-muted-foreground)" }}>{d.type.replace(/_/g, " ")}</div>
                </div>
              ))}
              {(!discrepancies || discrepancies.length === 0) && <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>No open discrepancies</div>}
            </div>
          </div>

          {/* Unread Alerts */}
          <div className="rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Latest Alerts</h2>
              <Link href="/alerts"><span className="text-xs" style={{ color: "var(--color-primary)", cursor: "pointer" }}>View all →</span></Link>
            </div>
            <div className="space-y-3">
              {alerts?.map(a => (
                <div key={a.id} className="p-3 rounded-lg border" style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium leading-tight" style={{ color: "var(--color-foreground)" }}>{a.title.slice(0, 55)}...</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 badge-${a.severity}`}>{a.severity}</span>
                  </div>
                  <div className="text-xs font-data" style={{ color: "var(--color-muted-foreground)" }}>{a.type}</div>
                </div>
              ))}
              {(!alerts || alerts.length === 0) && <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>No unread alerts</div>}
            </div>
          </div>
        </div>

        {/* Partnership Pipeline Summary */}
        <div className="mt-6 rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Partnership Pipeline</h2>
            <Link href="/partnerships"><span className="text-xs" style={{ color: "var(--color-primary)", cursor: "pointer" }}>View all →</span></Link>
          </div>
          <div className="flex gap-3 flex-wrap">
            {kpis?.stageStats?.map((s: { stage: string; count: number }) => (
              <div key={s.stage} className="px-3 py-2 rounded-lg border" style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}>
                <div className="text-lg font-semibold font-data" style={{ color: "var(--color-foreground)" }}>{s.count}</div>
                <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{s.stage.replace(/_/g, " ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

