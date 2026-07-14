import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  Languages,
  Loader2,
  Notebook,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { noteAction } from "@/lib/ai.functions";
import { MarkdownBlock } from "./research";
import { useLocalStorage } from "@/lib/local-storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "AI Notes — GETSMART" },
      { name: "description", content: "Markdown notes with AI rewrite, grammar fix, and summarize." },
    ],
  }),
  component: NotesPage,
});

type Note = { id: string; title: string; content: string; updatedAt: number };

function NotesPage() {
  const { value: notes, setValue: setNotes, hydrated } = useLocalStorage<Note[]>(
    "getsmart:notes:v1",
    [],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  const active = useMemo(
    () => notes.find((n) => n.id === activeId) ?? notes[0] ?? null,
    [notes, activeId],
  );

  function update(patch: Partial<Note>) {
    if (!active) return;
    setNotes(
      notes.map((n) =>
        n.id === active.id ? { ...n, ...patch, updatedAt: Date.now() } : n,
      ),
    );
  }

  function newNote() {
    const n: Note = {
      id: crypto.randomUUID(),
      title: "Untitled",
      content: "# Untitled\n\nStart writing…",
      updatedAt: Date.now(),
    };
    setNotes([n, ...notes]);
    setActiveId(n.id);
  }

  async function ai(action: "rewrite" | "grammar" | "summarize" | "expand" | "translate") {
    if (!active) return;
    setBusy(true);
    try {
      const res = await noteAction({
        data: {
          content: active.content,
          action,
          language: action === "translate" ? window.prompt("Language?", "Spanish") || "Spanish" : undefined,
        },
      });
      update({ content: res.text });
      toast.success("Updated with AI");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)] flex-1 md:h-screen">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
          <div className="border-b border-border p-3">
            <button
              onClick={newNote}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New note
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {hydrated && notes.length === 0 && (
              <p className="p-4 text-xs text-muted-foreground">No notes yet.</p>
            )}
            {notes.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                  active?.id === n.id ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <button
                  onClick={() => setActiveId(n.id)}
                  className="min-w-0 flex-1 truncate text-left"
                >
                  {n.title || "Untitled"}
                </button>
                <button
                  onClick={() => {
                    if (!window.confirm("Delete note?")) return;
                    setNotes(notes.filter((x) => x.id !== n.id));
                    if (active?.id === n.id) setActiveId(null);
                  }}
                  className="rounded p-1 opacity-0 hover:bg-destructive/20 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <Notebook className="h-10 w-10 text-primary" />
              <div>
                <h2 className="font-display text-xl font-semibold">No note selected</h2>
                <p className="mt-1 text-sm text-muted-foreground">Create your first note.</p>
              </div>
              <button
                onClick={newNote}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Create note
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
                <input
                  value={active.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="Title"
                  className="min-w-0 flex-1 bg-transparent px-2 font-display text-lg font-semibold outline-none"
                />
                <div className="flex items-center gap-1">
                  <ToolbarBtn onClick={() => setPreview((p) => !p)} icon={BookOpenCheck} label={preview ? "Edit" : "Preview"} />
                  <ToolbarBtn onClick={() => ai("rewrite")} icon={Wand2} label="Rewrite" busy={busy} />
                  <ToolbarBtn onClick={() => ai("grammar")} icon={Sparkles} label="Grammar" busy={busy} />
                  <ToolbarBtn onClick={() => ai("summarize")} icon={Sparkles} label="Summarize" busy={busy} />
                  <ToolbarBtn onClick={() => ai("translate")} icon={Languages} label="Translate" busy={busy} />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {preview ? (
                  <div className="mx-auto max-w-3xl p-8">
                    <MarkdownBlock>{active.content}</MarkdownBlock>
                  </div>
                ) : (
                  <textarea
                    value={active.content}
                    onChange={(e) => update({ content: e.target.value })}
                    placeholder="Write in markdown…"
                    className="h-full min-h-[60vh] w-full resize-none bg-background p-8 font-mono text-sm leading-relaxed outline-none"
                  />
                )}
              </div>
              <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                Autosaved · {new Date(active.updatedAt).toLocaleTimeString()}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ToolbarBtn({
  onClick,
  icon: Icon,
  label,
  busy,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs hover:bg-secondary/70 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
