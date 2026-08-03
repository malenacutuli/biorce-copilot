import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Shield, TrendingUp, Users, Brain } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/");
  }, [loading, isAuthenticated]);

  return (
    <div className="min-h-screen flex" style={{ background: "#080808" }}>
      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-12 py-16">
        <div className="max-w-md">
          {/* Biorce wordmark */}
          <div className="flex items-center gap-3 mb-12">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
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
                className="text-xl font-semibold tracking-widest uppercase"
                style={{ fontFamily: "var(--font-heading)", color: "#F5F5F5", letterSpacing: "0.15em" }}
              >
                BIORCE
              </div>
              <div className="text-xs" style={{ color: "#4DD9D5", opacity: 0.8, letterSpacing: "0.05em" }}>
                Strategy Copilot
              </div>
            </div>
          </div>

          <h1
            className="text-3xl font-semibold mb-3 leading-tight"
            style={{ fontFamily: "var(--font-heading)", color: "#F5F5F5" }}
          >
            Intelligence at the<br />speed of strategy.
          </h1>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "#7A7A7A" }}>
            Centralized competitive intelligence, regulatory tracking, and partnership management for Biorce's commercial team.
          </p>

          <button
            onClick={() => startLogin()}
            className="w-full py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
            style={{ background: "#4DD9D5", color: "#080808", fontFamily: "var(--font-heading)" }}
          >
            Sign in with Manus
          </button>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { icon: Shield,    label: "Regulatory Tracker",    desc: "FDA, EMA, EU AI Act deadlines" },
              { icon: TrendingUp, label: "Competitive Intel",    desc: "Faro, Evinova, Medidata" },
              { icon: Users,     label: "Partnership Pipeline",  desc: "50 priority targets" },
              { icon: Brain,     label: "AI Copilot",            desc: "Source-cited intelligence" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="p-3 rounded-lg border card-hover"
                style={{ background: "#111111", borderColor: "#1E1E1E" }}
              >
                <Icon className="w-4 h-4 mb-2" style={{ color: "#4DD9D5" }} />
                <div className="text-xs font-medium mb-0.5" style={{ color: "#F5F5F5" }}>{label}</div>
                <div className="text-xs" style={{ color: "#7A7A7A" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — live intel feed ──────────────────────────── */}
      <div
        className="w-96 border-l flex flex-col justify-center px-10"
        style={{ background: "#0A0A0A", borderColor: "#1E1E1E" }}
      >
        {/* Subtle teal top accent line */}
        <div
          className="absolute top-0 right-0 w-96 h-0.5"
          style={{ background: "linear-gradient(90deg, transparent, #4DD9D5 50%, transparent)" }}
        />

        <div className="space-y-3">
          <div
            className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: "#4DD9D5", opacity: 0.7, fontSize: "10px" }}
          >
            Live Intelligence Feed
          </div>

          {[
            { label: "EU AI Act Enforcement",       status: "CRITICAL",     detail: "August 2, 2026 deadline",         color: "oklch(0.60 0.22 25)" },
            { label: "Eli Lilly 30x30 Initiative",  status: "OPPORTUNITY",  detail: "30 protocols needed by 2030",     color: "oklch(0.72 0.18 145)" },
            { label: "Faro Health — BMS Partnership", status: "MONITOR",    detail: "Q3 2026 expansion expected",      color: "oklch(0.72 0.18 55)" },
            { label: "ICH M11 Compliance",           status: "ACTIVE",      detail: "First-mover advantage confirmed", color: "#4DD9D5" },
          ].map(({ label, status, detail, color }) => (
            <div
              key={label}
              className="p-3 rounded-lg border card-hover"
              style={{ background: "#111111", borderColor: "#1E1E1E" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: "#F5F5F5" }}>{label}</span>
                <span
                  className="text-xs font-data px-1.5 py-0.5 rounded"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}44`, fontSize: "10px" }}
                >
                  {status}
                </span>
              </div>
              <div className="text-xs" style={{ color: "#7A7A7A" }}>{detail}</div>
            </div>
          ))}

          {/* Biorce branding footer */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: "#1E1E1E" }}>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="8"  r="4"   fill="#4DD9D5" opacity="0.9"/>
                <circle cx="31" cy="14" r="3"   fill="#4DD9D5" opacity="0.7"/>
                <circle cx="31" cy="26" r="3.5" fill="#4DD9D5" opacity="0.8"/>
                <circle cx="20" cy="32" r="3"   fill="#4DD9D5" opacity="0.6"/>
                <circle cx="9"  cy="26" r="3.5" fill="#4DD9D5" opacity="0.85"/>
                <circle cx="9"  cy="14" r="3"   fill="#4DD9D5" opacity="0.65"/>
                <circle cx="20" cy="20" r="4.5" fill="#4DD9D5"/>
              </svg>
              <span className="text-xs" style={{ color: "#7A7A7A" }}>
                Biorce Copilot · Internal Use Only
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
