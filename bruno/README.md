# Bruno API collection

[Bruno](https://www.usebruno.com/) collection for the Shuttle Connect API. Requests are
plain-text `.bru` files, so they diff and review like code.

**Several routes in here don't exist on the server yet** -- see "What's not implemented
yet" below. Those requests are written against the *planned* contract
(`check-for-the-flow-keen-flask.md`) on purpose, so running the collection doubles as a
checklist: each one starts failing with a connection/404 error and starts passing the
moment the matching endpoint is built correctly.

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

## Authentication -- two users

`AuthGuard` is live in all three Lambdas. Everything except the public GET routes
(`GET /sessions`, `GET /sessions/:id`, `GET /courts/:id`) needs a valid Cognito ID token.

This collection uses **two** test users, because once D4 (`CannotJoinOwnSessionError`) is
built, a host can no longer join their own session -- every "someone joins a session"
request needs a *different* person than whoever hosted it:

| User | Role | Token variable | How requests use it |
|---|---|---|---|
| `test@example.com` ("the host") | creates courts, sessions; approves/rejects requests | `{{idToken}}` | the collection's **default** -- `auth: inherit` resolves to this |
| `player@example.com` ("the player") | joins sessions, views their own bookings | `{{idToken2}}` | set explicitly with `auth: bearer` + `auth:bearer { token: {{idToken2}} }` on each request that needs it |

### One-time setup

1. Create **both** test users in the deployed pool (`name` is required -- it's a required
   Cognito attribute):
   ```bash
   aws cognito-idp admin-create-user --user-pool-id <userPoolId> --username test@example.com \
     --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
                        Name=name,Value="Test User" \
     --message-action SUPPRESS
   aws cognito-idp admin-set-user-password --user-pool-id <userPoolId> \
     --username test@example.com --password 'Test1234!' --permanent

   aws cognito-idp admin-create-user --user-pool-id <userPoolId> --username player@example.com \
     --user-attributes Name=email,Value=player@example.com Name=email_verified,Value=true \
                        Name=name,Value="Test Player" \
     --message-action SUPPRESS
   aws cognito-idp admin-set-user-password --user-pool-id <userPoolId> \
     --username player@example.com --password 'Test1234!' --permanent
   ```
   Get `userPoolId` from the `sst dev`/`sst deploy` output.
2. Fill in `cognitoClientId`, `testEmail`, `testEmail2` and `awsRegion` in
   `environments/dev.bru`.
3. Create `bruno/.env` (git-ignored) with `TEST_PASSWORD=Test1234!` -- one password for
   both users, see the file already there for the exact format. The password never enters
   a committed `.bru` file.

### Every run

Run **Auth / Login** and **Auth / Login as Player** first (or `bru run` picks both up
automatically -- `seq: 0`, before every other folder). They log in directly against
Cognito's public `InitiateAuth` API and save `idToken`/`idToken2` (and `accessToken`, used
only by one negative test) as environment variables.

**ID tokens last 1 hour.** If protected requests start failing with an unexpected 401,
re-run both Logins.

`USER_PASSWORD_AUTH` (what Login uses) is only enabled on non-production stages --
see `explicitAuthFlows` in `infra/auth.ts`.

## The flow

Folders run in dependency order:

```
Auth            ->  Login, Login as Player     sets {{idToken}}, {{idToken2}}
Courts          ->  Create Court               sets {{courtId}}
Sessions        ->  Create Session             needs {{courtId}}; sets {{sessionId}}, {{userId}}
Requests        ->  Create Request (player)    needs {{sessionId}}; sets {{playerId}}
Host Decisions  ->  Approve (host)              needs {{sessionId}}, {{playerId}}
User            ->  Get/Update Profile          the host's own profile
```

## What's not implemented yet

These requests are written against routes that don't exist on the server yet -- each
one's `docs` block says what's expected once it's built, and most point back at the plan.

| Folder | Request | Route |
|---|---|---|
| Sessions | `List Sessions` | `GET /sessions?city=&district=` (currently `listAll()` stub, returns `[]`) |
| Sessions | `My Hosted Sessions` | `GET /sessions/mine` |
| Courts | `List Courts by Location`, `- mismatched pair` | `GET /courts?city=&district=` |
| Requests | `Join Own Session` | 400 check inside `POST /requests` (D4) |
| Requests | `Create Request - duplicate` | 409 fix inside `POST /requests` (D3; currently 500) |
| Requests | `My Requests` | `GET /requests/mine` |
| User | `Get Profile`, `Update Profile` | `GET /users/me`, `PATCH /users/me` -- no controller or Lambda exist yet |
| Host Decisions | *(whole folder)* | `GET /sessions/:id/requests`, `PATCH /sessions/:id/requests/:userId` |

`GSI1`/`GSI2` are already populated correctly by every create (index redesign) -- these
are pure read/write additions on top of data that's already shaped right. Verify GSI1
directly with the AWS CLI snippet in **List Sessions**' docs if you want to check before
the route exists.

## What the already-working negative cases pin down

| Request | Asserts |
|---|---|
| `Auth / No token`, `Malformed token`, `Wrong scheme` | 401 `UNAUTHORIZED` -- different rejection paths inside `AuthGuard` (missing header, bad JWT, non-Bearer scheme) |
| `Auth / Access token instead of ID token` | 401 -- the verifier's `tokenUse: 'id'` actually rejects access tokens |
| `Sessions / Create Session - no token`, `Requests / Create Request - no token` | 401 -- catches a feature module silently losing `imports: [AuthModule]`, which would otherwise return 201 with nothing else noticing |
| `Create Court - invalid city+district` | 400 `INVALID_CITY_DISTRICT` -- a bad pair can't persist an unreachable `location` partition |
| `Get Court by Id - not found` | 404 `ENTITY_NOT_FOUND` |
| `Create Request - unknown session` | 404 before the request repository is touched |

## Response envelope

Success is wrapped by `ResponseTransformInterceptor`, errors shaped by
`GlobalExceptionFilter`:

```json
{ "success": true,  "data": { } }
{ "success": false, "error": { "code": "...", "statusCode": 400, "message": "..." } }
```
