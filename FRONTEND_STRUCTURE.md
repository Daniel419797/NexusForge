# Frontend Folder Structure Handoff

Generated: 2026-05-21

This file captures how this project structures a Next.js frontend so the same conventions can be reused in another repository.

## Project Identity

- Framework: Next.js App Router
- Language: TypeScript, strict mode
- Main source root: `frontend/src`
- Import alias: `@/*` -> `src/*`
- Styling/UI: Tailwind CSS, shadcn-style UI primitives, Radix UI, lucide-react
- Data/API layer: Axios services in `src/services`
- Client state: Zustand-style stores in `src/store`
- Tests: Vitest, Testing Library, colocated `__tests__` folders plus `src/test`

## High-Level Tree

```txt
frontend/
|-- public/                         Static public assets
|-- scripts/                        Project maintenance scripts
|-- src/
|   |-- app/                        Next.js App Router routes and layouts
|   |   |-- (auth)/                 Auth route group
|   |   |   |-- forgot-password/
|   |   |   |-- login/
|   |   |   |-- register/
|   |   |   |-- reset-password/
|   |   |   `-- verify-email/
|   |   |-- (dashboard)/            Authenticated product shell
|   |   |   |-- ai/
|   |   |   |-- blockchain/
|   |   |   |-- chat/
|   |   |   |-- notifications/
|   |   |   |-- onboarding/
|   |   |   |-- projects/
|   |   |   |   `-- [id]/
|   |   |   |       |-- api/
|   |   |   |       |-- api-keys/
|   |   |   |       |-- assistant/
|   |   |   |       |-- deploy/
|   |   |   |       |-- documentation/
|   |   |   |       |-- frontend-integrations/
|   |   |   |       |-- plugins/
|   |   |   |       |-- sdk/
|   |   |   |       |-- settings/
|   |   |   |       `-- tables/
|   |   |   `-- sdk/
|   |   |-- (test)/                 Internal/manual test route group
|   |   |-- oauth/
|   |   |-- privacy/
|   |   |-- terms/
|   |   `-- unsubscribe/
|   |-- components/                 Reusable and feature-level React UI
|   |   |-- AI/
|   |   |-- ApiKeys/
|   |   |-- Auth/
|   |   |-- Blockchain/
|   |   |-- Chat/
|   |   |-- Dashboard/
|   |   |-- Landing/
|   |   |-- Notifications/
|   |   |-- Onboarding/
|   |   |-- Plugins/
|   |   |-- Projects/
|   |   |-- Shared/
|   |   |-- TestSite/
|   |   |-- layout/
|   |   `-- ui/                     Low-level design-system primitives
|   |-- hooks/                      Cross-feature React hooks
|   |-- lib/                        Shared utilities, tokens, security, SDK catalog
|   |-- services/                   Backend API clients and service guards
|   |-- store/                      App-level client stores
|   |-- test/                       Test setup and render helpers
|   `-- types/                      Shared frontend TypeScript types
|-- components.json                 shadcn/ui conventions and aliases
|-- next.config.mjs
|-- package.json
|-- tsconfig.json
`-- vitest.config.ts
```

## Route Conventions

Routes stay in `src/app`, grouped by user context:

- `(auth)`: login, registration, password reset, verification.
- `(dashboard)`: authenticated product experience.
- `(test)`: internal/manual test screens.
- Public informational routes: `privacy`, `terms`, `unsubscribe`.
- OAuth callback route: `oauth/callback`.

Route files are usually thin. Pages import larger feature components from `src/components/<Feature>` instead of keeping complex UI directly inside `page.tsx`.

## Component Conventions

`src/components` is organized by product feature, not by generic technical type.

Feature folders include:

- `AI`
- `ApiKeys`
- `Auth`
- `Blockchain`
- `Chat`
- `Dashboard`
- `Landing`
- `Notifications`
- `Onboarding`
- `Plugins`
- `Projects`
- `Shared`
- `TestSite`

Structural shell components live in `src/components/layout`.

Low-level reusable UI primitives live in `src/components/ui`. These are shadcn-style components such as buttons, dialogs, tabs, inputs, tables, badges, popovers, tooltips, and skeletons.

## Service Conventions

All backend calls are grouped under `src/services`.

Important patterns:

- `api.ts` owns the shared Axios instance.
- Service files are feature-scoped: `AuthService.ts`, `ProjectService.ts`, `DeployService.ts`, `FrontendIntegrationService.ts`, etc.
- `serviceGuards.ts` contains shared response/guard helpers.
- Service tests live under `src/services/__tests__`.

The shared Axios client uses:

- Base URL: `/api/v1`
- Cookie credentials enabled
- Bearer token fallback from stored access tokens
- Refresh handling for `401`
- Retry handling for Render cold-start `503`
- Global API error event hook for toast integration

## State, Hooks, Lib, Types

- `src/store`: shared client stores such as auth, projects, deploys, and onboarding.
- `src/hooks`: reusable hooks such as `useAccessToken` and `useWebSocket`.
- `src/lib`: cross-cutting utilities, auth token helpers, security/CSP helpers, SDK catalog, and module specs.
- `src/types`: shared TypeScript contracts used across components and services.
- `src/test`: test setup and shared render utilities.

## Testing Pattern

Tests are placed close to the code they validate when useful:

```txt
src/components/Auth/__tests__/
src/services/__tests__/
src/store/__tests__/
src/app/(dashboard)/projects/[id]/frontend-integrations/__tests__/
```

Global test setup lives in:

```txt
src/test/setup.ts
src/test/test-utils.tsx
```

## Replication Rule For Future Next.js Projects

When creating another frontend for this codebase style:

1. Use `src/app` only for routes, layouts, and route-specific loading/error boundaries.
2. Put real feature UI in `src/components/<FeatureName>`.
3. Put generic primitives in `src/components/ui`.
4. Put all API calls in `src/services`.
5. Put shared browser state in `src/store`.
6. Put reusable hooks in `src/hooks`.
7. Put shared utilities and framework helpers in `src/lib`.
8. Put shared DTOs/types in `src/types`.
9. Keep tests either colocated in `__tests__` or in `src/test` for shared helpers.
10. Use `@/` imports for anything inside `src`.

## Sibling Prototype Apps

This repository also has separate prototype apps under `new-frontend/`:

```txt
new-frontend/
|-- lost-and-found/
|-- mood-tracker/
`-- table-json/
```

Those are separate app folders. The structure captured above describes the main production frontend in `frontend/`.

## Visual Diagram

See the companion image:

```txt
frontend/FRONTEND_STRUCTURE.svg
```
