import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Download,
  Pencil,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  type ChatThread,
  createThread,
  deleteThread,
  readThreads,
  renameThread,
  upsertThread,
} from "@/lib/chat-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat/$threadId")({
  ssr: false,
  component: ChatPage,
});

function ChatPage() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [threadId, setThreadId] = useState<string>(params.threadId);
  const [initial, setInitial] = useState<UIMessage[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Hydrate: pick or create thread based on URL
  useEffect(() => {
    const all = readThreads();
    let t = all.find((x) => x.id === params.threadId);
    if (!t) {
      // reuse an existing empty thread if present, else create
      t = all.find((x) => x.messages.length === 0) ?? createThread();
      upsertThread(t);
    }
    setThreads(readThreads());
    setThreadId(t.id);
    setInitial(t.messages);
    setHydrated(true);
    if (params.threadId !== t.id) {
      navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.threadId]);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message || "Chat failed"),
  });

  // Reset messages when switching threads
  useEffect(() => {
    setMessages(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // Persist messages
  useEffect(() => {
    if (!hydrated || !threadId) return;
    const current = readThreads().find((t) => t.id === threadId);
    if (!current) return;
    const firstUser = messages.find((m) => m.role === "user");
    const derivedTitle =
      firstUser && current.title === "New chat"
        ? (getPlainText(firstUser).slice(0, 60) || "New chat")
        : current.title;
    upsertThread({ ...current, title: derivedTitle, messages });
    setThreads(readThreads());
  }, [messages, threadId, hydrated]);

  // Focus composer
  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId, status]);

  const filtered = threads.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()),
  );

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)] flex-1 md:h-screen">
        {/* Thread list */}
        <div className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
          <div className="border-b border-border p-3">
            <button
              onClick={() => {
                const t = createThread();
                upsertThread(t);
                navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New chat
            </button>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {filtered.length === 0 && (
              <p className="p-4 text-xs text-muted-foreground">No chats yet.</p>
            )}
            <ul className="flex flex-col gap-0.5">
              {filtered.map((t) => {
                const active = t.id === threadId;
                return (
                  <li key={t.id} className="group relative">
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                        active ? "bg-secondary" : "hover:bg-secondary/60",
                      )}
                    >
                      <Link
                        to="/chat/$threadId"
                        params={{ threadId: t.id }}
                        className="flex min-w-0 flex-1 items-center gap-2"
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{t.title}</span>
                      </Link>
                      <button
                        aria-label="Rename"
                        onClick={() => {
                          const name = window.prompt("Rename chat", t.title);
                          if (name && name.trim()) {
                            renameThread(t.id, name.trim());
                            setThreads(readThreads());
                          }
                        }}
                        className="rounded p-1 opacity-0 hover:bg-background group-hover:opacity-100"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        aria-label="Delete"
                        onClick={() => {
                          if (!window.confirm("Delete this chat?")) return;
                          deleteThread(t.id);
                          const next = readThreads();
                          setThreads(next);
                          if (active) {
                            const first = next[0];
                            navigate({
                              to: "/chat/$threadId",
                              params: { threadId: first?.id ?? "new" },
                              replace: true,
                            });
                          }
                        }}
                        className="rounded p-1 opacity-0 hover:bg-destructive/20 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Conversation */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 truncate">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="truncate font-medium">
                {threads.find((t) => t.id === threadId)?.title ?? "New chat"}
              </span>
            </div>
            <button
              onClick={() => exportMarkdown(threads.find((t) => t.id === threadId), messages)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs hover:bg-secondary/70"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>

          <Conversation className="min-h-0 flex-1">
            <ConversationContent>
              {messages.length === 0 && (
                <ConversationEmptyState
                  icon={<Sparkles className="h-8 w-8 text-primary" />}
                  title="Start a conversation"
                  description="Ask anything — from research questions to code. Responses stream in real-time."
                />
              )}
              {messages.map((m) => (
                <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
                  <MessageContent>
                    <MessageResponse>{getPlainText(m)}</MessageResponse>
                  </MessageContent>
                </Message>
              ))}
              {status === "submitted" && (
                <Message from="assistant">
                  <MessageContent>
                    <Shimmer>Thinking…</Shimmer>
                  </MessageContent>
                </Message>
              )}
              {error && (
                <p className="text-xs text-destructive">{error.message}</p>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t border-border bg-background/80 p-3 backdrop-blur">
            <div className="mx-auto max-w-3xl">
              <PromptInput
                onSubmit={(m) => {
                  const text = m.text?.trim();
                  if (!text || isBusy) return;
                  sendMessage({ text });
                }}
              >
                <PromptInputTextarea
                  ref={inputRef}
                  placeholder="Message GETSMART…"
                />
                <PromptInputFooter className="justify-end">
                  <PromptInputSubmit status={status} />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function getPlainText(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}

function exportMarkdown(thread: ChatThread | undefined, messages: UIMessage[]) {
  if (!thread) return;
  const md = [
    `# ${thread.title}`,
    `_Exported ${new Date().toLocaleString()}_`,
    "",
    ...messages.map((m) => `**${m.role === "user" ? "You" : "GETSMART"}:**\n\n${getPlainText(m)}\n`),
  ].join("\n");
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${thread.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
