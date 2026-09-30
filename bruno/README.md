# Bruno API collection

[Bruno](https://www.usebruno.com/) collection for the Shuttle Connect API. Requests are
plain-text `.bru` files, so they diff and review like code.

## Setup

Open the desktop app and point it at this folder (**Open Collection** -> `bruno/`), or use
the CLI:

```bash
npm install -g @usebruno/cli
cd bruno
bru run --env dev
```

## Environments

| Env | Use |
|---|---|
| `local` | `http://localhost:3000` -- the Nest server from `main.ts` (AppModule, all three modules) |
| `dev` | The deployed API Gateway stage. **Paste your URL into `environments/dev.bru` first.** |

Get the deployed URL from the `sst dev` / `sst deploy` output (`shuttle-connect-api`).

For `local`, note the DynamoDB and Cognito providers resolve `Resource[...]`, so a bare
`pnpm run dev:server` crashes at boot. Run it with SST bindings:

```bash
npx sst shell -- pnpm run dev:server
```

## Authentication

`AuthGuard` is live in all three Lambdas. Everything except the three GET routes
(`GET /sessions`, `GET /sessions/:id`, `GET /courts/:id`, all `@Public()`) needs a valid
Cognito ID token.

The collection sends it automatically: `collection.bru` sets `auth { mode: bearer }` with
`token: {{idToken}}`, and every protected request has `auth: inherit`. You only have to
populate `{{idToken}}`, which the **Auth** folder does for you.

### One-time setup

1. Create a test user in the deployed pool (requires `name` -- it's a required attribute):
   ```bash
   aws cognito-idp admin-create-user --user-pool-id <userPoolId> --username test@example.com \
     --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
                        Name=name,Value="Test User" \
     --message-action SUPPRESS
   aws cognito-idp admin-set-user-password --user-pool-id <userPoolId> \
     --username test@example.com --password 'Test1234!' --permanent
   ```
   Get `userPoolId` from the `sst dev`/`sst deploy` output.
2. Fill in `cognitoClientId`, `testEmail` and `awsRegion` in `environments/dev.bru`.
3. Create `bruno/.env` (git-ignored) with `TEST_PASSWORD=Test1234!` -- see the file already
   there for the exact format. The password never enters a committed `.bru` file.

### Every run

Run **Auth / Login** first (or `bru run` picks it up automatically -- it's `seq: 0`, before
every other folder). It logs in directly against Cognito's public `InitiateAuth` API and
saves `idToken` (and `accessToken`, used only by one negative test) as environment variables.

**The ID token lasts 1 hour.** If protected requests start failing with an unexpected 401,
re-run **Auth / Login**.

`USER_PASSWORD_AUTH` (what Login uses) is only enabled on non-production stages --
see `explicitAuthFlows` in `infra/auth.ts`.

## The flow

Folders run in dependency order:

```
Auth      ->  Login               sets {{idToken}}, {{accessToken}}
Courts    ->  Create Court        sets {{courtId}}
Sessions  ->  Create Session      needs {{courtId}}; sets {{sessionId}}, {{userId}}
Requests  ->  Create Request      needs {{sessionId}}; asserts its userId matches {{userId}}
```

## What the negative cases pin down

| Request | Asserts |
|---|---|
| `Auth / No token`, `Malformed token`, `Wrong scheme` | 401 `UNAUTHORIZED` -- different rejection paths inside `AuthGuard` (missing header, bad JWT, non-Bearer scheme) |
| `Auth / Access token instead of ID token` | 401 -- the verifier's `tokenUse: 'id'` actually rejects access tokens |
| `Sessions / Create Session - no token`, `Requests / Create Request - no token` | 401 -- catches a feature module silently losing `imports: [AuthModule]`, which would otherwise return 201 with nothing else noticing |
| `Create Court - invalid city+district` | 400 `INVALID_CITY_DISTRICT` -- a bad pair can't persist an unreachable `location` partition |
| `Get Court by Id - not found` | 404 `ENTITY_NOT_FOUND` |
| `Create Request - unknown session` | 404 before the request repository is touched |
| `Create Request - duplicate` | **500 today** -- the condition check works, but `ConditionalCheckFailedException` isn't a `DomainError`, so it isn't mapped to 409. Asserting current behaviour on purpose; see the request's docs. |

## Response envelope

Success is wrapped by `ResponseTransformInterceptor`, errors shaped by
`GlobalExceptionFilter`:

```json
{ "success": true,  "data": { } }
{ "success": false, "error": { "code": "...", "statusCode": 400, "message": "..." } }
```

## Not covered

Browse-by-district, listing courts, "my hosted sessions" and "my requests". `GET /sessions`
returns `[]` unconditionally -- `SessionRepositoryDynamoDB.listAll()` is a stub and there are
no `?city=&district=` params yet, no `GET /courts`, and no `GET /sessions/mine` /
`GET /requests/mine`. `GSI1` and `GSI2` are populated and correct as of the index redesign
(see `documentation/DATABASE_DESIGN.md`); verify GSI1 with the AWS CLI snippet in the
**List Sessions** docs.
