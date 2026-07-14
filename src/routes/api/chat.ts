import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { DEFAULT_MODEL, getGateway } from "@/lib/ai-gateway.server";
import { checkRateLimit } from "@/lib/rate-limit.server";

const SYSTEM_PROMPT =
  "You are GETSMART AI, a premium, thoughtful assistant. Respond concisely with clear structure, use markdown, and code fences when helpful.";

const MAX_MESSAGES = 40;
const MAX_TEXT_LEN = 8000;
const MAX_TOTAL_LEN = 60000;

const TextPart = z.object({ type: z.literal("text"), text: z.string().max(MAX_TEXT_LEN) });
const AnyPart = z.union([
  TextPart,
  z.object({ type: z.string() }).passthrough(),
]);
const MessageSchema = z.object({
  id: z.string().max(200).optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(AnyPart).min(1).max(50),
});
const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(MAX_MESSAGES),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown";
        const rl = checkRateLimit(`chat:${ip}`, 20, 60_000);
        if (!rl.ok) {
          return new Response("Too many requests", {
            status: 429,
            headers: { "Retry-After": String(rl.retryAfter) },
          });
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return new Response("Invalid request", { status: 400 });
        }

        const totalLen = parsed.data.messages.reduce((sum, m) => {
          for (const p of m.parts) {
            if (p.type === "text" && typeof (p as { text?: unknown }).text === "string") {
              sum += (p as { text: string }).text.length;
            }
          }
          return sum;
        }, 0);
        if (totalLen > MAX_TOTAL_LEN) {
          return new Response("Payload too large", { status: 413 });
        }

        const gateway = getGateway();
        try {
          const result = streamText({
            model: gateway(DEFAULT_MODEL),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(parsed.data.messages as UIMessage[]),
          });
          return result.toUIMessageStreamResponse({
            originalMessages: parsed.data.messages as UIMessage[],
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "AI request failed";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
