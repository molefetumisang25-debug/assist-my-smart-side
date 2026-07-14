import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { Download, Loader2, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { generateResearch } from "@/lib/ai.functions";
import { useLocalStorage } from "@/lib/local-storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Task Research — GETSMART" },
      { name: "description", content: "Deep AI research with citations, comparisons, and reports." },
    ],
  }),
  component: ResearchPage,
});

type Depth = "brief" | "standard" | "deep";
type Report = { id: string; topic: string; depth: Depth; report: string; createdAt: number };

function ResearchPage() {
  const { value: history, setValue: setHistory } = useLocalStorage<Report[]>(
    "getsmart:research:v1",
    [],
  );
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<Depth>("standard");
  const [current, setCurrent] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!topic.trim()) return;
    setBusy(true);
    try {
      const res = await generateResearch({ data: { topic: topic.trim(), depth } });
      const r: Report = {
        id: crypto.randomUUID(),
        topic: topic.trim(),
        depth,
        report: res.report,
        createdAt: Date.now(),
      };
      setHistory([r, ...history]);
      setCurrent(r);
      toast.success("Report ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Research failed");
    } finally {
      setBusy(false);
    }
  }

  function download(r: Report) {
    const blob = new Blob([r.report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.topic.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-6 py-10 lg:grid-cols-[280px_1fr]">
        <aside>
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Search className="h-3.5 w-3.5" /> History
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {history.length === 0 && (
              <p className="text-xs text-muted-foreground">No reports yet.</p>
            )}
            {history.map((r) => (
              <button
                key={r.id}
                onClick={() => setCurrent(r)}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm",
                  current?.id === r.id
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-card hover:bg-secondary/60",
                )}
              >
                <span className="min-w-0 truncate">{r.topic}</span>
                <Trash2
                  className="hidden h-3.5 w-3.5 text-muted-foreground hover:text-destructive group-hover:block"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHistory(history.filter((x) => x.id !== r.id));
                    if (current?.id === r.id) setCurrent(null);
                  }}
                />
              </button>
            ))}
          </div>
        </aside>

        <section>
          <h1 className="font-display text-4xl font-bold">Research anything.</h1>
          <p className="mt-2 text-muted-foreground">
            Get a structured report with summary, findings, comparisons, and references.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              placeholder="e.g. Compare vector databases for RAG in 2026"
              className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary/50"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {(["brief", "standard", "deep"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepth(d)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs capitalize",
                      depth === d
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                onClick={run}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Research
              </button>
            </div>
          </div>

          {current && (
            <motion.article
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose-report mt-8 rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Report · {current.depth}
                </span>
                <button
                  onClick={() => download(current)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs hover:bg-secondary/70"
                >
                  <Download className="h-3.5 w-3.5" /> .md
                </button>
              </div>
              <MarkdownBlock>{current.report}</MarkdownBlock>
            </motion.article>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export function MarkdownBlock({ children }: { children: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-h1:text-3xl prose-h2:mt-8 prose-h2:text-xl prose-a:text-primary prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:bg-background prose-pre:border prose-pre:border-border">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
