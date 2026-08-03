import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight, BookOpen, Brain, CheckCircle2, Clock, Gavel,
  Target, TrendingUp, XCircle,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

type Room = {
  id: number;
  title: string;
  question: string;
  status: string;
  consensusScore?: number | null;
  executiveDecision?: string | null;
  recommendedAction?: string | null;
  predictedOutcome?: string | null;
  actualOutcome?: string | null;
  outcomeAccuracy?: number | null;
  outcomeRecordedAt?: Date | null;
  createdAt: Date;
};

const ACCURACY_COLOR = (score: number) =>
  score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

export default function OutcomeLearning() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actualOutcome, setActualOutcome] = useState("");
  const [accuracy, setAccuracy] = useState(70);

  const { data: rooms, isLoading, refetch } = trpc.decisionRooms.list.useQuery(
    { limit: 100 }, { enabled: isAuthenticated }
  ) as { data: Room[] | undefined; isLoading: boolean; refetch: () => void };

  const recordOutcomeMut = trpc.outcomeLearning.recordActual.useMutation({
    onSuccess: () => { refetch(); setSelectedId(null); setActualOutcome(""); },
  });

  const decided = rooms?.filter(r => r.executiveDecision && r.executiveDecision !== "more_evidence") ?? [];
  const withOutcome = decided.filter(r => r.actualOutcome);
  const withoutOutcome = decided.filter(r => !r.actualOutcome);
  const avgAccuracy = withOutcome.length > 0
    ? Math.round(withOutcome.reduce((s, r) => s + (r.outcomeAccuracy ?? 0), 0) / withOutcome.length)
    : null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5" style={{ color: "#10b981" }} strokeWidth={1.25} />
              <h1 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>Outcome Learning</h1>
            </div>
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              Compare predicted and actual outcomes to calibrate agent recommendations over time
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/decisions")}>
            <Gavel className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.25} />
            View decision rooms
          </Button>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Decisions made", value: decided.length, icon: Gavel, color: "#6366f1" },
            { label: "Outcomes recorded", value: withOutcome.length, icon: CheckCircle2, color: "#10b981" },
            { label: "Awaiting outcome", value: withoutOutcome.length, icon: Clock, color: "#f59e0b" },
            { label: "Avg accuracy", value: avgAccuracy != null ? `${avgAccuracy}%` : "—", icon: Target, color: "#0ea5e9" },
          ].map(m => (
            <div key={m.label} className="rounded-xl border p-4"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <m.icon className="w-4 h-4" style={{ color: m.color }} strokeWidth={1.25} />
                <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{m.label}</div>
              </div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-foreground)" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Decisions awaiting outcome */}
        {withoutOutcome.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>
              Awaiting outcome ({withoutOutcome.length})
            </div>
            <div className="flex flex-col gap-3">
              {withoutOutcome.map(r => (
                <div key={r.id} className="rounded-xl border p-4"
                  style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: "var(--color-foreground)" }}>{r.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                        Decision: {(r.executiveDecision ?? "").replace(/_/g, " ")} · {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(r.id)}>
                      Record outcome
                    </Button>
                  </div>
                  {r.recommendedAction && (
                    <div className="text-xs rounded-lg p-2.5" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}>
                      <span className="font-medium">Predicted: </span>{r.recommendedAction}
                    </div>
                  )}
                  {selectedId === r.id && (
                    <div className="mt-3 flex flex-col gap-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                      <textarea
                        className="rounded-lg border px-3 py-2 text-sm w-full resize-none"
                        rows={3}
                        placeholder="Describe what actually happened..."
                        style={{ background: "var(--color-muted)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
                        value={actualOutcome}
                        onChange={e => setActualOutcome(e.target.value)}
                      />
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                          Prediction accuracy: {accuracy}%
                        </label>
                        <input type="range" min={0} max={100} value={accuracy}
                          onChange={e => setAccuracy(Number(e.target.value))}
                          className="flex-1" />
                        <span className="text-sm font-bold tabular-nums"
                          style={{ color: ACCURACY_COLOR(accuracy) }}>{accuracy}%</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm"
                          disabled={!actualOutcome.trim() || recordOutcomeMut.isPending}
                          onClick={() => recordOutcomeMut.mutate({
                            id: r.id,
                            actualOutcome,
                            accuracyScore: accuracy,
                            wrongAssumptions: [],
                            correctAssumptions: [],
                            learningNote: "",
                          })}
                          style={{ background: "#10b981", color: "white" }}>
                          {recordOutcomeMut.isPending ? "Saving..." : "Save outcome"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed outcomes */}
        {withOutcome.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>
              Recorded outcomes ({withOutcome.length})
            </div>
            <div className="flex flex-col gap-4">
              {withOutcome.map(r => {
                const acc = r.outcomeAccuracy ?? 0;
                const accColor = ACCURACY_COLOR(acc);
                return (
                  <div key={r.id} className="rounded-xl border p-5"
                    style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>{r.title}</div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="text-lg font-bold tabular-nums" style={{ color: accColor }}>{acc}%</div>
                        <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>accuracy</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg p-3" style={{ background: "var(--color-muted)" }}>
                        <div className="font-semibold mb-1 flex items-center gap-1" style={{ color: "#6366f1" }}>
                          <Brain className="w-3 h-3" strokeWidth={1.25} />Predicted
                        </div>
                        <div style={{ color: "var(--color-foreground)" }}>{r.recommendedAction ?? "No prediction recorded"}</div>
                      </div>
                      <div className="rounded-lg p-3" style={{ background: "var(--color-muted)" }}>
                        <div className="font-semibold mb-1 flex items-center gap-1" style={{ color: "#10b981" }}>
                          <CheckCircle2 className="w-3 h-3" strokeWidth={1.25} />Actual
                        </div>
                        <div style={{ color: "var(--color-foreground)" }}>{r.actualOutcome}</div>
                      </div>
                    </div>
                    {r.outcomeRecordedAt && (
                      <div className="mt-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                        Recorded {new Date(r.outcomeRecordedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border p-5 animate-pulse h-20"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }} />
            ))}
          </div>
        )}

        {!isLoading && decided.length === 0 && (
          <div className="rounded-xl border p-10 text-center"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-muted-foreground)" }} strokeWidth={1.25} />
            <div className="font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>No decisions with outcomes yet</div>
            <div className="text-sm mb-4" style={{ color: "var(--color-muted-foreground)" }}>
              Make executive decisions in the Decision Room to start tracking outcomes and calibrating agent accuracy.
            </div>
            <Button size="sm" onClick={() => navigate("/decisions")} style={{ background: "#6366f1", color: "white" }}>
              <ArrowRight className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.25} />
              Go to Decision Rooms
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
