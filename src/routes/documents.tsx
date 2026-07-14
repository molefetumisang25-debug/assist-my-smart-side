import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { documentAction } from "@/lib/ai.functions";
import { MarkdownBlock } from "./research";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "AI Document Assistant — GETSMART" },
      { name: "description", content: "Upload documents and ask AI to summarize, translate, or answer." },
    ],
  }),
  component: DocumentsPage,
});

type Mode = "summarize" | "explain" | "qa" | "translate" | "extract_tables";

function DocumentsPage() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("summarize");
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("English");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");

  async function onFile(file: File) {
    setFileName(file.name);
    setResult("");
    const name = file.name.toLowerCase();
    if (
      file.type.startsWith("text/") ||
      name.endsWith(".md") ||
      name.endsWith(".txt") ||
      name.endsWith(".csv") ||
      name.endsWith(".json")
    ) {
      setText(await file.text());
      toast.success("Loaded text file");
      return;
    }
    // Binary docs — extract text where possible
    if (name.endsWith(".pdf")) {
      try {
        toast.info("Extracting PDF text…");
        // @ts-expect-error - dynamic import of ESM lib without types resolution
        const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
        // @ts-expect-error - worker import
        const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        let out = "";
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          out += content.items.map((it: { str?: string }) => it.str ?? "").join(" ") + "\n\n";
        }
        setText(out.trim());
        toast.success(`Loaded ${doc.numPages} pages`);
      } catch (e) {
        toast.error("PDF extraction not available — paste text manually.");
        console.error(e);
      }
      return;
    }
    toast.message("Binary format — paste extracted text below to analyze.", {
      description: "Word/Excel/PowerPoint parsing runs best via the paste box for now.",
    });
  }

  async function run() {
    if (!text.trim()) return toast.error("Load a document or paste text first.");
    setBusy(true);
    try {
      const res = await documentAction({
        data: {
          text: text.slice(0, 80000),
          mode,
          question: mode === "qa" ? question : undefined,
          language: mode === "translate" ? language : undefined,
        },
      });
      setResult(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Document Assistant
        </div>
        <h1 className="font-display text-4xl font-bold">Understand any document.</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a PDF or paste text from Word, Excel, PowerPoint. GETSMART will read, summarize,
          translate, or answer questions.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground">
              <Upload className="h-4 w-4" />
              {fileName ?? "Click to upload PDF / TXT / MD / CSV"}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.txt,.md,.csv,.json,text/*"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="…or paste text here (Word/Excel/PPT: copy from source)"
              rows={16}
              className="mt-3 w-full resize-none rounded-lg border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary/50"
            />
            <div className="mt-2 text-right text-[11px] text-muted-foreground">
              {text.length.toLocaleString()} chars
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["summarize", "Summarize"],
                  ["explain", "Explain"],
                  ["qa", "Q&A"],
                  ["translate", "Translate"],
                  ["extract_tables", "Tables"],
                ] as [Mode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    mode === m
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "qa" && (
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Your question about the document"
                className="mt-3 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary/50"
              />
            )}
            {mode === "translate" && (
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Target language"
                className="mt-3 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary/50"
              />
            )}

            <button
              onClick={run}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Run
            </button>

            <div className="mt-5 min-h-[240px] rounded-lg border border-border bg-background p-4">
              {result ? (
                <MarkdownBlock>{result}</MarkdownBlock>
              ) : (
                <p className="text-sm text-muted-foreground">Results will appear here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
