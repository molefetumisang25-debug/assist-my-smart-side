# GETSMART AI Assistant

A unified AI workspace that combines chat, planning, research, document intelligence, and smart notes into one fast, focused interface.

---

## Problem Statement

Knowledge workers juggle a dozen disconnected AI tools — one for chat, another for planning, a third for document Q&A, another for note rewriting. Context is lost between tabs, prompts are re-typed, history is scattered, and privacy/rate-limit rules differ across every vendor.

## Solution Overview

**GETSMART AI Assistant** is a single, production-ready web app that unifies the five most common AI workflows behind one consistent, secured, and modular UI:

| Module | What it does |
|--------|--------------|
| **AI Chat** | Threaded streaming conversations with markdown, code blocks, and full local history |
| **AI Planner** | Generates realistic time-blocked day / week / month / year plans from a goal |
| **Task Research** | Produces structured research reports with executive summaries, findings, and references |
| **Document Assistant** | Extracts text from PDFs and summarizes, explains, translates, or answers questions |
| **Smart Notes** | Markdown editor with AI actions: rewrite, grammar-fix, summarize, expand, translate |

All modules share one hardened server-side prompt layer, one rate limiter, and one AI gateway — so security and cost controls stay consistent.

---

## Tools Used

**Frontend:** React 19 · TanStack Start (SSR) · TanStack Router / Query · Tailwind CSS v4 · shadcn/ui + Radix · Framer Motion · Lucide React · TypeScript

**Backend:** TanStack server functions (`createServerFn`) · public HTTP routes under `src/routes/api/`

**AI:** AI SDK v7 (`ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`) · **Lovable AI Gateway** (OpenAI-compatible) · default model `google/gemini-3-flash-preview`

**Data (Cloud-ready):** Lovable Cloud / Supabase for future persistence · `localStorage` for MVP chat + research history

**Security:** Zod validation · per-IP sliding-window rate limiter · server-only system prompt · server-only env vars

**Tooling:** Vite 7 · Bun · ESLint · Prettier · TypeScript strict

---

## Installation

### Prerequisites
- Node.js 20+
- `bun` (preferred) or npm / pnpm
- A Lovable AI Gateway key (`LOVABLE_API_KEY`)

### Setup

```bash
git clone <repo-url>
cd getsmart-ai-assistant
bun install
cp .env.example .env   # then add LOVABLE_API_KEY
```

### Environment Variables

```env
LOVABLE_API_KEY=your_lovable_api_key_here

# Optional — for when Lovable Cloud / Supabase is enabled
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Never commit `.env`.

---

## Usage

```bash
bun dev              # start dev server at http://localhost:8080
bun run build        # production build
bun run preview      # preview production build
bun run lint         # ESLint
bun run format       # Prettier
```

Open `http://localhost:8080`, pick a module from the home page, and start prompting. Chat threads and research history persist automatically in your browser.

### Rate limits (per IP)

| Endpoint | Limit |
|----------|-------|
| `POST /api/chat` | 20 / min |
| `generateResearch` | 5 / min |
| `generatePlan` | 10 / min |
| `documentAction` | 10 / min |
| `noteAction` | 15 / min |

---

## Deployment

- **Vercel** — import the repo, set `LOVABLE_API_KEY`, build with `bun run build`.
- **Lovable Cloud** — one-click deploy with managed SSR, database, and auth.
- **Docker** — containerize the Vite build and serve with a Node or edge runtime.

---

## License

MIT
