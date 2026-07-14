import type { UIMessage } from "ai";

export type ChatThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
};

const KEY = "getsmart:chat-threads:v1";

function safeParse(raw: string | null): ChatThread[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v as ChatThread[];
  } catch {
    /* ignore */
  }
  return [];
}

export function readThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY));
}

export function writeThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(threads));
}

export function createThread(): ChatThread {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

export function upsertThread(t: ChatThread) {
  const all = readThreads();
  const idx = all.findIndex((x) => x.id === t.id);
  const next = { ...t, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  writeThreads(all);
}

export function deleteThread(id: string) {
  writeThreads(readThreads().filter((t) => t.id !== id));
}

export function renameThread(id: string, title: string) {
  const all = readThreads();
  const t = all.find((x) => x.id === id);
  if (t) {
    t.title = title;
    t.updatedAt = Date.now();
    writeThreads(all);
  }
}
