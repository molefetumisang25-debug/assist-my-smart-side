import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "google/gemini-3-flash-preview";

async function runModel(system: string, prompt: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible");
  const gateway = createOpenAICompatible({
    name: "lovable",
    baseURL: GATEWAY_URL,
    headers: { "Lovable-API-Key": key },
  });
  const { text } = await generateText({
    model: gateway(MODEL),
    system,
    prompt,
  });
  return text;
}

/* ---------- RESEARCH ---------- */
const ResearchInput = z.object({
  topic: z.string().min(2).max(500),
  depth: z.enum(["brief", "standard", "deep"]).default("standard"),
});

export const generateResearch = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ResearchInput.parse(raw))
  .handler(async ({ data }) => {
    const system = `You are an expert research analyst. Produce a rigorous, well-structured markdown research report.
Rules:
- Start with # <Topic>
- Sections: Executive Summary, Background, Key Findings, Comparative Analysis, Recommendations, References
- Use bullet points and tables where useful
- In References, list plausible sources with title + URL in markdown link syntax. Mark speculative sources as (unverified).
- Depth: ${data.depth}`;
    const text = await runModel(system, `Research topic: ${data.topic}`);
    return { report: text };
  });

/* ---------- PLANNER ---------- */
const PlannerInput = z.object({
  goal: z.string().min(2).max(500),
  horizon: z.enum(["day", "week", "month", "year"]).default("week"),
  context: z.string().max(1000).optional(),
});

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => PlannerInput.parse(raw))
  .handler(async ({ data }) => {
    const system = `You are an elite productivity coach. Produce a realistic, time-blocked ${data.horizon} plan in JSON.
Return ONLY valid JSON (no code fences) matching:
{"summary": string, "blocks": [{"title": string, "when": string, "duration_min": number, "priority": "low"|"medium"|"high", "notes"?: string}]}
Aim for 6-12 blocks, balanced across deep work, meetings, rest, and habits.`;
    const text = await runModel(
      system,
      `Goal: ${data.goal}\nContext: ${data.context ?? "n/a"}`,
    );
    // best-effort JSON parse
    try {
      const clean = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      return JSON.parse(clean);
    } catch {
      return { summary: text, blocks: [] };
    }
  });

/* ---------- NOTES AI ACTIONS ---------- */
const NotesInput = z.object({
  content: z.string().min(1).max(20000),
  action: z.enum(["rewrite", "grammar", "summarize", "expand", "translate"]),
  language: z.string().optional(),
});

export const noteAction = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => NotesInput.parse(raw))
  .handler(async ({ data }) => {
    const systems: Record<string, string> = {
      rewrite: "Rewrite the following note to be clearer, tighter, and more compelling. Preserve meaning. Output markdown only.",
      grammar: "Fix all grammar, spelling, and punctuation. Preserve voice. Output only the corrected text.",
      summarize: "Summarize into a punchy TL;DR followed by 3-5 bullet points. Output markdown.",
      expand: "Expand into a fuller, well-structured version with headings and examples. Output markdown.",
      translate: `Translate to ${data.language ?? "English"}. Preserve markdown structure.`,
    };
    const text = await runModel(systems[data.action], data.content);
    return { text };
  });

/* ---------- DOCUMENT ASSISTANT (text-based) ---------- */
const DocInput = z.object({
  text: z.string().min(1).max(80000),
  question: z.string().max(2000).optional(),
  mode: z.enum(["summarize", "explain", "qa", "translate", "extract_tables"]),
  language: z.string().optional(),
});

export const documentAction = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => DocInput.parse(raw))
  .handler(async ({ data }) => {
    const systems: Record<string, string> = {
      summarize: "Summarize this document. Return markdown with: TL;DR, Key Points (bullets), Notable Data.",
      explain: "Explain this document to a smart non-expert. Markdown with headings.",
      qa: `Answer the user's question strictly from the document. Cite short quoted snippets. Question: ${data.question ?? ""}`,
      translate: `Translate the document to ${data.language ?? "English"}. Preserve structure.`,
      extract_tables: "Extract every table from the document. Output as markdown tables. If none, say so.",
    };
    const text = await runModel(systems[data.mode], data.text);
    return { text };
  });
