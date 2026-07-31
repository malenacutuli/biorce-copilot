import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Brain, Shield, TrendingUp, Users } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/");
  }, [loading, isAuthenticated]);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-background)" }}>
      {/* Left panel */}
      <div className="flex-1 flex flex-col justify-center px-12 py-16">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
              <Brain className="w-6 h-6" style={{ color: "var(--color-primary-foreground)" }} />
            </div>
            <div>
              <div className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>Biorce Strategy Copilot</div>
              <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Executive Intelligence Platform</div>
            </div>
          </div>

          <h1 className="text-3xl font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>
            Intelligence at the<br />speed of strategy.
          </h1>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
            Centralized competitive intelligence, regulatory tracking, and partnership management for Biorce's commercial team.
          </p>

          <button
            onClick={() => startLogin()}
            className="w-full py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
            style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
          >
            Sign in with Manus
          </button>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: "Regulatory Tracker", desc: "FDA, EMA, EU AI Act deadlines" },
              { icon: TrendingUp, label: "Competitive Intel", desc: "Faro, Evinova, Medidata" },
              { icon: Users, label: "Partnership Pipeline", desc: "50 priority targets" },
              { icon: Brain, label: "AI Copilot", desc: "Source-cited intelligence" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-3 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <Icon className="w-4 h-4 mb-2" style={{ color: "var(--color-primary)" }} />
                <div className="text-xs font-medium mb-0.5" style={{ color: "var(--color-foreground)" }}>{label}</div>
                <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-96 border-l flex flex-col justify-center px-10" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-muted-foreground)" }}>Live Intelligence</div>
          {[
            { label: "EU AI Act Enforcement", status: "CRITICAL", detail: "August 2, 2026 deadline", color: "var(--color-critical)" },
            { label: "Eli Lilly 30x30 Initiative", status: "OPPORTUNITY", detail: "30 protocols needed by 2030", color: "var(--color-success)" },
            { label: "Faro Health — BMS Partnership", status: "MONITOR", detail: "Q3 2026 expansion expected", color: "var(--color-high)" },
            { label: "ICH M11 Compliance", status: "ACTIVE", detail: "First-mover advantage confirmed", color: "var(--color-primary)" },
          ].map(({ label, status, detail, color }) => (
            <div key={label} className="p-3 rounded-lg border" style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{label}</span>
                <span className="text-xs font-data px-1.5 py-0.5 rounded" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>{status}</span>
              </div>
              <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

