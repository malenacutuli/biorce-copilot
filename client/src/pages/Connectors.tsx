import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plug, Plus, Trash2, X, Check, AlertCircle } from "lucide-react";

const CONNECTOR_TYPES = [
  { id: "slack", label: "Slack", description: "Sync messages, channels, and mentions from Slack workspaces", color: "oklch(0.65 0.18 280)", icon: "💬" },
  { id: "google_docs", label: "Google Docs", description: "Import documents, meeting notes, and strategy docs from Google Drive", color: "oklch(0.65 0.18 200)", icon: "📄" },
  { id: "notion", label: "Notion", description: "Sync pages, databases, and wikis from Notion workspaces", color: "oklch(0.6 0.02 240)", icon: "📝" },
  { id: "webhook", label: "Webhook", description: "Receive data from any external service via HTTP webhook", color: "oklch(0.65 0.18 145)", icon: "🔗" },
  { id: "email", label: "Email", description: "Parse inbound emails and load them into the knowledge base", color: "oklch(0.65 0.18 60)", icon: "✉️" },
] as const;

type ConnectorType = "slack" | "google_docs" | "notion" | "email" | "webhook";

const statusColor: Record<string, string> = {
  true: "oklch(0.65 0.18 145)",
  false: "oklch(0.5 0.05 240)",
};

function AddConnectorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<"pick" | "config">("pick");
  const [selectedType, setSelectedType] = useState<ConnectorType | null>(null);
  const [form, setForm] = useState({ displayName: "", webhookUrl: "", apiToken: "", workspaceId: "" });
  const upsert = trpc.connectors.upsert.useMutation({
    onSuccess: () => { toast.success("Connector added"); onSuccess(); onClose(); },
    onError: (e: any) => toast.error("Failed: " + e.message),
  });

  const selected = CONNECTOR_TYPES.find(c => c.id === selectedType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-lg rounded-2xl border p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
            {step === "pick" ? "Add Connector" : `Configure ${selected?.label}`}
          </h2>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: "var(--color-muted-foreground)" }} /></button>
        </div>

        {step === "pick" && (
          <div className="grid grid-cols-2 gap-2">
            {CONNECTOR_TYPES.map(ct => (
              <button key={ct.id} onClick={() => { setSelectedType(ct.id); setForm(f => ({ ...f, displayName: ct.label })); setStep("config"); }}
                className="p-3 rounded-xl border text-left transition-all"
                style={{ borderColor: "var(--color-border)", background: "var(--color-accent)" }}>
                <div className="text-lg mb-1">{ct.icon}</div>
                <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-foreground)" }}>{ct.label}</div>
                <div className="text-xs leading-tight" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{ct.description}</div>
              </button>
            ))}
          </div>
        )}

        {step === "config" && selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: "var(--color-accent)" }}>
              <span className="text-2xl">{selected.icon}</span>
              <div>
                <div className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>{selected.label}</div>
                <div className="text-xs" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{selected.description}</div>
              </div>
            </div>
            {[
              { label: "Connection Name", key: "displayName" },
              { label: selected.id === "slack" ? "Slack Webhook URL" : selected.id === "notion" ? "Notion Integration Token" : selected.id === "google_docs" ? "Service Account JSON" : "Webhook URL / Endpoint", key: "webhookUrl" },
              { label: "API Key / Token", key: "apiToken" },
              { label: "Workspace / Channel ID (optional)", key: "workspaceId" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
              </div>
            ))}
            <div className="p-3 rounded-lg border" style={{ background: "oklch(0.65 0.18 60 / 0.08)", borderColor: "oklch(0.65 0.18 60 / 0.3)" }}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.65 0.18 60)" }} />
                <p className="text-xs" style={{ color: "var(--color-foreground)" }}>
                  Credentials are stored securely. No data is sent to AI models without your explicit action. You can revoke access at any time.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep("pick")} className="flex-1 py-2 rounded-lg text-xs border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>Back</button>
              <button
                onClick={() => selectedType && form.displayName.trim() && upsert.mutate({ connectorType: selectedType, displayName: form.displayName, webhookUrl: form.webhookUrl || undefined, apiToken: form.apiToken || undefined, workspaceId: form.workspaceId || undefined })}
                disabled={upsert.isPending}
                className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
                {upsert.isPending ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Connectors() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: connectors, isLoading, refetch } = trpc.connectors.list.useQuery();
  const toggle = trpc.connectors.toggle.useMutation({
    onSuccess: () => { refetch(); toast.success("Status updated"); },
  });

  return (
    <AppLayout>
      {showAdd && <AddConnectorModal onClose={() => setShowAdd(false)} onSuccess={refetch} />}
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>Connectors</h1>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Connect external data sources to keep the Biorce Brain up to date automatically.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
            <Plus className="w-3.5 h-3.5" /> Add Connector
          </button>
        </div>

        {/* Available connectors grid */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-muted-foreground)" }}>Available Integrations</div>
          <div className="grid grid-cols-3 gap-3">
            {CONNECTOR_TYPES.map(ct => {
              const connected = connectors?.filter((c: any) => c.connectorType === ct.id) ?? [];
              return (
                <div key={ct.id} className="p-4 rounded-xl border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xl">{ct.icon}</span>
                    {connected.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.65 0.18 145 / 0.15)", color: "oklch(0.65 0.18 145)", fontSize: "10px" }}>
                        {connected.length} connected
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>{ct.label}</div>
                  <div className="text-xs leading-tight" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{ct.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active connectors */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-muted-foreground)" }}>Active Connections ({connectors?.length ?? 0})</div>
          {isLoading && <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Loading...</div>}
          {(!connectors || connectors.length === 0) && !isLoading && (
            <div className="p-8 rounded-xl border text-center" style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}>
              <Plug className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-xs mb-1" style={{ color: "var(--color-foreground)" }}>No connectors yet</p>
              <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Add a connector to automatically sync data from Slack, Google Docs, or Notion.</p>
            </div>
          )}
          <div className="space-y-2">
            {connectors?.map((c: any) => {
              const ct = CONNECTOR_TYPES.find(t => t.id === c.connectorType);
              return (
                <div key={c.id} className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                  <span className="text-lg">{ct?.icon ?? "🔌"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>{c.displayName ?? ct?.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: (c.isEnabled ? "oklch(0.65 0.18 145)" : "oklch(0.5 0.05 240)") + "22", color: c.isEnabled ? "oklch(0.65 0.18 145)" : "oklch(0.5 0.05 240)", fontSize: "10px" }}>
                        {c.isEnabled ? "active" : "paused"}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>
                      {ct?.label} · Added {new Date(c.createdAt).toLocaleDateString()}
                      {c.lastSyncAt && ` · Last sync: ${new Date(c.lastSyncAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <button onClick={() => toggle.mutate({ id: c.id, isEnabled: !c.isEnabled })}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                    style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>
                    {c.isEnabled ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    {c.isEnabled ? "Pause" : "Enable"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
