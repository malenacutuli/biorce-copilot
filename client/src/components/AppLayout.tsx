import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, Brain, BookOpen, AlertTriangle, GitCompare,
  Handshake, Newspaper, Video, Plug, Settings, LogOut,
  ChevronRight
} from "lucide-react";

const navSections = [
  {
    label: "Intelligence",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/knowledge", icon: BookOpen, label: "Knowledge Base" },
      { href: "/discrepancies", icon: GitCompare, label: "Discrepancy Detector" },
      { href: "/alerts", icon: AlertTriangle, label: "Alerts & Digests" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/media", icon: Video, label: "Media Library" },
      { href: "/press", icon: Newspaper, label: "Press Room" },
    ],
  },
  {
    label: "Commercial",
    items: [
      { href: "/partnerships", icon: Handshake, label: "Partnership Pipeline" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/copilot", icon: Brain, label: "AI Copilot" },
      { href: "/connectors", icon: Plug, label: "Connectors" },
      { href: "/admin", icon: Settings, label: "Admin Panel" },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { data: alertCount } = trpc.alerts.countUnread.useQuery(undefined, { enabled: isAuthenticated });
  const { data: discrepancyCount } = trpc.discrepancies.countOpen.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          {/* Biorce logo mark — teal molecular dots */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="animate-pulse">
            <circle cx="20" cy="8"  r="4" fill="#4DD9D5" opacity="0.9"/>
            <circle cx="32" cy="14" r="3" fill="#4DD9D5" opacity="0.7"/>
            <circle cx="32" cy="26" r="4" fill="#4DD9D5" opacity="0.8"/>
            <circle cx="20" cy="32" r="3" fill="#4DD9D5" opacity="0.6"/>
            <circle cx="8"  cy="26" r="4" fill="#4DD9D5" opacity="0.9"/>
            <circle cx="8"  cy="14" r="3" fill="#4DD9D5" opacity="0.7"/>
            <circle cx="20" cy="20" r="5" fill="#4DD9D5"/>
          </svg>
          <span className="text-sm text-muted-foreground tracking-wide">Loading Biorce Copilot…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ background: "var(--color-sidebar)", borderColor: "var(--color-sidebar-border)" }}
      >
        {/* Logo header */}
        <div
          className="px-4 py-4 border-b flex items-center gap-3"
          style={{ borderColor: "var(--color-sidebar-border)" }}
        >
          {/* Biorce SVG logo mark */}
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none" className="flex-shrink-0">
            <circle cx="20" cy="8"  r="4"   fill="#4DD9D5" opacity="0.95"/>
            <circle cx="31" cy="14" r="3"   fill="#4DD9D5" opacity="0.75"/>
            <circle cx="31" cy="26" r="3.5" fill="#4DD9D5" opacity="0.85"/>
            <circle cx="20" cy="32" r="3"   fill="#4DD9D5" opacity="0.65"/>
            <circle cx="9"  cy="26" r="3.5" fill="#4DD9D5" opacity="0.90"/>
            <circle cx="9"  cy="14" r="3"   fill="#4DD9D5" opacity="0.70"/>
            <circle cx="20" cy="20" r="4.5" fill="#4DD9D5"/>
          </svg>
          <div>
            <div
              className="text-sm font-semibold tracking-widest uppercase leading-tight"
              style={{ fontFamily: "var(--font-heading)", color: "#F5F5F5", letterSpacing: "0.12em" }}
            >
              BIORCE
            </div>
            <div className="text-xs" style={{ color: "var(--color-sidebar-foreground)", opacity: 0.6 }}>
              Copilot
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <div
                className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-sidebar-foreground)", opacity: 0.4, fontSize: "10px" }}
              >
                {section.label}
              </div>
              {section.items.map(({ href, icon: Icon, label }) => {
                const isActive = location === href || (href !== "/" && location.startsWith(href));
                const badge =
                  label === "Alerts & Digests" ? alertCount :
                  label === "Discrepancy Detector" ? discrepancyCount : null;

                return (
                  <Link key={href} href={href}>
                    <div
                      className={`group flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 cursor-pointer transition-all duration-150 ${
                        isActive
                          ? "nav-active"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                      style={
                        isActive
                          ? {}
                          : { color: "var(--color-sidebar-foreground)" }
                      }
                    >
                      <Icon
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={isActive ? { color: "#4DD9D5" } : {}}
                      />
                      <span className="text-xs font-medium flex-1 leading-none">{label}</span>
                      {badge != null && Number(badge) > 0 && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-data"
                          style={{
                            background:
                              label === "Discrepancy Detector"
                                ? "oklch(0.60 0.22 25 / 0.25)"
                                : "oklch(0.82 0.12 186 / 0.20)",
                            color:
                              label === "Discrepancy Detector"
                                ? "oklch(0.78 0.18 25)"
                                : "#4DD9D5",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div
          className="px-3 py-3 border-t"
          style={{ borderColor: "var(--color-sidebar-border)" }}
        >
          <div
            className="flex items-center gap-2.5 px-2 py-2 rounded-md"
            style={{ background: "oklch(0.10 0.000 0)" }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "#4DD9D5", color: "#080808" }}
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? "B"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate text-foreground">{user?.name ?? "User"}</div>
              <div className="text-xs truncate" style={{ color: "var(--color-sidebar-foreground)", opacity: 0.5 }}>
                {user?.role ?? "user"}
              </div>
            </div>
            <button
              onClick={() => logout?.()}
              className="opacity-40 hover:opacity-80 transition-opacity"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" style={{ color: "var(--color-sidebar-foreground)" }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
