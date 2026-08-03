import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Play, Trash2, Download, ExternalLink, MessageSquare,
  X, Check, ChevronDown, Video, Mic, FileText, Plus, Search,
  Youtube,
} from "lucide-react";

const MEDIA_TYPES = ["all", "video", "audio", "document", "image", "transcript"];

const verificationBadge: Record<string, { bg: string; label: string }> = {
  verified: { bg: "oklch(0.65 0.18 145)", label: "Verified" },
  inferred: { bg: "oklch(0.65 0.18 60)", label: "Inferred" },
  unverified: { bg: "oklch(0.5 0.02 240)", label: "Unverified" },
};

const mediaTypeIcon: Record<string, React.FC<any>> = {
  audio: Mic, video: Video, document: FileText, image: FileText, transcript: MessageSquare,
};

/** Extract YouTube video ID from a URL */
function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  if (!playing) {
    return (
      <div
        className="relative w-full rounded-xl overflow-hidden cursor-pointer group"
        style={{ aspectRatio: "16/9", background: "#000" }}
        onClick={() => setPlaying(true)}
      >
        <img src={thumb} alt={title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ background: "rgba(255,0,0,0.85)" }}>
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
          style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
          <Youtube className="w-3 h-3" style={{ color: "#ff0000" }} /> YouTube
        </div>
      </div>
    );
  }
  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  );
}

function SourceComments({ targetTable, targetId }: { targetTable: string; targetId: number }) {
  const { data: comments, refetch } = trpc.comments.list.useQuery({ targetTable, targetId });
  const [body, setBody] = useState("");
  const [commentType, setCommentType] = useState<"correction" | "addition" | "flag" | "note">("note");
  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => { setBody(""); refetch(); toast.success("Comment added"); },
    onError: () => toast.error("Failed to add comment"),
  });
  const updateStatus = trpc.comments.updateStatus.useMutation({ onSuccess: () => refetch() });
  const deleteComment = trpc.comments.delete.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="mt-4">
      <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>
        Comments & Corrections ({comments?.length ?? 0})
      </div>
      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
        {comments?.map((c: any) => (
          <div key={c.id} className="p-2.5 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-muted)", color: "var(--color-foreground)", fontSize: "10px" }}>{c.commentType}</span>
              <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{c.status}</span>
              <div className="flex gap-1 ml-auto">
                {c.status === "open" && <>
                  <button onClick={() => updateStatus.mutate({ id: c.id, status: "accepted" })} className="p-0.5 rounded hover:bg-green-500/20"><Check className="w-3 h-3 text-green-500" /></button>
                  <button onClick={() => updateStatus.mutate({ id: c.id, status: "rejected" })} className="p-0.5 rounded hover:bg-red-500/20"><X className="w-3 h-3 text-red-500" /></button>
                </>}
                <button onClick={() => deleteComment.mutate({ id: c.id })} className="p-0.5 rounded hover:bg-red-500/20"><Trash2 className="w-3 h-3" style={{ color: "var(--color-muted-foreground)" }} /></button>
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
        <input value={body} onChange={e => setBody(e.target.value)} placeholder="Add a comment or correction..."
          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
        <button onClick={() => body.trim() && createComment.mutate({ targetTable, targetId, commentType, body })}
          className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
          Add
        </button>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: "", mediaType: "video" as any, source: "", externalUrl: "",
    description: "", publishedAt: "", tags: "",
    verificationStatus: "unverified" as any, sourceOfTruth: "inferred" as any,
  });
  const createMedia = trpc.media.create.useMutation({
    onSuccess: () => { toast.success("Media item added"); onSuccess(); onClose(); },
    onError: (e: any) => toast.error("Failed: " + e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Add Media Item</h2>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: "var(--color-muted-foreground)" }} /></button>
        </div>
        <div className="space-y-3">
          {[
            { label: "Title *", key: "title", type: "text" },
            { label: "Source / Channel", key: "source", type: "text" },
            { label: "YouTube / External URL", key: "externalUrl", type: "url" },
            { label: "Published Date", key: "publishedAt", type: "date" },
            { label: "Tags (comma separated)", key: "tags", type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
            </div>
          ))}
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full text-xs px-3 py-2 rounded-lg border resize-none" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Type</label>
              <select value={form.mediaType} onChange={e => setForm(f => ({ ...f, mediaType: e.target.value }))}
                className="w-full text-xs px-2 py-2 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                {["video","audio","document","image","transcript"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Verification</label>
              <select value={form.verificationStatus} onChange={e => setForm(f => ({ ...f, verificationStatus: e.target.value }))}
                className="w-full text-xs px-2 py-2 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                {["verified","inferred","unverified"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-muted-foreground)" }}>Source of Truth</label>
              <select value={form.sourceOfTruth} onChange={e => setForm(f => ({ ...f, sourceOfTruth: e.target.value }))}
                className="w-full text-xs px-2 py-2 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                {["primary","secondary","inferred"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>Cancel</button>
          <button onClick={() => form.title.trim() && createMedia.mutate(form as any)} disabled={createMedia.isPending}
            className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
            {createMedia.isPending ? "Adding..." : "Add Media"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaLibrary() {
  const [mediaType, setMediaType] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const { data: items, isLoading, refetch } = trpc.media.list.useQuery({
    mediaType: mediaType === "all" ? undefined : mediaType,
    search: search || undefined,
    limit: 100,
  });

  const { data: detail } = trpc.media.byId.useQuery({ id: selected! }, { enabled: selected != null });

  const deleteMedia = trpc.media.delete.useMutation({
    onSuccess: () => { setSelected(null); refetch(); toast.success("Deleted"); },
    onError: () => toast.error("Delete failed"),
  });

  const handleDownloadTranscript = () => {
    if (!detail?.transcriptText) return;
    const blob = new Blob([detail.transcriptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${detail.title.replace(/\s+/g, "_")}_transcript.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const TypeIcon = detail ? (mediaTypeIcon[detail.mediaType] ?? FileText) : FileText;
  const ytId = detail ? getYouTubeId(detail.externalUrl) : null;

  return (
    <AppLayout>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={refetch} />}
      <div className="flex h-full">
        {/* Left panel - list */}
        <div className="w-80 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--color-border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Media Library</h1>
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "var(--color-muted-foreground)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="w-full text-xs pl-7 pr-3 py-1.5 rounded-lg border" style={{ background: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {MEDIA_TYPES.map(t => (
                <button key={t} onClick={() => setMediaType(t)}
                  className="px-2 py-0.5 rounded text-xs transition-all"
                  style={{ background: mediaType === t ? "var(--color-primary)" : "var(--color-accent)", color: mediaType === t ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Item list with thumbnails */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && <div className="p-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Loading...</div>}
            {items?.map((item: any) => {
              const Icon = mediaTypeIcon[item.mediaType] ?? FileText;
              const vb = verificationBadge[item.verificationStatus] ?? verificationBadge.unverified;
              const thumb = item.thumbnailUrl || (getYouTubeId(item.externalUrl) ? `https://img.youtube.com/vi/${getYouTubeId(item.externalUrl)}/mqdefault.jpg` : null);
              return (
                <div key={item.id} onClick={() => { setSelected(item.id); setShowTranscript(false); }}
                  className="border-b cursor-pointer transition-all"
                  style={{ borderColor: "var(--color-border)", background: selected === item.id ? "var(--color-accent)" : "transparent" }}>
                  {/* Thumbnail row */}
                  {thumb ? (
                    <div className="relative w-full" style={{ aspectRatio: "16/9", background: "#000" }}>
                      <img src={thumb} alt={item.title} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,0,0,0.8)" }}>
                          <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <div className="absolute top-1.5 right-1.5">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: vb.bg + "dd", color: "#fff", fontSize: "9px" }}>{vb.label}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-center" style={{ aspectRatio: "16/9", background: "var(--color-muted)" }}>
                      <Icon className="w-8 h-8" style={{ color: "var(--color-muted-foreground)" }} />
                    </div>
                  )}
                  {/* Title row */}
                  <div className="p-2.5">
                    <div className="text-xs font-medium leading-tight mb-1 line-clamp-2" style={{ color: "var(--color-foreground)" }}>{item.title}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)", fontSize: "10px" }}>{item.mediaType}</span>
                      {item.source && <span className="text-xs truncate" style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>{item.source}</span>}
                      {item.transcriptText && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "oklch(0.3 0.05 240)", color: "oklch(0.75 0.1 240)", fontSize: "10px" }}>Transcript</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {(!items || items.length === 0) && !isLoading && (
              <div className="p-8 text-center">
                <Video className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-muted-foreground)" }} />
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>No media items yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - detail */}
        <div className="flex-1 overflow-y-auto">
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Video className="w-10 h-10" style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Select a media item to view details</p>
            </div>
          )}
          {detail && (
            <div className="p-6 max-w-3xl">
              {/* YouTube embed or thumbnail */}
              {ytId ? (
                <div className="mb-5">
                  <YouTubeEmbed videoId={ytId} title={detail.title} />
                </div>
              ) : detail.thumbnailUrl ? (
                <div className="mb-5 rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img src={detail.thumbnailUrl} alt={detail.title} className="w-full h-full object-cover" />
                </div>
              ) : null}

              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-muted)" }}>
                  <TypeIcon className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold leading-tight mb-1" style={{ color: "var(--color-foreground)" }}>{detail.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {detail.source && <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{detail.source}</span>}
                    {detail.publishedAt && <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>· {new Date(detail.publishedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap mb-5">
                {detail.externalUrl && (
                  <a href={detail.externalUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.75 0.18 25)" }}>
                    <Youtube className="w-3 h-3" /> Open on YouTube
                  </a>
                )}
                {detail.fileUrl && (
                  <a href={detail.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>
                    <ExternalLink className="w-3 h-3" /> Source File
                  </a>
                )}
                {detail.transcriptText && (
                  <button onClick={handleDownloadTranscript}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>
                    <Download className="w-3 h-3" /> Download Transcript
                  </button>
                )}
                <button onClick={() => { if (confirm("Delete this media item?")) deleteMedia.mutate({ id: detail.id }); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs ml-auto"
                  style={{ background: "oklch(0.55 0.2 25 / 0.15)", color: "oklch(0.65 0.2 25)" }}>
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>

              {/* Classification badges */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {[
                  { label: detail.mediaType, bg: "var(--color-muted)" },
                  { label: (verificationBadge[detail.verificationStatus] ?? verificationBadge.unverified).label, bg: (verificationBadge[detail.verificationStatus] ?? verificationBadge.unverified).bg + "33" },
                  { label: detail.sourceOfTruth + " source", bg: "var(--color-muted)" },
                ].map(({ label, bg }) => (
                  <span key={label} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: bg, color: "var(--color-foreground)" }}>{label}</span>
                ))}
              </div>

              {/* Description */}
              {detail.description && (
                <div className="mb-5 p-4 rounded-xl" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Description</div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>{detail.description}</p>
                </div>
              )}

              {/* Tags */}
              {detail.tags && Array.isArray(detail.tags) && detail.tags.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Tags</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(detail.tags as string[]).map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript */}
              {detail.transcriptText && (
                <div className="mb-5">
                  <button onClick={() => setShowTranscript(!showTranscript)}
                    className="flex items-center gap-2 w-full p-4 rounded-xl text-left"
                    style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                    <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
                    <span className="text-xs font-semibold flex-1" style={{ color: "var(--color-foreground)" }}>
                      Full Transcript ({Math.round((detail.transcriptText?.length ?? 0) / 5).toLocaleString()} words approx.)
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showTranscript ? "rotate-180" : ""}`} style={{ color: "var(--color-muted-foreground)" }} />
                  </button>
                  {showTranscript && (
                    <div className="mt-2 p-4 rounded-xl max-h-[32rem] overflow-y-auto" style={{ background: "var(--color-accent)", border: "1px solid var(--color-border)" }}>
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: "var(--color-foreground)" }}>{detail.transcriptText}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Source Comments */}
              <div className="p-4 rounded-xl" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                <SourceComments targetTable="media_items" targetId={detail.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
