# GETSMART AI Assistant

A modern, production-ready AI-powered workspace that combines chat, planning, research, document intelligence, and smart notes into one fast, focused interface.

Built with the **Lovable stack** (TanStack Start, Lovable Cloud / Supabase-ready, Lovable AI Gateway), **React 19**, **Tailwind CSS v4**, **TypeScript**, and **Framer Motion**.

---

## Features

| Module | Description |
|--------|-------------|
| **AI Chat** | Threaded, streaming conversations with markdown, code blocks, and full localStorage history. |
| **AI Planner** | Generate realistic, time-blocked day / week / month / year plans from a goal and optional context. |
| **Task Research** | Produce structured research reports with executive summaries, findings, comparisons, and references. |
| **Document Assistant** | Extract text from PDFs, then summarize, explain, translate, ask questions, or extract tables. |
| **Smart Notes** | Rich markdown editor with AI actions: rewrite, grammar fix, summarize, expand, and translate. |

---

## Tech Stack

### Frontend
- **React 19** + **TanStack Start** (full-stack SSR/SSG framework)
- **TanStack Router** for file-based routing and type-safe navigation
- **TanStack Query** for server-state management
- **Tailwind CSS v4** with semantic design tokens
- **shadcn/ui** + **Radix UI** primitives
- **Framer Motion** / **Motion** for animations
- **Lucide React** for icons

### Backend
- **TanStack server functions** (`createServerFn`) for app-internal logic
- **Server routes** under `src/routes/api/` for public endpoints
- **Lovable AI Gateway** for GPT / Gemini / Claude access via the OpenAI-compatible API

### AI
- **AI SDK v7** (`ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`)
- Default model: `google/gemini-3-flash-preview`
- Gateway URL: `https://ai.gateway.lovable.dev/v1`

### Database / Auth (Cloud-ready)
- Designed for **Lovable Cloud / Supabase** persistence
- Current MVP uses **localStorage** for chat threads and research history
- Authentication not enabled yet (designed to add Clerk / Firebase / Supabase Auth later)

---

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- `bun` (preferred) or `npm` / `pnpm`
- A Lovable AI Gateway key (`LOVABLE_API_KEY`)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd getsmart-ai-assistant

# Install dependencies
bun install

# Copy the environment template
cp .env.example .env

# Edit .env and add your LOVABLE_API_KEY
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Required — Lovable AI Gateway key
LOVABLE_API_KEY=your_lovable_api_key_here

# Optional — Supabase (when Cloud auth / DB is enabled)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> Never commit `.env` to version control. It is already listed in `.gitignore`.

### Run Locally

```bash
# Development server
bun dev

# Production build
bun run build

# Preview production build
bun run preview
```

The app will be available at `http://localhost:8080` by default.

---

## Project Structure

```text
getsmart-ai-assistant/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── ai-elements/     # Reusable AI UI primitives (conversation, message, prompt input, shimmer)
│   │   ├── app-shell.tsx    # Global navigation shell
│   │   └── ui/              # shadcn/ui components + custom controls
│   ├── hooks/
│   │   └── use-mobile.tsx   # Mobile / responsive detection hook
│   ├── lib/
│   │   ├── ai-gateway.server.ts    # Lovable AI Gateway provider
│   │   ├── ai.functions.ts         # createServerFn AI actions (research, planner, notes, documents)
│   │   ├── chat-store.ts           # localStorage chat thread persistence
│   │   ├── local-storage.ts        # useLocalStorage hook
│   │   ├── rate-limit.server.ts    # In-memory sliding-window rate limiter
│   │   └── utils.ts                # Tailwind / helper utilities
│   ├── routes/
│   │   ├── api/
│   │   │   └── chat.ts             # Streaming chat endpoint
│   │   ├── __root.tsx              # Root layout + head metadata
│   │   ├── index.tsx               # Home / landing page
│   │   ├── chat.index.tsx          # Chat list + new thread
│   │   ├── chat.$threadId.tsx      # Active chat thread
│   │   ├── planner.tsx             # AI Planner page
│   │   ├── research.tsx            # Task Research page
│   │   ├── documents.tsx           # Document Assistant page
│   │   ├── notes.tsx               # Smart Notes page
│   │   └── sitemap[.]xml.ts        # Dynamic sitemap
│   ├── router.tsx              # TanStack Router setup
│   ├── server.ts               # Server runtime entry
│   ├── start.ts                # Start config + middleware
│   └── styles.css              # Tailwind v4 + semantic design tokens
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── .prettierrc
└── README.md
```

---

## API Documentation

### Server Functions (`createServerFn`)

All AI actions are callable via TanStack server functions. They are typed RPC endpoints — the client imports and calls them directly, and the framework handles transport.

| Function | Method | Input | Output | Rate Limit |
|----------|--------|-------|--------|------------|
| `generateResearch` | `POST` | `{ topic: string, depth: "brief" \| "standard" \| "deep" }` | `{ report: string }` | 5 / min |
| `generatePlan` | `POST` | `{ goal: string, horizon: "day" \| "week" \| "month" \| "year", context?: string }` | JSON plan object | 10 / min |
| `noteAction` | `POST` | `{ content: string, action: "rewrite" \| "grammar" \| "summarize" \| "expand" \| "translate", language?: string }` | `{ text: string }` | 15 / min |
| `documentAction` | `POST` | `{ text: string, mode: "summarize" \| "explain" \| "qa" \| "translate" \| "extract_tables", question?: string, language?: string }` | `{ text: string }` | 10 / min |

### Public HTTP Endpoint

#### `POST /api/chat`

Streaming chat completions for the AI Chat module.

**Request body**

```json
{
  "messages": [
    { "role": "user", "parts": [{ "text": "Hello!" }] }
  ]
}
```

Validation rules:
- `messages` max length: **40**
- Each message `parts` max length: **50**
- Each `parts.text` max length: **8,000** characters
- Total payload max size: **60,000** characters
- `role` must be `"user"`, `"assistant"`, or `"system"`

The system prompt is hardcoded on the server; clients cannot override it.

**Response**

A streaming `text/event-stream` of assistant tokens.

**Rate limit:** 20 requests per minute per IP.

**Error responses**

| Status | Reason |
|--------|--------|
| 400 | Invalid or oversized payload |
| 429 | Rate limit exceeded (`Retry-After` header provided) |
| 500 | Internal / AI gateway error |

---

## Security

- **System prompt hardening**: the chat system prompt is server-side only; clients cannot inject or override it.
- **Input validation**: all AI endpoints validate input with **Zod** and enforce strict length limits.
- **Rate limiting**: per-IP sliding-window rate limits protect every AI endpoint from abuse.
- **Input sanitization**: payloads are validated and bounded before being sent to the AI gateway.
- **Environment isolation**: `LOVABLE_API_KEY` and Supabase keys are server-only environment variables.
- **No auth in MVP**: designed for future JWT / Clerk / Firebase / Supabase Auth integration.
- **Role-based access**: database schema should keep user roles in a separate table when auth is added.

---

## Deployment

### Vercel (Frontend)

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add the environment variables (`LOVABLE_API_KEY`).
4. Set the build command to `bun run build` and output directory to `dist`.
5. Deploy.

### Lovable Cloud

Lovable Cloud can host the full TanStack Start app with SSR, database, and auth out of the box. Enable Cloud in the Lovable editor to connect Supabase, storage, and managed deployments.

### Docker (optional)

A `Dockerfile` can be added to containerize the Vite build and serve it with a static adapter or Node runtime. For the Cloudflare Workers edge target that TanStack Start uses by default, prefer the Lovable / Cloudflare deploy path.

---

## Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start the Vite development server |
| `bun run build` | Production build |
| `bun run build:dev` | Development-mode build |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint |
| `bun run format` | Format all files with Prettier |

---

## Future Roadmap

- [ ] Authentication (email + Google sign-in)
- [ ] Cloud-persistent chat threads, research history, and notes
- [ ] User roles and RBAC
- [ ] Tasks module with due dates, reminders, and calendar integration
- [ ] Document storage and multi-file uploads
- [ ] AI model selector (GPT-4o, Claude, Gemini)
- [ ] Voice input / text-to-speech
- [ ] Mobile PWA support

---

## License

[MIT](LICENSE)

---

Built with Lovable.
