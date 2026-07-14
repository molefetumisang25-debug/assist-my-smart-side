import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  FileText,
  MessageSquare,
  Notebook,
  Search,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/")({
  component: Index,
});

const modules = [
  {
    to: "/chat",
    icon: MessageSquare,
    title: "AI Chat",
    body: "Streaming conversations with markdown, code, and full history.",
  },
  {
    to: "/planner",
    icon: Calendar,
    title: "AI Planner",
    body: "Day, week, month, and year plans generated in seconds.",
  },
  {
    to: "/research",
    icon: Search,
    title: "Task Research",
    body: "Rigorous reports with citations and source comparisons.",
  },
  {
    to: "/documents",
    icon: FileText,
    title: "Document Assistant",
    body: "Upload PDFs, Word, Excel, PPT. Summarize, translate, ask.",
  },
  {
    to: "/notes",
    icon: Notebook,
    title: "Smart Notes",
    body: "Write, rewrite, grammar-fix, and summarize — all in one editor.",
  },
] as const;

function Index() {
  return (
    <AppShell>
      <section className="relative flex-1 overflow-hidden bg-hero">
        <div className="mx-auto flex max-w-6xl flex-col px-6 pb-16 pt-16 md:pt-24">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Premium AI workspace · v1.0
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-7xl">
              One workspace for <br />
              <span className="text-gradient">every AI task.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              GETSMART AI Assistant combines chat, planning, research, document intelligence, and
              smart notes into a single fast, focused interface — designed for people who ship.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/chat"
                className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                style={{ boxShadow: "var(--shadow-glow)" }}
              >
                Launch Chat
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/research"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-5 py-3 text-sm font-semibold backdrop-blur hover:bg-card"
              >
                Try Research
              </Link>
            </div>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.to}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
                >
                  <Link
                    to={m.to}
                    className="group relative block h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:bg-card/80"
                  >
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-100"
                      style={{ background: "var(--gradient-primary)" }}
                    />
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{m.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {m.body}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      Open
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
