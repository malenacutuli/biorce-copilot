import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Network } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NODE_COLORS: Record<string, string> = {
  company: "oklch(0.65 0.18 200)",
  person: "oklch(0.72 0.18 55)",
  product: "oklch(0.65 0.18 145)",
  regulator: "oklch(0.60 0.22 25)",
  standard: "oklch(0.65 0.15 280)",
};

export default function KnowledgeGraph() {
  const { data: nodes } = trpc.graph.nodes.useQuery();
  const { data: edges } = trpc.graph.edges.useQuery();
  const [selected, setSelected] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    const W = 900, H = 600;
    const pos: Record<number, { x: number; y: number }> = {};
    // Circular layout with Biorce at center
    const biorce = nodes.find((n: any) => n.label === "Biorce");
    const others = nodes.filter((n: any) => n.label !== "Biorce");
    if (biorce) pos[biorce.id] = { x: W / 2, y: H / 2 };
    others.forEach((n: any, i: number) => {
      const angle = (i / others.length) * 2 * Math.PI;
      const r = 220 + (i % 3) * 40;
      pos[n.id] = { x: W / 2 + r * Math.cos(angle), y: H / 2 + r * Math.sin(angle) };
    });
    setPositions(pos);
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDragging(id);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect && positions[id]) {
      setOffset({ x: e.clientX - rect.left - positions[id].x, y: e.clientY - rect.top - positions[id].y });
    }
  };

    const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging == null) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) setPositions(p => ({ ...p, [dragging]: { x: e.clientX - rect.left - offset.x, y: e.clientY - rect.top - offset.y } }));
  };

  const filteredNodes = activeFilter ? nodes?.filter((n: any) => n.type === activeFilter) : nodes;
  const filteredNodeIds = new Set(filteredNodes?.map((n: any) => n.id) ?? []);
  const filteredEdges = activeFilter ? edges?.filter((e: any) => filteredNodeIds.has(e.sourceId) && filteredNodeIds.has(e.targetId)) : edges;

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Knowledge Graph</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>Interactive relationship map · drag nodes to explore. Green = verified, amber = inferred</p>
          </div>
        <div className="flex gap-3">
            <button onClick={() => setActiveFilter(null)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{ background: activeFilter === null ? "var(--color-primary)" : "var(--color-accent)", color: activeFilter === null ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)" }}>
              All
            </button>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <button key={type} onClick={() => setActiveFilter(activeFilter === type ? null : type)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{ background: activeFilter === type ? `${color}33` : "var(--color-accent)", color: activeFilter === type ? color : "var(--color-muted-foreground)", border: activeFilter === type ? `1px solid ${color}66` : "1px solid transparent" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <svg ref={svgRef} width="100%" height="600" viewBox="0 0 900 600"
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDragging(null)}
            onMouseLeave={() => setDragging(null)}
            style={{ cursor: dragging ? "grabbing" : "default" }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="oklch(0.35 0.01 240)" />
              </marker>
            </defs>
            {/* Edges */}
            {filteredEdges?.map((e: any) => {
              const s = positions[e.sourceId], t = positions[e.targetId];
              if (!s || !t) return null;
              const isVerified = e.verificationStatus === "verified";
              return (
                <g key={e.id}>
                  <line x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke={isVerified ? "oklch(0.35 0.01 240)" : "oklch(0.30 0.01 240)"}
                    strokeWidth={isVerified ? 1.5 : 1}
                    strokeDasharray={isVerified ? "none" : "4 3"}
                    markerEnd="url(#arrow)" />
                  <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 4} textAnchor="middle" fontSize="9" fill="oklch(0.45 0.01 240)">{e.relationship}</text>
                </g>
              );
            })}
            {/* Nodes */}
            {filteredNodes?.map((n: any) => {
              const pos = positions[n.id];
              if (!pos) return null;
              const isBiorce = n.label === "Biorce";
              const r = isBiorce ? 28 : 18;
              const color = NODE_COLORS[n.type] ?? "oklch(0.55 0.01 240)";
              return (
                <g key={n.id} transform={`translate(${pos.x},${pos.y})`}
                  onMouseDown={e => handleMouseDown(e, n.id)}
                  onClick={() => setSelected(n)}
                  style={{ cursor: "grab", opacity: activeFilter && n.type !== activeFilter ? 0.2 : 1, transition: "opacity 200ms" }}>
                  <circle r={r} fill={`${color}22`} stroke={color} strokeWidth={isBiorce ? 2.5 : 1.5} />
                  {isBiorce && <circle r={r + 6} fill="none" stroke={color} strokeWidth={0.5} opacity={0.4} />}
                  <text textAnchor="middle" y={r + 12} fontSize={isBiorce ? 11 : 9} fontWeight={isBiorce ? "600" : "400"} fill="oklch(0.85 0.005 240)">{n.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
        {selected && (
          <div className="mt-4 p-4 rounded-xl border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{selected.label}</span>
                <span className="text-xs ml-2 px-1.5 py-0.5 rounded font-data" style={{ background: "var(--color-accent)", color: "var(--color-muted-foreground)" }}>{selected.type}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>✕</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
