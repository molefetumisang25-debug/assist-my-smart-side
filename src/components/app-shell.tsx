import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  Notebook,
  Search,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/planner", label: "Planner", icon: Calendar },
  { to: "/research", label: "Research", icon: Search },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/notes", label: "Notes", icon: Notebook },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2 py-1">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <Sparkles className="h-5 w-5 text-primary" />
            <div className="absolute inset-0 rounded-xl blur-md bg-primary/20" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-wide">GETSMART</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              AI Assistant
            </div>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Local-only mode
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Your data stays in this browser. Enable auth to sync across devices.
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-display text-sm font-semibold">GETSMART</span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.slice(1).map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md p-2 text-muted-foreground",
                  active && "bg-secondary text-foreground",
                )}
                aria-label={item.label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex min-w-0 flex-1 flex-col pt-14 md:pt-0">{children}</main>
    </div>
  );
}
