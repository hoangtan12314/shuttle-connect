# Shuttle Connect — frontend

React 19 + Vite, organized with **Feature-Sliced Design (FSD)**. Full plan, rationale and build
order: `/Users/admin/.claude/plans/check-for-the-flow-keen-flask.md` (local to this machine, not in
the repo). Backend API contract: `@shuttle-connect/types` (`packages/types/src`).

## Current status (update this as files go from placeholder to real)

Everything below is **scaffolded and verified working** (`pnpm run build` and `pnpm run lint` both
pass clean): dependencies installed, shadcn/ui primitives generated into `src/shared/ui/`, Tailwind
v4 theme, TanStack Router plugin wired into `vite.config.ts`, Vitest + MSW + RTL, Playwright,
steiger, Prettier + lint-staged, `infra/web.ts` env injection.

Every other file — everything under `app/`, `pages/`, `widgets/`, `features/`, `entities/`,
`shared/api`, `shared/config` — is a **one-line comment placeholder**, not implemented. Written so
far, in order:

- [x] `shared/api/client.ts` — `ApiError` class (done)
- [ ] `shared/api/client.ts` — `apiRequest<T>()` (**next**: unwrap `ApiSuccessResponse<T>` /
      throw `ApiError` on `ApiErrorResponse`; Authorization header deliberately deferred until
      `features/auth` exists)
- [ ] `shared/config/env.ts` — typed `import.meta.env` access
- [ ] `entities/session` — first real FSD slice (`useSessions`, `SessionCard`)
- [ ] `app/main.tsx` + `app/routes/__root.tsx` + `app/routes/index.tsx` — enough to render
      something in the browser
- [ ] everything else

Pick up exactly here on a fresh session: write `apiRequest<T>` in `shared/api/client.ts` next.

## Architecture: Feature-Sliced Design

```
app/        composition root: providers, router, global styles
pages/      one slice per screen (pages/<name>/ui/<Name>Page.tsx + index.ts)
widgets/    large page sections combining an entity + a feature
features/   one user action per slice (join-session, decide-request, create-session, ...)
entities/   one domain noun per slice: model + read queries + display UI
shared/     no business knowledge: shadcn/ui, api client, env config
```

**Import rule** (checked by `pnpm run lint:fsd`, i.e. `steiger`): a layer may only import from the
layers below it. `entities/` never imports from `features/`; `shared/` never imports from anything.
Each slice exposes only its `index.ts` — import `@/entities/session`, never
`@/entities/session/ui/SessionCard`.

Maps onto the backend's Clean Architecture:

| Backend | Frontend |
|---|---|
| `domain/` entities | `entities/` |
| `application/` use cases | `features/` |
| `controller/` | `pages/` + `app/routes/` |
| `infrastructure/` | `shared/api`, `app/providers` |

`steiger` is zero-config (recognizes these folder names directly — no `steiger.config.ts`). A
fresh scaffold reports "insignificant slice" warnings for every slice nothing imports yet; these
resolve on their own as slices get wired together, don't chase them to zero artificially. One
accepted nitpick: `app/providers` isn't a canonical segment name (`ui`/`api`/`model`), which is the
normal FSD exception for cross-cutting app setup.

## Stack

| Concern | Choice |
|---|---|
| UI | shadcn/ui (`src/shared/ui`, regenerate via `npx shadcn@latest add <component>`) on Tailwind v4 |
| Routing | TanStack Router, file-based (`src/app/routes`), type-safe search params |
| Server state | TanStack Query — all API data goes through this, never raw `useEffect` fetches |
| Client state | Zustand — only for genuinely client-global state; most state is Query or local `useState` |
| Auth | react-oidc-context against the Cognito hosted UI (code + PKCE); sends the **ID token** as Bearer |
| Forms | React Hook Form + Zod |
| Testing | Vitest + React Testing Library + MSW (unit/component), Playwright (e2e) |

## Commands

```bash
pnpm run dev          # vite — needs a .env.local with VITE_API_URL etc. if not run via sst:dev
pnpm run build         # tsc -b && vite build
pnpm run lint          # eslint . — code quality
pnpm run lint:fsd      # steiger ./src — FSD architecture boundaries (separate from lint on purpose)
pnpm run test          # vitest run
pnpm run test:e2e      # playwright test — needs the real API (pnpm run sst:dev) and the two Bruno test users
pnpm run format        # prettier --write .
```

From the repo root, `pnpm run sst:dev` starts the real backend + this frontend together, with
`VITE_API_URL`/`VITE_COGNITO_*` injected automatically (`infra/web.ts`).

## Known rough edges from the current scaffold

- Route files under `app/routes/` are empty placeholders — `pnpm run dev` will warn "does not
  export a Route" for each until you add `createFileRoute(...)`. Expected, not a bug.
- shadcn's registry now publishes `cn` and `radix-ui` as real npm packages instead of generating a
  local `lib/utils.ts` — don't go looking for one.
- MSW 3.x renamed `onUnhandledRequest` → `onUnhandledFrame` (already correct in
  `src/test/setup.ts`, worth knowing if a guide/example online still shows the old name).
