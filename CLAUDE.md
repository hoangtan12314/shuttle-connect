# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shuttle Connect — a badminton session-booking app. pnpm workspace monorepo with a NestJS backend deployed to AWS Lambda via SST (ion/v3) with Cognito for authentication, a React/Vite frontend (still the unmodified starter template — no real UI built yet), and a shared types package. Infra (`infra/`, `sst.config.ts`) lives at the repo root, not inside a package.

```
packages/
  frontend/   React 19 + Vite, boilerplate only
  server/     NestJS, Clean Architecture layout, deployed both as a normal app and as a Lambda
  types/      @shuttle-connect/types — shared request/response contracts + enums, consumed as compiled JS
infra/        SST resource definitions (Dynamo table, API Gateway, Lambda functions, Cognito user pool)
sst.config.ts SST app entry — imports ./infra to register resources
bruno/        Bruno API collection for the local and deployed API — see bruno/README.md
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

`dev:server` and `start:dev` can't boot bare: the DynamoDB and Cognito providers read SST's `Resource[...]`, so run them with SST bindings — `npx sst shell -- pnpm run dev:server`. The local server also skips `ResponseTransformInterceptor` (see the entrypoints section), so its success responses aren't wrapped in `{ success, data }` the way the deployed API's are.

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

Vertical slices (controller → use case → repository → DynamoDB) exist for `session` (create, get by id — `listAll` is a stub that returns `[]`), `court` (create, get by id) and `request` (create only). `user` has an entity, repository and `ResolveCurrentUserUseCase` but no controller. Don't assume full CRUD exists for any of them.

Domain entities follow one consistent shape: private constructor, `static create(props)` (validates and throws domain errors), `static fromPersistence(props)` (no validation, used when rehydrating from storage), and `toJSON()`. Repositories are interfaces defined in `domain/`, bound to a DI token (`Symbol`, e.g. `SESSION_REPOSITORY`) and implemented in `infrastructure/dynamodb/`. When adding a repository method, register any new providers it needs in the relevant `infrastructure/ioc/*.module.ts` — a provider that exists but isn't added to a module's `providers` array fails at DI resolution time (or per-request, for constructor-injected dependencies deeper in the chain), not at compile time.

Two conventions exist because of how the server is bundled, and both fail only *after* deploy or silently:

- **Always inject with an explicit `@Inject(...)`**, even for concrete classes (`@Inject(CreateRequestUseCase)`, `@Inject(Reflector)`). SST bundles the Lambda with esbuild, which doesn't implement `emitDecoratorMetadata`, so Nest never receives `design:paramtypes`. Type-only injection works under `nest start`, then fails in the deployed Lambda with "Nest can't resolve dependencies". The same gap is why `ValidateBodyPipe` is handed its class explicitly instead of relying on the global `ValidationPipe`.
- **Annotate types wherever inference would fall back to `any`.** `server`'s tsconfig sets `noImplicitAny: false`, so an unannotated `let claims;` compiles even when the real type wouldn't — ID-token claims are typed `Json` by `aws-jwt-verify`, not `string`.

### Error handling: domain error hierarchy → HTTP status

`DomainError` (abstract, carries a `code`) → category subclasses `NotFoundError` / `ValidationError` / `ConflicError` (all abstract) → concrete errors (e.g. `EntityNotFoundError extends NotFoundError`). `GlobalExceptionFilter` (`controller/filters/`) maps by class to an HTTP status — `ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404, `ConflicError` 409, other `HttpException`s keep their own status, anything else 500 — and shapes the JSON body as `ApiErrorResponse` from `@shuttle-connect/types`. To get a specific status code for a new error, extend one of the category classes, not `DomainError` directly. `UnauthorizedError` and `ForbiddenError` are the exception: they are concrete classes extending `DomainError` directly, matched by name, so extend those for new 401/403 errors. Infrastructure errors are not mapped: an AWS SDK exception (e.g. the `ConditionalCheckFailedException` from a duplicate `POST /requests`) becomes a logged 500 unless the repository translates it into a domain error. Successful responses are wrapped by `ResponseTransformInterceptor` into `ApiSuccessResponse<T>` (`{ success: true, data }`) — both response shapes live in `@shuttle-connect/types` so `frontend` can consume the same contract.

### Auth: Cognito user pool + a global `AuthGuard`

Cognito authenticates; the app never handles passwords. `infra/auth.ts` defines the user pool (email sign-in; `name` is a **required** attribute) and a `Web` app client set up for the hosted-UI authorization-code flow (`callbackUrls` → `http://localhost:5173/callback`). There is no frontend auth code yet. Required attributes are immutable once a pool exists — changing them means replacing the pool, which destroys every user and changes every `sub`. Each Lambda links `userPool` and `userPoolClient`, so code reads `Resource['shuttle-connect-user-pool'].id` and `Resource.Web.id`; the `Resource` key is the string passed to the SST constructor / `addClient`, not the exported variable name.

Flow: the frontend sends the **ID token** as `Authorization: Bearer` — not the access token, because provisioning a user needs `email`/`name`, which access tokens don't carry. `AuthGuard` (`controller/guard/`) verifies it locally with `aws-jwt-verify` (`CognitoTokenVerifierProvider` in `infrastructure/auth/`, which `hydrate()`s the JWKS once at startup). `ResolveCurrentUserUseCase` then maps the Cognito `sub` to an internal user id, creating the user on first sight, and the guard sets `request.user = { id, externalAuthId }`. Controllers read it with `@CurrentUser()`; a route opts out with `@Public()`. A bad token is a 401, but failing to *reach* Cognito (`FetchError`) is deliberately left as a 500 — it's our outage, and a 401 would send the client into a pointless re-login.

Users have two ids on purpose. A user is `USER#<internalId>` (a `randomUUID()`) plus an `AUTH#<cognitoSub>` pointer item (`app_user_id` → internal id), written in one transaction. `user_id` on Session/Request items is meant to be the internal id, so nothing outside the guard depends on Cognito. First-request provisioning can race (two parallel first calls both find no user); the `attribute_not_exists` conditions let exactly one write win, and the loser re-reads with `ConsistentRead: true`.

`SessionModule`, `CourtModule` and `RequestModule` all `imports: [AuthModule]` (Nest dedupes it into one instance), so the guard is live in all three Lambdas. `GET /sessions`, `GET /sessions/:id` and `GET /courts/:id` are `@Public()`; everything else requires a token. Controllers read the caller with `@CurrentUser()` and pass `user.id` through — `SessionController.createSession`, `CreateRequestUseCase.execute(userId, input)` — so the old hardcoded `'1234'`/placeholder-constant ids are gone. Still hardcoded: both repositories' denormalized `user_name` (`session.repository.ts`, `request.repository.ts`) don't yet look up the real caller's name.

### Data-model conventions that are easy to break

`documentation/DATABASE_DESIGN.md` has the full rationale, including the `USER#`/`AUTH#` items above.

- `created_at` is a plain epoch-ms **number**, and place is stored as `location` (`"<CITY>#<DISTRICT>"`, e.g. `"HCM#HCM_DISTRICT_10"`). Domain and API types use `Date`/`string` and `city`/`district`; only the mappers convert (`toLocationKey`/`fromLocationKey` in `infrastructure/dynamodb/mapper/`). `City` values are short codes (`HCM`, `HN`, `DN`) — that is the wire contract.
- **GSI keys are explicit, generic attributes (`GSI1PK`/`GSI1SK`, `GSI2PK`/`GSI2SK`) written by `mapper/index-keys.ts`, never derived from a business field's name.** An item is in an index only if a repository/mapper actually calls one of those builders for it — not because it happens to carry certain field names. `GSI1` holds sessions (`SLOC#<city>#<district>`, sort by `start_time`) and courts (`CLOC#<city>#<district>`, sort by `created_at`) in separate partitions of one index; `GSI2` holds a user's hosted sessions (`USER#<id>` / `SESSION#<start_time>`) and join requests (`USER#<id>` / `REQUEST#<session_start_time>`), also in one partition, sorted together. `AUTH#` pointers and `USER#` items carry no GSI keys at all. See `documentation/DATABASE_DESIGN.md`.

### Server has two kinds of entrypoint

- `main.ts` — full `AppModule` via `NestFactory.create`, for local dev. It registers its own `ValidationPipe` and `GlobalExceptionFilter` but **not** `ResponseTransformInterceptor`, so local success responses aren't wrapped and differ from the deployed API.
- `infrastructure/function/lambda/{session,court,request}.lambda.ts` — one Lambda per feature. Each bootstraps **only its own module** (not `AppModule`) through the shared `bootstrapNestApp` in `config.lambda.ts` (global `ValidationPipe`, `ResponseTransformInterceptor`, `GlobalExceptionFilter`) and wraps it with `@codegenie/serverless-express`. `infra/function.ts` declares the three functions and `infra/api.ts` routes `/sessions`, `/courts` and `/requests` to them. A new feature module doesn't reach the deployed API unless it gets its own Lambda entry, an `infra/function.ts` function and `infra/api.ts` routes. Each entry caches the bootstrapped server in a module-level variable, so only a cold start pays for Nest's DI setup, including async providers such as the Cognito verifier's `hydrate()`.

### Infra (SST v3 / "ion")

`sst.config.ts` (repo root) just does `await import("./infra")` in `run()` — every file under `infra/` registers its resources as a module-load side effect via `infra/index.ts`'s barrel export; a resource file not re-exported there never gets deployed. `infra/function.ts` bundles each Lambda straight from server's TypeScript source via esbuild (no `nest build`/`tsc` step involved) and explicitly excludes some packages from the bundle (`@aws-sdk/*`, unused `@nestjs/microservices` and `@nestjs/websockets` subpaths) via `nodejs.esbuild.external`. `infra/database.ts` defines the single DynamoDB table and its 2 GSIs — see `documentation/DATABASE_DESIGN.md` for the full access-pattern rationale; the doc's Streams-based denormalization sync is still design intent, not yet implemented. `infra/auth.ts` defines the Cognito pool and client; its hosted-UI domain prefix (`shuttle-connect-<stage>`) is unique across all AWS accounts, so a first deploy can fail on a name clash. `.sst/` and `sst-env.d.ts` (generated in every package, auto-injected `Resource` types) are gitignored — never hand-edit them.

### Commit convention

Commit messages are enforced by commitlint (husky `commit-msg` hook) using Conventional Commits with a fixed scope enum: `frontend`, `server`, `types`, `infra`, `root` (see `commitlint.config.js`). A commit outside that scope list will be rejected.
