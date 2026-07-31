import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { BookOpen, Download, ExternalLink, Search } from "lucide-react";
import { useState } from "react";

const CATEGORIES = ["all", "podcast", "press_release", "public_statement", "competitor", "regulatory", "research", "internal", "investor"];
const SOURCE_TYPES = ["all", "primary", "secondary", "inferred"];
const VERIFICATION = ["all", "verified", "inferred", "unverified"];

function FilterBar<T extends string>({
  label, options, value, onChange,
}: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-2">
      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-muted-foreground)" }}>{label}</div>
      <div className="flex gap-1 flex-wrap">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            className="px-2 py-0.5 rounded text-xs transition-all"
            style={{
              background: value === opt ? "var(--color-primary)" : "var(--color-accent)",
              color: value === opt ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
              transform: value === opt ? "scale(1.05)" : "scale(1)",
            }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sourceType, setSourceType] = useState<string>("all");
  const [verification, setVerification] = useState<string>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const queryInput = {
    search: search || undefined,
    category: category === "all" ? undefined : category,
    sourceType: sourceType === "all" ? undefined : sourceType,
    verificationStatus: verification === "all" ? undefined : verification,
    limit: 200,
  };

  const { data: items, isLoading } = trpc.knowledge.list.useQuery(queryInput);
  const { data: detail } = trpc.knowledge.byId.useQuery({ id: selected! }, { enabled: selected != null });

  // CSV export via tRPC query (lazy)
  const utils = trpc.useUtils();
  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await utils.knowledge.exportCsv.fetch({
        search: queryInput.search,
        category: queryInput.category,
        sourceType: queryInput.sourceType,
        verificationStatus: queryInput.verificationStatus,
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 10);
      const parts = [
        category !== "all" ? category : "",
        sourceType !== "all" ? sourceType : "",
        verification !== "all" ? verification : "",
        search ? `search-${search.slice(0, 20)}` : "",
      ].filter(Boolean);
      a.href = url;
      a.download = `biorce-knowledge${parts.length ? "-" + parts.join("-") : ""}-${ts}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const activeFilters = [
    category !== "all" && `category: ${category}`,
    sourceType !== "all" && `source: ${sourceType}`,
    verification !== "all" && `status: ${verification}`,
    search && `"${search}"`,
  ].filter(Boolean);

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Filter + List panel */}
        <div className="w-96 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--color-border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Knowledge Base</h1>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-primary-foreground)",
                  opacity: exporting ? 0.6 : 1,
                }}
                title="Export current filtered view as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--color-muted-foreground)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search intelligence..."
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border outline-none"
                style={{ background: "var(--color-input)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
              />
            </div>

            {/* Filter rows */}
            <FilterBar label="Category" options={CATEGORIES as string[]} value={category} onChange={setCategory} />
            <FilterBar label="Source Type" options={SOURCE_TYPES as string[]} value={sourceType} onChange={setSourceType} />
            <FilterBar label="Verification" options={VERIFICATION as string[]} value={verification} onChange={setVerification} />

            {/* Active filter summary */}
            {activeFilters.length > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Active:</span>
                {activeFilters.map((f, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded font-data"
                    style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
                    {f}
                  </span>
                ))}
                <button
                  onClick={() => { setCategory("all"); setSourceType("all"); setVerification("all"); setSearch(""); }}
                  className="text-xs underline transition-opacity hover:opacity-70"
                  style={{ color: "var(--color-muted-foreground)" }}>
                  Clear all
                </button>
              </div>
            )}

            {/* Result count */}
            <div className="mt-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              {isLoading ? "Loading…" : `${items?.length ?? 0} item${items?.length !== 1 ? "s" : ""}`}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {items?.map(item => (
              <div key={item.id} onClick={() => setSelected(item.id)}
                className="p-4 border-b cursor-pointer transition-all"
                style={{ borderColor: "var(--color-border)", background: selected === item.id ? "var(--color-accent)" : "transparent" }}
                onMouseEnter={e => { if (selected !== item.id) (e.currentTarget as HTMLElement).style.background = "var(--color-muted)"; }}
                onMouseLeave={e => { if (selected !== item.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium leading-tight" style={{ color: "var(--color-foreground)" }}>{item.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 badge-${item.verificationStatus}`}>{item.verificationStatus}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-xs font-data px-1.5 py-0.5 rounded" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{item.category}</span>
                  <span className="text-xs font-data px-1.5 py-0.5 rounded" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}>{item.sourceType}</span>
                  {item.sourceName && <span className="text-xs truncate max-w-[120px]" style={{ color: "var(--color-muted-foreground)" }}>{item.sourceName}</span>}
                </div>
              </div>
            ))}
            {!isLoading && items?.length === 0 && (
              <div className="p-6 text-center text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                No items match the current filters.
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <BookOpen className="w-10 h-10" style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Select an item to view details</p>
            </div>
          )}
          {detail && (
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold leading-tight" style={{ color: "var(--color-foreground)" }}>{detail.title}</h2>
                <span className={`text-xs px-2 py-1 rounded flex-shrink-0 badge-${detail.verificationStatus}`}>{detail.verificationStatus}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs px-2 py-1 rounded font-data" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{detail.category}</span>
                <span className="text-xs px-2 py-1 rounded font-data" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}>{detail.sourceType}</span>
                {detail.sourceName && <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{detail.sourceName}</span>}
                {detail.author && <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>by {detail.author}</span>}
                {detail.publishedAt && (
                  <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>
                    {new Date(detail.publishedAt).toLocaleDateString()}
                  </span>
                )}
                {detail.sourceUrl && (
                  <a href={detail.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded flex items-center gap-1"
                    style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
                    <ExternalLink className="w-3 h-3" /> Source
                  </a>
                )}
              </div>
              {detail.tags && Array.isArray(detail.tags) && detail.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {(detail.tags as string[]).map((tag, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {detail.summary && (
                <div className="p-4 rounded-lg border mb-4" style={{ background: "var(--color-muted)", borderColor: "var(--color-border)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Summary</div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>{detail.summary}</p>
                </div>
              )}
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted-foreground)" }}>Full Content</div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-foreground)" }}>{detail.content}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

