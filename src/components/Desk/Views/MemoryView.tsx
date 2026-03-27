import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  BookOpen,
  Pencil,
  Trash2,
  GitFork,
  Activity,
  Tag,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Network,
  BarChart3,
  RefreshCw,
  Hash,
} from "lucide-react";
import {
  useMemory,
  MemoryNode,
  HubNode,
  GraphExport,
} from "../../../hooks/useMemory";

type Tab =
  | "search"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "graph"
  | "system";

interface TopTag {
  tag: string;
  count: number;
}

interface GraphNode {
  id: string;
  content: string;
  tags?: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface GraphEdge {
  source: string;
  target: string;
  description?: string;
}

const truncate = (s: string | undefined | null, n = 120) =>
  s ? (s.length > n ? s.slice(0, n) + "…" : s) : "";
const parseTags = (s: string) =>
  s
    .split(",")
    .map((t: string) => t.trim())
    .filter(Boolean);

function StatusBadge({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
        ok
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      {ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {msg}
    </motion.div>
  );
}

function MemCard({
  mem,
  onSelect,
}: {
  mem: MemoryNode;
  onSelect?: (m: MemoryNode) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      onClick={() => onSelect?.(mem)}
      className="group relative p-4 rounded-xl border border-neutral-200 bg-white hover:border-violet-300 hover:shadow-md hover:shadow-violet-500/5 transition-all cursor-pointer"
    >
      {mem.semantic_score !== undefined && (
        <div className="absolute top-3 right-3 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-600">
          {(mem.semantic_score * 100).toFixed(0)}%
        </div>
      )}
      <p className="text-sm text-neutral-700 leading-relaxed pr-10">
        {truncate(mem.content)}
      </p>
      {mem.tags && mem.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {mem.tags.slice(0, 4).map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500"
            >
              <Tag size={8} />
              {tag}
            </span>
          ))}
          {mem.tags.length > 4 && (
            <span className="text-[10px] text-neutral-400">
              +{mem.tags.length - 4}
            </span>
          )}
        </div>
      )}
      {mem.id && (
        <p className="mt-2 text-[10px] font-mono text-neutral-400 truncate">
          {mem.id}
        </p>
      )}
      {onSelect && (
        <ChevronRight
          size={14}
          className="absolute right-3 bottom-4 text-neutral-300 group-hover:text-violet-400 transition-colors"
        />
      )}
    </motion.div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 placeholder:text-neutral-400 transition-all";

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${className}`} />;
}

function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`${inputCls} resize-none ${className}`} />
  );
}

function Btn({
  children,
  onClick,
  variant = "primary",
  loading,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    primary:
      "bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/20",
    danger:
      "bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-500/20",
    ghost: "border border-neutral-200 hover:bg-neutral-100 text-neutral-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

function GraphCanvas({ data }: { data: GraphExport }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.nodes?.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // Guard against null ctx

    const W = (canvas.width = canvas.offsetWidth);
    const H = (canvas.height = canvas.offsetHeight);

    const nodes: GraphNode[] = data.nodes.slice(0, 40).map((n: MemoryNode) => ({
      ...n,
      x: W / 2 + (Math.random() - 0.5) * W * 0.7,
      y: H / 2 + (Math.random() - 0.5) * H * 0.7,
      vx: 0,
      vy: 0,
      r: 6,
    }));

    const edges: GraphEdge[] = (data.edges || [])
      .filter(
        (e: GraphEdge) =>
          nodes.find((n: GraphNode) => n.id === e.source) &&
          nodes.find((n: GraphNode) => n.id === e.target),
      )
      .slice(0, 60);

    function tick() {
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].vx *= 0.85;
        nodes[i].vy *= 0.85;
        nodes[i].vx += (W / 2 - nodes[i].x) * 0.001;
        nodes[i].vy += (H / 2 - nodes[i].y) * 0.001;
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = Math.min(600 / (dist * dist), 2);
          nodes[i].vx += (dx / dist) * force;
          nodes[i].vy += (dy / dist) * force;
          nodes[j].vx -= (dx / dist) * force;
          nodes[j].vy -= (dy / dist) * force;
        }
      }
      for (const e of edges) {
        const src = nodes.find((n: GraphNode) => n.id === e.source);
        const tgt = nodes.find((n: GraphNode) => n.id === e.target);
        if (!src || !tgt) continue;
        const dx = tgt.x - src.x,
          dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 100) * 0.005;
        src.vx += (dx / dist) * force;
        src.vy += (dy / dist) * force;
        tgt.vx -= (dx / dist) * force;
        tgt.vy -= (dy / dist) * force;
      }
      for (const n of nodes) {
        n.x = Math.max(20, Math.min(W - 20, n.x + n.vx));
        n.y = Math.max(20, Math.min(H - 20, n.y + n.vy));
      }
    }

    let frame = 0;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fafaf9";
      ctx.fillRect(0, 0, W, H);
      for (const e of edges) {
        const src = nodes.find((n: GraphNode) => n.id === e.source);
        const tgt = nodes.find((n: GraphNode) => n.id === e.target);
        if (!src || !tgt) continue;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = "rgba(139,92,246,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "#8b5cf6";
        ctx.fill();
        ctx.strokeStyle = "#ddd6fe";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(109,40,217,0.8)";
        ctx.font = "9px monospace";
        ctx.fillText(truncate(n.content, 18), n.x + 9, n.y + 3);
      }
      frame++;
      if (frame < 120) tick();
      animRef.current = requestAnimationFrame(draw);
    }

    for (let i = 0; i < 50; i++) tick();
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-xl"
      style={{ minHeight: 340 }}
    />
  );
}

export default function MemoryView() {
  const mem = useMemory();
  const [tab, setTab] = useState<Tab>("graph");
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [format, setFormat] = useState<"raw" | "interpreted" | "both">("both");
  const [searchLoading, setSearchLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [createContent, setCreateContent] = useState("");
  const [createTags, setCreateTags] = useState("");
  const [createCategory, setCreateCategory] = useState("");

  const [readId, setReadId] = useState("");
  const [readResult, setReadResult] = useState<MemoryNode | null>(null);

  const [updateId, setUpdateId] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updateTags, setUpdateTags] = useState("");

  const [deleteId, setDeleteId] = useState("");
  const [deleteTags, setDeleteTags] = useState("");
  const [deleteCategory, setDeleteCategory] = useState("");

  const [graphData, setGraphData] = useState<GraphExport | null>(null);
  const [hubs, setHubs] = useState<HubNode[]>([]);
  const [neighborId, setNeighborId] = useState("");
  const [neighborData, setNeighborData] = useState<GraphExport | null>(null);
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);

  const [statsData, setStatsData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [countTag, setCountTag] = useState("");
  const [countResult, setCountResult] = useState<number | null>(null);

  const [graphLoadAttempted, setGraphLoadAttempted] = useState(false);
  const [statsLoadAttempted, setStatsLoadAttempted] = useState(false);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const showStatus = useCallback((ok: boolean, msg: string) => {
    setStatus({ ok, msg });
    setTimeout(() => setStatus(null), 4000);
  }, []);

  useEffect(() => {
    if (tab === "graph" && !graphData && !graphLoadAttempted) {
      setGraphLoadAttempted(true);
      handleLoadGraph();
    }
  }, [tab, graphData, graphLoadAttempted]);

  useEffect(() => {
    if (tab === "system" && !statsData && !statsLoadAttempted) {
      setStatsLoadAttempted(true);
      handleStats();
    }
  }, [tab, statsData, statsLoadAttempted]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "graph", label: "Graph", icon: GitFork },
    { id: "system", label: "System", icon: Activity },
    { id: "search", label: "Search", icon: Search },
    { id: "create", label: "Create", icon: Plus },
    { id: "read", label: "Read", icon: BookOpen },
    { id: "update", label: "Update", icon: Pencil },
    { id: "delete", label: "Delete", icon: Trash2 },
  ];

  async function handleSearch() {
    if (!query.trim()) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setSearchLoading(true);
    try {
      const r = await mem.search(query, 8, format, controller.signal);
      if (r) setSearchResults(r);
      else showStatus(false, mem.error || "Search failed");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        showStatus(false, err.message || "Search error");
        console.error(err);
      }
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleCreate() {
    if (!createContent.trim()) return;
    const r = await mem.create(
      createContent,
      parseTags(createTags),
      createCategory || undefined,
    );
    if (r) {
      showStatus(true, `Memory stored! Status: ${r.status}`);
      setCreateContent("");
      setCreateTags("");
      setCreateCategory("");
    } else showStatus(false, mem.error || "Create failed");
  }

  async function handleRead() {
    if (!readId.trim()) return;
    const r = await mem.getById(readId);
    if (r) setReadResult(r);
    else showStatus(false, mem.error || "Not found");
  }

  async function handleUpdate() {
    if (!updateId.trim() || !updateContent.trim()) return;
    const r = await mem.update(updateId, updateContent, parseTags(updateTags));
    if (r) showStatus(true, "Memory updated");
    else showStatus(false, mem.error || "Update failed");
  }

  async function handleDelete() {
    if (deleteId.trim()) {
      const r = await mem.remove(deleteId);
      if (r) {
        showStatus(true, "Memory deleted");
        setDeleteId("");
      } else showStatus(false, mem.error || "Delete failed");
    } else {
      const r = await mem.bulkDelete(
        deleteTags ? parseTags(deleteTags) : undefined,
        deleteCategory || undefined,
      );
      if (r) showStatus(true, "Bulk delete complete");
      else showStatus(false, mem.error || "Bulk delete failed");
    }
  }

  async function handleLoadGraph() {
    try {
      const [g, h] = await Promise.all([mem.graphExport(), mem.hubs(12)]);
      if (g) setGraphData(g);
      if (h) setHubs(h.hubs || []);
      if (!g) showStatus(false, mem.error || "Graph load failed");
    } catch (err: any) {
      console.error("Graph load error:", err);
      showStatus(false, err.message || "Failed to load graph data");
    }
  }

  async function handleNeighborhood() {
    if (!neighborId.trim()) return;
    setNeighborhoodLoading(true);
    try {
      const r = await mem.neighborhood(neighborId, 2);
      if (r) setNeighborData(r);
      else showStatus(false, mem.error || "Neighborhood failed");
    } catch (err: any) {
      showStatus(false, err.message || "Neighborhood error");
      console.error(err);
    } finally {
      setNeighborhoodLoading(false);
    }
  }

  async function handleStats() {
    try {
      const [s, hlth] = await Promise.all([mem.stats(), mem.health()]);
      if (s) setStatsData(s);
      if (hlth) setHealthData(hlth);
      if (!s) showStatus(false, mem.error || "Stats load failed");
    } catch (err: any) {
      console.error("Stats load error:", err);
      showStatus(false, err.message || "Failed to load stats data");
    }
  }

  async function handleCount() {
    const r = await mem.count(countTag || undefined);
    if (r) setCountResult(r.count);
  }

  return (
    <div className="flex flex-col h-full bg-[#FCFCFD] font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-500/30">
            <Network size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
            What OZEN knows about you
          </h1>
          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 border border-violet-200">
            Membrain
          </span>
        </div>
        <p className="text-xs text-neutral-400 ml-11">
          Persistent semantic memory graph
        </p>
        <AnimatePresence>
          {status && (
            <div className="mt-3">
              <StatusBadge ok={status.ok} msg={status.msg} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-1 px-4 pt-3 pb-0 overflow-x-auto border-b border-neutral-100">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap -mb-px border-b-2 ${
                active
                  ? "text-violet-700 border-violet-600 bg-violet-50"
                  : "text-neutral-500 border-transparent hover:text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {/* SEARCH */}
            {tab === "search" && (
              <div className="space-y-4">
                <Field label="Query">
                  <Textarea
                    rows={2}
                    placeholder="What do you know about my project preferences?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      (e.preventDefault(), handleSearch())
                    }
                  />
                </Field>
                <div className="flex items-end gap-2">
                  <Field label="Format">
                    <select
                      value={format}
                      onChange={(e) =>
                        setFormat(
                          e.target.value as "raw" | "interpreted" | "both",
                        )
                      }
                      className={inputCls + " w-auto"}
                    >
                      <option value="both">Both</option>
                      <option value="interpreted">Interpreted</option>
                      <option value="raw">Raw</option>
                    </select>
                  </Field>
                  <Btn onClick={handleSearch} loading={searchLoading}>
                    <Search size={14} /> Search
                  </Btn>
                </div>
                {searchResults && (
                  <div className="space-y-3">
                    {searchResults.interpreted?.answer_summary && (
                      <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap size={13} className="text-violet-500" />
                          <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">
                            Interpreted
                          </span>
                          {searchResults.interpreted.confidence !==
                            undefined && (
                            <span className="ml-auto text-[10px] font-mono text-violet-500">
                              {(
                                searchResults.interpreted.confidence * 100
                              ).toFixed(0)}
                              % conf
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-violet-900 leading-relaxed">
                          {searchResults.interpreted.answer_summary}
                        </p>
                        {searchResults.interpreted.key_facts?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {searchResults.interpreted.key_facts.map(
                              (f: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-xs text-violet-700 flex gap-2"
                                >
                                  <span className="text-violet-400">•</span>
                                  {f}
                                </li>
                              ),
                            )}
                          </ul>
                        )}
                      </div>
                    )}
                    {searchResults.results?.length > 0 && (
                      <div>
                        <p className="text-[11px] text-neutral-400 mb-2 uppercase tracking-wider font-medium">
                          {searchResults.results.length} results
                        </p>
                        <div className="space-y-2">
                          {searchResults.results.map(
                            (r: MemoryNode, i: number) => (
                              <MemCard
                                key={r.id || i}
                                mem={r}
                                onSelect={(m) => {
                                  setUpdateId(m.id);
                                  setUpdateContent(m.content);
                                  setUpdateTags((m.tags || []).join(", "));
                                  setTab("update");
                                }}
                              />
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CREATE */}
            {tab === "create" && (
              <div className="space-y-4">
                <Field label="Memory Content *">
                  <Textarea
                    rows={4}
                    placeholder="User prefers dark mode interfaces..."
                    value={createContent}
                    onChange={(e) => setCreateContent(e.target.value)}
                  />
                </Field>
                <Field label="Tags (comma-separated)">
                  <Input
                    placeholder="type.preference, scope.ui"
                    value={createTags}
                    onChange={(e) => setCreateTags(e.target.value)}
                  />
                </Field>
                <Field label="Category">
                  <Input
                    placeholder="preferences"
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                  />
                </Field>
                <div className="flex items-center gap-3">
                  <Btn
                    onClick={handleCreate}
                    loading={mem.loading}
                    disabled={!createContent.trim()}
                  >
                    <Plus size={14} /> Store Memory
                  </Btn>
                  <p className="text-xs text-neutral-400">
                    Async — polls until complete
                  </p>
                </div>
              </div>
            )}

            {/* READ */}
            {tab === "read" && (
              <div className="space-y-4">
                <Field label="Memory ID">
                  <div className="flex gap-2">
                    <Input
                      placeholder="mem_xxxxxxxx"
                      value={readId}
                      onChange={(e) => setReadId(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <Btn onClick={handleRead} loading={mem.loading}>
                      <BookOpen size={14} /> Fetch
                    </Btn>
                  </div>
                </Field>
                {readResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <MemCard mem={readResult} />
                    {readResult.related_memories &&
                      readResult.related_memories.length > 0 && (
                        <div>
                          <p className="text-[11px] text-neutral-400 mb-2 uppercase tracking-wider font-medium">
                            Related
                          </p>
                          <div className="space-y-2">
                            {readResult.related_memories.map(
                              (
                                r: { id: string; content: string },
                                i: number,
                              ) => (
                                <MemCard
                                  key={r.id || i}
                                  mem={r as MemoryNode}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    <div className="flex gap-2">
                      <Btn
                        variant="ghost"
                        onClick={() => {
                          setUpdateId(readResult.id);
                          setUpdateContent(readResult.content);
                          setUpdateTags((readResult.tags || []).join(", "));
                          setTab("update");
                        }}
                      >
                        <Pencil size={13} /> Edit
                      </Btn>
                      <Btn
                        variant="ghost"
                        onClick={() => {
                          setDeleteId(readResult.id);
                          setTab("delete");
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </Btn>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* UPDATE */}
            {tab === "update" && (
              <div className="space-y-4">
                {updateId && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                    <Hash size={12} className="text-amber-500" />
                    <span className="text-[11px] font-mono text-amber-700 truncate">
                      {updateId}
                    </span>
                    <button
                      onClick={() => {
                        setUpdateId("");
                        setUpdateContent("");
                        setUpdateTags("");
                      }}
                      className="ml-auto text-amber-400 hover:text-amber-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <Field label="Memory ID *">
                  <Input
                    placeholder="mem_xxxxxxxx"
                    value={updateId}
                    onChange={(e) => setUpdateId(e.target.value)}
                    className="font-mono text-xs"
                  />
                </Field>
                <Field label="New Content *">
                  <Textarea
                    rows={4}
                    placeholder="Updated content..."
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                  />
                </Field>
                <Field label="New Tags">
                  <Input
                    placeholder="type.preference, scope.ui"
                    value={updateTags}
                    onChange={(e) => setUpdateTags(e.target.value)}
                  />
                </Field>
                <Btn
                  onClick={handleUpdate}
                  loading={mem.loading}
                  disabled={!updateId.trim() || !updateContent.trim()}
                >
                  <Pencil size={14} /> Update Memory
                </Btn>
              </div>
            )}

            {/* DELETE */}
            {tab === "delete" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-red-200 bg-red-50">
                  <p className="text-xs font-semibold text-red-600 mb-1 uppercase tracking-wider">
                    ⚠ Destructive Operations
                  </p>
                  <p className="text-xs text-red-500">
                    Deletions are permanent and cannot be undone.
                  </p>
                </div>
                <Field label="Single Memory ID">
                  <div className="flex gap-2">
                    <Input
                      placeholder="mem_xxxxxxxx"
                      value={deleteId}
                      onChange={(e) => setDeleteId(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <Btn
                      variant="danger"
                      loading={mem.loading}
                      onClick={handleDelete}
                      disabled={!deleteId.trim()}
                    >
                      <Trash2 size={14} /> Delete
                    </Btn>
                  </div>
                </Field>
                <div className="border-t border-neutral-200 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Bulk Delete
                  </p>
                  <Field label="By Tags">
                    <Input
                      placeholder="type.ping, system"
                      value={deleteTags}
                      onChange={(e) => setDeleteTags(e.target.value)}
                    />
                  </Field>
                  <Field label="By Category">
                    <Input
                      placeholder="temp"
                      value={deleteCategory}
                      onChange={(e) => setDeleteCategory(e.target.value)}
                    />
                  </Field>
                  <Btn
                    variant="danger"
                    loading={mem.loading}
                    onClick={handleDelete}
                    disabled={
                      !deleteId.trim() &&
                      !deleteTags.trim() &&
                      !deleteCategory.trim()
                    }
                  >
                    <Trash2 size={14} /> Bulk Delete
                  </Btn>
                </div>
              </div>
            )}

            {/* GRAPH */}
            {tab === "graph" && (
              <div className="space-y-4">
                <Btn
                  onClick={() => {
                    setGraphLoadAttempted(false);
                    handleLoadGraph();
                  }}
                  loading={mem.loading}
                >
                  <GitFork size={14} /> Load Graph
                </Btn>
                {graphData && graphData.nodes?.length > 0 ? (
                  <>
                    <div
                      className="rounded-xl border border-neutral-200 overflow-hidden"
                      style={{ height: 340 }}
                    >
                      <GraphCanvas data={graphData} />
                    </div>
                    <p className="text-xs text-neutral-400">
                      {graphData.nodes.length} nodes ·{" "}
                      {graphData.edges?.length || 0} edges
                    </p>
                  </>
                ) : graphData && graphData.nodes?.length === 0 ? (
                  <p className="text-center text-neutral-400 py-8">
                    No memories to display
                  </p>
                ) : null}
                {hubs.length > 0 && (
                  <div>
                    <p className="text-[11px] text-neutral-400 mb-2 uppercase tracking-wider font-medium">
                      Top Hubs
                    </p>
                    <div className="space-y-1.5">
                      {hubs.map((h: HubNode, i: number) => (
                        <motion.div
                          key={h.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-neutral-200 cursor-pointer hover:border-violet-300"
                          onClick={() => setNeighborId(h.id)}
                        >
                          <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-violet-600">
                              {h.degree}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-700 flex-1 truncate">
                            {truncate(h.content, 60)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t border-neutral-200 pt-3 space-y-2">
                  <Field label="Neighborhood Explorer">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Memory ID"
                        value={neighborId}
                        onChange={(e) => setNeighborId(e.target.value)}
                        className="font-mono text-xs"
                      />
                      <Btn
                        onClick={handleNeighborhood}
                        loading={neighborhoodLoading}
                        disabled={!neighborId.trim()}
                      >
                        <Network size={14} />
                      </Btn>
                    </div>
                  </Field>
                  {neighborData && neighborData.nodes?.length > 0 && (
                    <div
                      className="rounded-xl border border-neutral-200 overflow-hidden"
                      style={{ height: 220 }}
                    >
                      <GraphCanvas data={neighborData} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SYSTEM */}
            {tab === "system" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Btn
                    onClick={() => {
                      setStatsLoadAttempted(false);
                      handleStats();
                    }}
                    loading={mem.loading}
                  >
                    <RefreshCw size={14} /> Refresh Stats
                  </Btn>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Filter tag"
                      value={countTag}
                      onChange={(e) => setCountTag(e.target.value)}
                      className="w-32"
                    />
                    <Btn
                      variant="ghost"
                      onClick={handleCount}
                      loading={mem.loading}
                    >
                      <Hash size={14} /> Count
                    </Btn>
                  </div>
                </div>
                {countResult !== null && (
                  <div className="p-3 rounded-lg bg-neutral-100 text-sm text-neutral-700">
                    Matching memories:{" "}
                    <span className="font-bold text-violet-600">
                      {countResult}
                    </span>
                  </div>
                )}
                {healthData && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
                      healthData.status === "ok" ||
                      healthData.status === "healthy"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }`}
                  >
                    <Activity size={14} />
                    API Status:{" "}
                    <strong className="ml-1">{healthData.status}</strong>
                  </div>
                )}
                {statsData && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          label: "Memories",
                          value: statsData.total_memories,
                          icon: BookOpen,
                        },
                        {
                          label: "Links",
                          value: statsData.total_links,
                          icon: GitFork,
                        },
                        {
                          label: "Density",
                          value: statsData.link_density
                            ? (statsData.link_density as number).toFixed(2)
                            : "—",
                          icon: BarChart3,
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="p-3 rounded-xl bg-white border border-neutral-200 text-center"
                        >
                          <stat.icon
                            size={16}
                            className="mx-auto mb-1 text-violet-400"
                          />
                          <p className="text-xl font-bold text-neutral-900">
                            {stat.value}
                          </p>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    {statsData.top_tags && statsData.top_tags.length > 0 ? (
                      <div>
                        <p className="text-[11px] text-neutral-400 mb-2 uppercase tracking-wider font-medium">
                          Top Tags
                        </p>
                        <div className="space-y-1.5">
                          {(statsData.top_tags as TopTag[])
                            .slice(0, 10)
                            .map((t: TopTag, i: number) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs font-mono text-neutral-600 min-w-0 truncate flex-1">
                                  {t.tag}
                                </span>
                                <div className="shrink-0 w-24 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${Math.min(
                                        100,
                                        (t.count /
                                          (statsData.top_tags[0] as TopTag)
                                            .count) *
                                          100,
                                      )}%`,
                                    }}
                                    className="h-full rounded-full bg-violet-500"
                                  />
                                </div>
                                <span className="text-[10px] text-neutral-400 w-5 text-right">
                                  {t.count}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-neutral-400 py-4">
                        No tags found
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
