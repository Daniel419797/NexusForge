# NexusForge Frontend

NexusForge is the web control plane for the Reuse backend platform. This repository contains the production Next.js frontend; the backend lives in `Daniel419797/Reuse`.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS 4
- Axios + TanStack Query
- Zustand
- Vitest + Testing Library

## Local development

The frontend runs on port **3001**. The Reuse backend defaults to port **3000**.

Create a local environment file and point the frontend at the backend:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws
```

Then install and start the frontend:

```bash
npm install
npm run dev
```

Open http://localhost:3001.

API requests use the same-origin `/api/v1` path and are rewritten to `NEXT_PUBLIC_BACKEND_URL`. WebSocket traffic uses `NEXT_PUBLIC_WS_URL`.

## Authentication

Browser sessions use secure HTTP-only cookies issued by the Reuse backend. Short-lived access tokens are kept only in memory when needed for WebSocket authentication. Access and refresh JWTs must not be persisted in `localStorage` or `sessionStorage`.

## Quality checks

```bash
npm run lint
npm run test:run
npm run build
```

The production build also refreshes the published SDK catalog through `prebuild`.

## Source layout

- `src/app` — routes and layouts
- `src/components` — feature UI and reusable components
- `src/services` — backend API clients
- `src/store` — client state
- `src/hooks` — reusable hooks
- `src/lib` — shared utilities, auth, security, and SDK helpers
- `src/types` — shared frontend types

See `FRONTEND_STRUCTURE.md` for the detailed architecture handoff.
