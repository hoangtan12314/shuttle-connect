# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shuttle Connect — a badminton session-booking app. pnpm workspace monorepo with a NestJS backend deployed to AWS Lambda via SST (ion/v3), a React/Vite frontend (still the unmodified starter template — no real UI built yet), and a shared types package. Infra (`infra/`, `sst.config.ts`) lives at the repo root, not inside a package.

```
packages/
  frontend/   React 19 + Vite, boilerplate only
  server/     NestJS, Clean Architecture layout, deployed both as a normal app and as a Lambda
  types/      @shuttle-connect/types — shared request/response contracts + enums, consumed as compiled JS
infra/        SST resource definitions (Dynamo table, API Gateway, Lambda function)
sst.config.ts SST app entry — imports ./infra to register resources
documentation/DATABASE_DESIGN.md   DynamoDB single-table design rationale — read this before touching the data model
```

## Commands

Run from repo root unless noted. `pnpm --filter <name>` targets one package (`frontend`, `server`, or `@shuttle-connect/types`).

```bash
pnpm install                # installs all workspace packages
pnpm run build:types        # compiles @shuttle-connect/types to dist/ — required before the others can pick up type changes
pnpm run dev:server         # builds types, then `nest start --watch`
pnpm run dev:frontend       # builds types, then `vite`
pnpm run build:frontend     # builds types, then frontend production build

pnpm run sst:dev            # builds types, then `sst dev` (Live Lambda dev mode against real AWS resources)
pnpm run sst:deploy         # builds types, then `sst deploy`
pnpm run sst:remove         # `sst remove`
```

Inside `packages/server`:
```bash
pnpm run start:dev          # nest start --watch (only if @shuttle-connect/types is already built)
pnpm run build              # nest build -> dist/ (not what actually runs in Lambda, see below)
pnpm test                   # jest unit tests (src/**/*.spec.ts) — none exist yet
pnpm test:e2e                # jest against test/ — test/app.e2e-spec.ts is stale leftover from the Nest starter (expects a `GET /` route that no longer exists) and will fail
```

Inside `packages/types`, `pnpm run build` (`tsc -p tsconfig.json`) must be re-run any time its source changes — nothing else watches it automatically.

## Architecture

### The `@shuttle-connect/types` build step is load-bearing, not optional

This package's `package.json` points `main`/`types` at `dist/index.js` / `dist/index.d.ts`, not raw `src/`. It must be compiled before `server` or `frontend` can see changes to it. This isn't a style choice: raw `.ts` barrel files (`export * from './enums'`) only resolve under Node's lenient CommonJS rules, and both Node's native `.ts` execution *and* SST's esbuild Lambda bundler apply strict resolution once they detect ESM syntax — a bare directory import breaks under that. Giving the package a real compiled `dist/` output sidesteps the whole problem. If you add new exports to `packages/types/src`, run `pnpm run build:types` (or the affected `dev:*`/`sst:*` script, which does it for you) before expecting other packages to see them.

### Cross-package dependency declarations must be explicit

Every package that imports something — including `@shuttle-connect/types` and `sst` (used in `server`'s DynamoDB table-name provider via `import { Resource } from 'sst'`) — must declare it in its own `package.json`. pnpm does not hoist packages into a workspace member's `node_modules` unless that member's manifest lists it; anything that resolves without being declared is only doing so by accident (Node/esbuild walking up to a parent directory's `node_modules`), which breaks the moment the package is built or deployed in isolation from the rest of the monorepo.

### `moduleResolution` differs per package on purpose

`tsconfig.base.json` sets `"module": "ESNext"` / `"moduleResolution": "Bundler"` — correct for `frontend`, where Vite's own bundler does real resolution and TypeScript only type-checks (`noEmit: true`). `server` and `types` override this to `"nodenext"`, because their compiled output is what Node actually executes directly (no bundler in front) — this makes relative-import extension and directory-resolution rules exactly as strict as Node's real runtime behavior. Don't copy import styles between `frontend` and `server` assuming they're interchangeable.

### Server: Clean Architecture layering

```
domain/           entities (Session, Court, User, Request), repository interfaces, domain errors, value objects
application/      use cases — one class per operation, injected with a repository interface (not a concrete implementation)
infrastructure/   DynamoDB repository implementations, NestJS DI modules (ioc/), Lambda entrypoint, REST interceptor
controller/       NestJS controllers, request DTOs (class-validator), the global exception filter
```

Only `session` has a complete vertical slice (controller → use case → repository → DynamoDB). `court`, `request`, and `user` have domain entities defined but their application/infrastructure layers are early/incomplete — don't assume full CRUD exists for them.

Domain entities follow one consistent shape: private constructor, `static create(props)` (validates and throws domain errors), `static fromPersistence(props)` (no validation, used when rehydrating from storage), and `toJSON()`. Repositories are interfaces defined in `domain/`, bound to a DI token (`Symbol`, e.g. `SESSION_REPOSITORY`) and implemented in `infrastructure/dynamodb/`. When adding a repository method, register any new providers it needs in the relevant `infrastructure/ioc/*.module.ts` — a provider that exists but isn't added to a module's `providers` array fails at DI resolution time (or per-request, for constructor-injected dependencies deeper in the chain), not at compile time.

### Error handling: domain error hierarchy → HTTP status

`DomainError` (abstract, carries a `code`) → category subclasses `NotFoundError` / `ValidationError` / `ConflicError` (all abstract) → concrete errors (e.g. `EntityNotFoundError extends NotFoundError`). `GlobalExceptionFilter` (`controller/filters/`) maps by category base class to an HTTP status (404/400/409, else 500) and shapes the JSON body as `ApiErrorResponse` from `@shuttle-connect/types`. To get a specific status code for a new error, extend one of the category classes, not `DomainError` directly. Successful responses are wrapped by `ResponseTransformInterceptor` into `ApiSuccessResponse<T>` (`{ success: true, data }`) — both response shapes live in `@shuttle-connect/types` so `frontend` can consume the same contract.

### Server has two separate entrypoints

- `main.ts` — full `AppModule`, plain Express via `NestFactory.create`, used for local dev (`start:dev`) and would-be conventional deployment.
- `infrastructure/function/lambda/session.lambda.ts` — bootstraps **only** `SessionModule` (not `AppModule`), wraps it with `@codegenie/serverless-express`, and is what SST actually deploys. It registers its own filter/interceptor instances independently of `main.ts`. If you add a new feature module, it won't reach the deployed Lambda unless this file (or a corresponding new Lambda entry + `infra/function.ts` route) is updated to include it.

### Infra (SST v3 / "ion")

`sst.config.ts` (repo root) just does `await import("./infra")` in `run()` — every file under `infra/` registers its resources as a module-load side effect via `infra/index.ts`'s barrel export; a resource file not re-exported there never gets deployed. `infra/function.ts` bundles the Lambda straight from server's TypeScript source via esbuild (no `nest build`/`tsc` step involved) and explicitly excludes some packages from the bundle (`@aws-sdk/*`, unused `@nestjs/microservices` and `@nestjs/websockets` subpaths) via `nodejs.esbuild.external`. `infra/database.ts` defines the single DynamoDB table and its 3 GSIs — see `documentation/DATABASE_DESIGN.md` for the full access-pattern rationale; note the doc's generic naming (`GSI1`/`district`) doesn't exactly match the concrete SST resource (`LocationIndex`/`location`), and the doc's Streams-based denormalization sync + Request-item persistence are design intent, not yet implemented. `.sst/` and `sst-env.d.ts` (generated in every package, auto-injected `Resource` types) are gitignored — never hand-edit them.

### Commit convention

Commit messages are enforced by commitlint (husky `commit-msg` hook) using Conventional Commits with a fixed scope enum: `frontend`, `server`, `types`, `infra`, `root` (see `commitlint.config.js`). A commit outside that scope list will be rejected.
