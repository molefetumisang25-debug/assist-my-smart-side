import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { DEFAULT_MODEL, getGateway } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown; system?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages required", { status: 400 });
        }
        const gateway = getGateway();
        const system =
          typeof body.system === "string" && body.system.length > 0
            ? body.system
            : "You are GETSMART AI, a premium, thoughtful assistant. Respond concisely with clear structure, use markdown, and code fences when helpful.";

        try {
          const result = streamText({
            model: gateway(DEFAULT_MODEL),
            system,
            messages: await convertToModelMessages(body.messages as UIMessage[]),
          });
          return result.toUIMessageStreamResponse({
            originalMessages: body.messages as UIMessage[],
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "AI request failed";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
