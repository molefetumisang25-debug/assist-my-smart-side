import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { generatePlan } from "@/lib/ai.functions";
import { useLocalStorage } from "@/lib/local-storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Planner — GETSMART" },
      { name: "description", content: "AI-generated daily, weekly, monthly, and yearly plans." },
    ],
  }),
  component: PlannerPage,
});

type Priority = "low" | "medium" | "high";
type Task = {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  when?: string;
  notes?: string;
};

const HORIZONS = ["day", "week", "month", "year"] as const;
type Horizon = (typeof HORIZONS)[number];

function PlannerPage() {
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>("getsmart:tasks:v1", []);
  const [goal, setGoal] = useState("");
  const [horizon, setHorizon] = useState<Horizon>("week");
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string>("");

  async function handleGenerate() {
    if (!goal.trim()) return toast.error("Enter a goal");
    setBusy(true);
    try {
      const res = (await generatePlan({
        data: { goal: goal.trim(), horizon, context: context.trim() || undefined },
      })) as {
        summary?: string;
        blocks?: Array<{
          title: string;
          when?: string;
          duration_min?: number;
          priority?: Priority;
          notes?: string;
        }>;
      };
      setSummary(res.summary ?? "");
      const newTasks: Task[] = (res.blocks ?? []).map((b) => ({
        id: crypto.randomUUID(),
        title: b.title,
        done: false,
        priority: b.priority ?? "medium",
        when: b.when,
        notes: b.notes,
      }));
      setTasks([...newTasks, ...tasks]);
      toast.success(`Added ${newTasks.length} tasks`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setBusy(false);
    }
  }

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.done).length,
    high: tasks.filter((t) => t.priority === "high" && !t.done).length,
  };
  const progress = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> AI Planner
            </div>
            <h1 className="font-display text-4xl font-bold">Plan smarter, ship faster.</h1>
          </div>
          <div className="hidden rounded-xl border border-border bg-card px-4 py-3 text-right md:block">
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="font-display text-2xl font-bold text-gradient">{progress}%</div>
            <div className="text-[11px] text-muted-foreground">
              {stats.done}/{stats.total} · {stats.high} high-priority
            </div>
          </div>
        </header>

        <div className="mb-8 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium capitalize",
                  horizon === h
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {h}
              </button>
            ))}
          </div>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={`What do you want to accomplish this ${horizon}?`}
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary/50"
          />
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Optional context — energy, constraints, existing commitments"
            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary/50"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              GETSMART will draft a realistic time-blocked plan.
            </p>
            <button
              onClick={handleGenerate}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate plan
            </button>
          </div>
          {summary && (
            <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
              {summary}
            </p>
          )}
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Tasks & Habits
            </h2>
            <button
              onClick={() =>
                setTasks([
                  {
                    id: crypto.randomUUID(),
                    title: "New task",
                    done: false,
                    priority: "medium",
                  },
                  ...tasks,
                ])
              }
              className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs hover:bg-secondary/70"
            >
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No tasks yet. Generate a plan or add one manually.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {tasks.map((t, i) => (
                <motion.li
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.02 }}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <button
                    onClick={() =>
                      setTasks(
                        tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                      )
                    }
                    className="mt-0.5 shrink-0"
                    aria-label={t.done ? "Mark undone" : "Mark done"}
                  >
                    {t.done ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <input
                      value={t.title}
                      onChange={(e) =>
                        setTasks(
                          tasks.map((x) =>
                            x.id === t.id ? { ...x, title: e.target.value } : x,
                          ),
                        )
                      }
                      className={cn(
                        "w-full bg-transparent text-sm font-medium outline-none",
                        t.done && "text-muted-foreground line-through",
                      )}
                    />
                    {(t.when || t.notes) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.when && <span>{t.when}</span>}
                        {t.when && t.notes && " · "}
                        {t.notes}
                      </p>
                    )}
                  </div>
                  <select
                    value={t.priority}
                    onChange={(e) =>
                      setTasks(
                        tasks.map((x) =>
                          x.id === t.id
                            ? { ...x, priority: e.target.value as Priority }
                            : x,
                        ),
                      )
                    }
                    className={cn(
                      "rounded-md border bg-background px-2 py-1 text-xs",
                      t.priority === "high" && "border-accent/50 text-accent",
                      t.priority === "medium" && "border-border",
                      t.priority === "low" && "border-border text-muted-foreground",
                    )}
                  >
                    <option value="low">low</option>
                    <option value="medium">med</option>
                    <option value="high">high</option>
                  </select>
                  <button
                    onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))}
                    className="rounded p-1 text-muted-foreground opacity-0 hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
