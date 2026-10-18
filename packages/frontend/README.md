# Shuttle Connect — frontend

React 19 + Vite, organized with **Feature-Sliced Design (FSD)**. Scaffold build order (now
historical — the scaffold is long finished): `/Users/admin/.claude/plans/check-for-the-flow-keen-flask.md`.
Current work is a UI redesign against a design artifact, tracked at
`/Users/admin/.claude/plans/warm-scribbling-parnas.md` (both local to this machine, not in the
repo). Backend API contract: `@shuttle-connect/types` (`packages/types/src`).

## Current status (update this as files go from placeholder to real)

Past the initial scaffold now — most of the app is real, working business logic, not placeholder
comments. `pnpm run build`, `pnpm run lint`, and `pnpm run lint:fsd` all pass clean. Check this
list before assuming a file is still a stub; it changes incrementally across sessions.

**Real and functional:**
- `shared/api`, `shared/config`, `shared/i18n` (vi/en), `shared/lib` (formatters), `shared/ui`
  (shadcn primitives + the app's design tokens — see `app/styles/index.css`)
- `entities/session`, `entities/request`, `entities/user` (`useMe` — `UserAvatar.tsx` is still a
  placeholder, nothing currently renders it standalone)
- `features/auth`, `features/join-session`, `features/decide-request`, `features/filter-sessions`
- `widgets/app-shell`, `widgets/session-browser`, `widgets/host-requests-panel`,
  `widgets/session-detail`
- `pages/browse-sessions`, `pages/session-detail`
- Routes: `/`, `/sessions/$sessionId`, `/callback` are real; `/activity`, `/notifications`,
  `/profile`, `/sessions/new`, `/sessions/$sessionId/manage` are intentional "coming soon" stubs
  (their own route files, not yet backed by a `pages/` slice)

**Still placeholder (one-line comment, not implemented):**
- `entities/court` (whole slice — `useCourts`, `CourtOption`)
- `features/create-session`, `features/update-profile` (whole slices)
- `pages/create-session`, `pages/profile`

Pick up here next: `features/create-session` + `pages/create-session` (Phase 4 of the UI-refactor
plan — host flows), which also needs `entities/court` for the district→court picker.

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

## Known rough edges

- shadcn's registry now publishes `cn` and `radix-ui` as real npm packages instead of generating a
  local `lib/utils.ts` — don't go looking for one.
- MSW 3.x renamed `onUnhandledRequest` → `onUnhandledFrame` (already correct in
  `src/test/setup.ts`, worth knowing if a guide/example online still shows the old name).
- `pnpm run lint` has a standing baseline of 7 `react-refresh/only-export-components` errors, one
  per "coming soon" stub route (`__root.tsx`, `activity.tsx`, `callback.tsx`, `notifications.tsx`,
  `profile.tsx`, `sessions.$sessionId.manage.tsx`, `sessions.new.tsx`) — each defines its page
  component inline in the route file instead of a separate module. Pre-existing, not introduced by
  whatever you're currently working on; confirm with `git stash && pnpm run lint` before assuming
  a change caused it.
