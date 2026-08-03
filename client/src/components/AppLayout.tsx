import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, Brain, BookOpen, AlertTriangle, GitCompare,
  Handshake, Newspaper, Video, Plug, Settings, LogOut
} from "lucide-react";

const navSections = [
  {
    label: "Intelligence",
    items: [
      { href: "/",             icon: LayoutDashboard, label: "Dashboard" },
      { href: "/knowledge",    icon: BookOpen,        label: "Knowledge Base" },
      { href: "/discrepancies",icon: GitCompare,      label: "Discrepancy Detector" },
      { href: "/alerts",       icon: AlertTriangle,   label: "Alerts & Digests" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/media", icon: Video,     label: "Media Library" },
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
      { href: "/copilot",    icon: Brain,    label: "AI Copilot" },
      { href: "/connectors", icon: Plug,     label: "Connectors" },
      { href: "/admin",      icon: Settings, label: "Admin Panel" },
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="flex flex-col items-center gap-4">
          <img
            src="/manus-storage/biorce-logo_89f0f98d.jpg"
            alt="Biorce"
            className="h-8 opacity-60 animate-pulse"
            style={{ objectFit: "contain" }}
          />
          <span className="text-xs" style={{ color: "#7A7A7A", fontFamily: "var(--font-sans)" }}>
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080808" }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ background: "#0A0A0A", borderColor: "#1A1A1A" }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "#1A1A1A" }}>
          <img
            src="/manus-storage/biorce-logo_89f0f98d.jpg"
            alt="Biorce"
            className="h-6"
            style={{ objectFit: "contain", objectPosition: "left" }}
          />
          <div
            className="mt-1 text-xs"
            style={{ color: "#4DD9D5", opacity: 0.7, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}
          >
            Copilot
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <div
                className="px-3 mb-1 uppercase tracking-widest"
                style={{ color: "#4A4A4A", fontSize: "9px", fontFamily: "var(--font-mono)", fontWeight: 500 }}
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
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 cursor-pointer transition-all duration-150 ${
                        isActive ? "nav-active" : ""
                      }`}
                      style={isActive ? {} : { color: "#888888" }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.color = "#F5F5F5";
                          (e.currentTarget as HTMLElement).style.background = "#141414";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.color = "#888888";
                          (e.currentTarget as HTMLElement).style.background = "";
                        }
                      }}
                    >
                      <Icon
                        className="w-3.5 h-3.5 flex-shrink-0"
                        strokeWidth={1.5}
                        style={isActive ? { color: "#4DD9D5" } : {}}
                      />
                      <span
                        className="text-xs flex-1 leading-none"
                        style={{ fontFamily: "var(--font-sans)", fontWeight: isActive ? 500 : 400 }}
                      >
                        {label}
                      </span>
                      {badge != null && Number(badge) > 0 && (
                        <span
                          style={{
                            background: label === "Discrepancy Detector"
                              ? "oklch(0.60 0.22 25 / 0.2)"
                              : "oklch(0.82 0.12 186 / 0.15)",
                            color: label === "Discrepancy Detector"
                              ? "oklch(0.78 0.18 25)"
                              : "#4DD9D5",
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "1px 5px",
                            borderRadius: "4px",
                            fontFamily: "var(--font-mono)",
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
        <div className="px-3 py-3 border-t" style={{ borderColor: "#1A1A1A" }}>
          <div
            className="flex items-center gap-2.5 px-2 py-2 rounded-md"
            style={{ background: "#111111" }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: "#4DD9D5", color: "#080808", fontFamily: "var(--font-sans)" }}
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? "B"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "#F5F5F5" }}>
                {user?.name ?? "User"}
              </div>
              <div className="truncate" style={{ color: "#555555", fontSize: "10px", fontFamily: "var(--font-mono)" }}>
                {user?.role ?? "user"}
              </div>
            </div>
            <button
              onClick={() => logout?.()}
              className="opacity-40 hover:opacity-80 transition-opacity"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: "#888888" }} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: "#080808" }}>
        {children}
      </main>
    </div>
  );
}
