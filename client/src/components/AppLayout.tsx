import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, Bell, BookOpen, Brain, FileText, Home,
  Network, Scale, Settings, TrendingUp, Users,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/copilot", icon: Brain, label: "AI Copilot" },
  { href: "/knowledge", icon: BookOpen, label: "Knowledge Base" },
  { href: "/regulatory", icon: Scale, label: "Regulatory Tracker" },
  { href: "/competitive", icon: TrendingUp, label: "Competitive Intel" },
  { href: "/partnerships", icon: Users, label: "Partnership Pipeline" },
  { href: "/discrepancies", icon: AlertTriangle, label: "Discrepancy Detector" },
  { href: "/alerts", icon: Bell, label: "Alerts & Digests" },
  { href: "/graph", icon: Network, label: "Knowledge Graph" },
  { href: "/board-memo", icon: FileText, label: "Board Memo Export" },
  { href: "/admin", icon: Settings, label: "Admin Panel" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();
  const { data: alertCount } = trpc.alerts.countUnread.useQuery(undefined, { enabled: isAuthenticated });
  const { data: discrepancyCount } = trpc.discrepancies.countOpen.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Loading Biorce Copilot...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-background)" }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
              <Brain className="w-4 h-4" style={{ color: "var(--color-primary-foreground)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight" style={{ color: "var(--color-foreground)" }}>Biorce Copilot</div>
              <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Strategy Intelligence</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = location === href || (href !== "/" && location.startsWith(href));
            const badge = label === "Alerts & Digests" ? alertCount : label === "Discrepancy Detector" ? discrepancyCount : null;
            return (
              <Link key={href} href={href}>
                <div
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 cursor-pointer transition-all duration-150 ${isActive ? "nav-active" : ""}`}
                  style={isActive ? {} : { color: "var(--color-muted-foreground)" }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)"; (e.currentTarget as HTMLElement).style.background = "var(--color-accent)"; }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)"; (e.currentTarget as HTMLElement).style.background = ""; } }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{label}</span>
                  {badge != null && Number(badge) > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-data" style={{ background: label === "Discrepancy Detector" ? "var(--color-destructive)" : "var(--color-primary)", color: label === "Discrepancy Detector" ? "white" : "var(--color-primary-foreground)", fontSize: "10px" }}>
                      {badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md" style={{ background: "var(--color-accent)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "var(--color-foreground)" }}>{user?.name ?? "User"}</div>
              <div className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>{user?.role ?? "user"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
