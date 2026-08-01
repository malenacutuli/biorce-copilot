import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Newspaper, Plus, ExternalLink, Trash2, X, Search, Check } from "lucide-react";

const PRESS_TYPES = ["all", "press_release", "news_mention", "feature", "interview", "op_ed", "award", "other"];
const SENTIMENTS = ["all", "positive", "neutral", "negative", "mixed"];

const sentimentColor: Record<string, string> = {
  positive: "oklch(0.65 0.18 145)",
  neutral: "oklch(0.6 0.05 240)",
  negative: "oklch(0.65 0.2 25)",
  mixed: "oklch(0.65 0.18 60)",
};

const verificationBadge: Record<string, { bg: string; label: string }> = {
  verified: { bg: "oklch(0.65 0.18 145)", label: "Verified" },
  inferred: { bg: "oklch(0.65 0.18 60)", label: "Inferred" },
  unverified: { bg: "oklch(0.5 0.02 240)", label: "Unverified" },
};

const sourceOfTruthColor: Record<string, string> = {
  primary: "oklch(0.65 0.18 200)",
  secondary: "oklch(0.65 0.18 270)",
  tertiary: "oklch(0.5 0.05 240)",
};

function SourceComments({ targetTable, targetId }: { targetTable: string; targetId: number }) {
  const { data: comments, refetch } = trpc.comments.list.useQuery({ targetTable, targetId });
  const [body, setBody] = useState("");
  const [commentType, setCommentType] = useState<"correction" | "addition" | "flag" | "note">("note");
  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => { setBody(""); refetch(); toast.success("Comment added"); },
  });
  const updateStatus = trpc.comments.updateStatus.useMutation({ onSuccess: () => refetch() });
  const deleteComment = trpc.comments.delete.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="mt-4">
      <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>
        Comments & Corrections ({comments?.length ?? 0})
      </div>
      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
        {comments?.map((c: any) => (
          <div key={c.id} className="p-2.5 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-muted)", color: "var(--color-foreground)", fontSize: "10px" }}>{c.commentType}</span>
              <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{c.status}</span>
              <div className="flex gap-1 ml-auto">
                {c.status === "open" && <>
                  <button onClick={() => updateStatus.mutate({ id: c.id, status: "accepted" })}><Check className="w-3 h-3 text-green-500" /></button>
                  <button onClick={() => updateStatus.mutate({ id: c.id, status: "rejected" })}><X className="w-3 h-3 text-red-500" /></button>
                </>}
                <button onClick={() => deleteComment.mutate({ id: c.id })}><Trash2 className="w-3 h-3" style={{ color: "var(--color-muted-foreground)" }} /></button>
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--color-foreground)" }}>{c.body}</p>
          </div>
        ))}
        {(!comments || comments.length === 0) && <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>No comments yet.</p>}
      </div>
      <div className="flex gap-2">
        <select value={commentType} onChange={e => setCommentType(e.target.value as any)}
          className="text-xs px-2 py-1.5 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
          {["note", "correction", "addition", "flag"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={body} onChange={e => setBody(e.target.value)} placeholder="Add a comment..."
          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
        <button onClick={() => body.trim() && createComment.mutate({ targetTable, targetId, commentType, body })}
          className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>Add</button>
      </div>
    </div>
  );
}

function AddPressModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: "", outlet: "", author: "", summary: "", sourceUrl: "", publishedAt: "",
    pressType: "news_mention" as any, sentiment: "neutral" as any,
    verificationStatus: "unverified" as any, sourceOfTruth: "secondary" as any, tags: "", entities: "",
  });
  const create = trpc.press.create.useMutation({
    onSuccess: () => { toast.success("Press item added"); onSuccess(); onClose(); },
    onError: (e: any) => toast.error("Failed: " + e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Add Press Item</h2>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: "var(--color-muted-foreground)" }} /></button>
        </div>
        <div className="space-y-3">
          {[
            { label: "Title *", key: "title" }, { label: "Outlet *", key: "outlet" },
            { label: "Author", key: "author" }, { label: "Source URL", key: "sourceUrl" },
            { label: "Published Date", key: "publishedAt" }, { label: "Tags (comma separated)", key: "tags" },
            { label: "Entities (comma separated)", key: "entities" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
            </div>
          ))}
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Summary</label>
            <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={3}
              className="w-full text-xs px-3 py-2 rounded-lg border resize-none" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Type", key: "pressType", opts: ["press_release","news_mention","feature","interview","op_ed","award","other"] },
              { label: "Sentiment", key: "sentiment", opts: ["positive","neutral","negative","mixed"] },
              { label: "Verification", key: "verificationStatus", opts: ["verified","inferred","unverified"] },
              { label: "Source of Truth", key: "sourceOfTruth", opts: ["primary","secondary","tertiary"] },
            ].map(({ label, key, opts }) => (
              <div key={key}>
                <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
                <select value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full text-xs px-2 py-2 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>Cancel</button>
          <button onClick={() => form.title.trim() && form.outlet.trim() && create.mutate(form as any)} disabled={create.isPending}
            className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
            {create.isPending ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PressRoom() {
  const [pressType, setPressType] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { data: items, isLoading, refetch } = trpc.press.list.useQuery({
    pressType: pressType === "all" ? undefined : pressType,
    sentiment: sentiment === "all" ? undefined : sentiment,
    search: search || undefined,
    limit: 100,
  });
  const { data: detail } = trpc.press.byId.useQuery({ id: selected! }, { enabled: selected != null });
  const deletePress = trpc.press.delete.useMutation({
    onSuccess: () => { setSelected(null); refetch(); toast.success("Deleted"); },
  });

  return (
    <AppLayout>
      {showAdd && <AddPressModal onClose={() => setShowAdd(false)} onSuccess={refetch} />}
      <div className="flex h-full">
        <div className="w-80 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--color-border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Press Room</h1>
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "var(--color-muted-foreground)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="w-full text-xs pl-7 pr-3 py-1.5 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
            </div>
            <div className="flex gap-1 flex-wrap mb-1">
              {PRESS_TYPES.map(t => (
                <button key={t} onClick={() => setPressType(t)} className="px-2 py-0.5 rounded text-xs transition-all"
                  style={{ background: pressType === t ? "var(--color-primary)" : "var(--color-accent)", color: pressType === t ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)" }}>
                  {t.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {SENTIMENTS.map(t => (
                <button key={t} onClick={() => setSentiment(t)} className="px-2 py-0.5 rounded text-xs transition-all"
                  style={{ background: sentiment === t ? "var(--color-primary)" : "var(--color-accent)", color: sentiment === t ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <div className="p-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Loading...</div>}
            {items?.map((item: any) => (
              <div key={item.id} onClick={() => setSelected(item.id)} className="p-3 border-b cursor-pointer transition-all"
                style={{ borderColor: "var(--color-border)", background: selected === item.id ? "var(--color-accent)" : "transparent" }}>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: sentimentColor[item.sentiment] ?? "var(--color-muted-foreground)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium leading-tight mb-1 line-clamp-2" style={{ color: "var(--color-foreground)" }}>{item.title}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{item.outlet}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>{item.pressType?.replace(/_/g, " ")}</span>
                      {item.publishedAt && <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{new Date(item.publishedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!items || items.length === 0) && !isLoading && (
              <div className="p-8 text-center">
                <Newspaper className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-muted-foreground)" }} />
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>No press items yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Newspaper className="w-10 h-10" style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Select a press item to view details</p>
            </div>
          )}
          {detail && (
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold leading-tight mb-1" style={{ color: "var(--color-foreground)" }}>{detail.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{detail.outlet}</span>
                    {detail.author && <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>by {detail.author}</span>}
                    {detail.publishedAt && <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>· {new Date(detail.publishedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {detail.sourceUrl && (
                    <a href={detail.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
                      <ExternalLink className="w-3 h-3" /> Open Source
                    </a>
                  )}
                  <button onClick={() => { if (confirm("Delete?")) deletePress.mutate({ id: detail.id }); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: "oklch(0.55 0.2 25 / 0.15)", color: "oklch(0.65 0.2 25)" }}>
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>

              {/* Classification */}
             <div className="flex gap-2 mb-5 flex-wrap">
                {detail.sentiment && <span className="text-xs px-2 py-1 rounded-lg" style={{ background: (sentimentColor[detail.sentiment] ?? "var(--color-muted)") + "22", color: sentimentColor[detail.sentiment] ?? "var(--color-foreground)" }}>{detail.sentiment}</span>}
                {detail.verificationStatus && <span className="text-xs px-2 py-1 rounded-lg" style={{ background: (verificationBadge[detail.verificationStatus] ?? verificationBadge.unverified).bg + "22", color: (verificationBadge[detail.verificationStatus] ?? verificationBadge.unverified).bg }}>
                  {(verificationBadge[detail.verificationStatus] ?? verificationBadge.unverified).label}
                </span>}
                {detail.sourceOfTruth && (
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: (sourceOfTruthColor[detail.sourceOfTruth as string] ?? "var(--color-muted)") + "22", color: sourceOfTruthColor[detail.sourceOfTruth as string] ?? "var(--color-foreground)" }}>
                    {detail.sourceOfTruth} source
                  </span>
                )}
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--color-muted)", color: "var(--color-foreground)" }}>{detail.pressType?.replace(/_/g, " ")}</span>
              </div>

              {/* Summary */}
              {detail.summary && (
                <div className="mb-5 p-4 rounded-xl" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Summary</div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>{detail.summary}</p>
                </div>
              )}

              {/* Entities */}
             {detail.entities && (
               <div className="mb-5">
                 <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Entities Mentioned</div>
                 <div className="flex gap-1.5 flex-wrap">
                    {(Array.isArray(detail.entities) ? detail.entities as string[] : []).map((e: string) => (
                     <span key={e} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{e}</span>
                   ))}
                  </div>
                </div>
              )}

              {/* Tags */}
             {detail.tags && (
               <div className="mb-5">
                 <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Tags</div>
                 <div className="flex gap-1.5 flex-wrap">
                    {(Array.isArray(detail.tags) ? detail.tags as string[] : []).map((t: string) => (
                     <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}>{t}</span>
                   ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="p-4 rounded-xl" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                <SourceComments targetTable="press_items" targetId={detail.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
