# Shuttle Connect — DynamoDB Table Design

Single-table design for the Shuttle Connect badminton session-booking app. One physical table (`ShuttleConnectTable`) holds all entity types, with two Global Secondary Indexes (GSIs) supporting the access patterns below.

## Entities

| Entity | PK | SK |
|---|---|---|
| Session | `SESSION#<sessionId>` | `META` |
| Request (a user's request to join a session) | `SESSION#<sessionId>` | `REQUEST#<userId>` |
| Court | `COURT#<courtId>` | `META` |
| User | `USER#<userId>` | `META` |
| Auth pointer (Cognito `sub` → internal user id) | `AUTH#<cognitoSub>` | `META` |
| Notification (a recipient's copy of a request-lifecycle event) | `USER#<recipientId>` | `NOTIF#<epochMs>#<eventId>` |

Session and Request items share the same PK so a single `Query` on the base table returns a session together with every request against it (an "item collection"). The Auth pointer is a separate item from the User it resolves to — see `documentation` / `CLAUDE.md`'s "Auth" section for why identity is two ids, not one. Notification items share their recipient's User PK for the same reason — one `Query` on `PK = USER#<recipientId>, begins_with(SK, "NOTIF#")` lists them (see §5), no separate index. The recipient is whoever the event is *for* (host or player, depending on event type), not always the host.

**Place format — `location` is the only persisted place attribute.** Every place-bearing item (Court, Session, Request) stores exactly one field:

```
location = "<CITY>#<DISTRICT>"      e.g. "HCM#HCM_DISTRICT_10"
```

`city` is a short code (`HCM`, `HN`, `DN`) and `district` a city-prefixed code (`HCM_DISTRICT_10`, `HN_BA_DINH`, `DN_HAI_CHAU`), so the two halves are self-consistent. Neither is stored as its own attribute — both are **derived on read** by `fromLocationKey`. This keeps one field authoritative instead of two copies of the same value that could disagree.

`city`/`district` remain first-class in the domain and API layers — the `Court` entity holds both, `CreateCourtInput` accepts both (so a mismatched pair is rejected by `CITY_AREAS` validation), and every `*ItemResponse` returns both. **The DynamoDB mapper is the only place that converts between the two representations.**

**Timestamp format:** `startTime`, `endTime` and `created_at` are all stored as plain **Unix epoch milliseconds** (a `Number` type, e.g. `1785600000000`), not human-readable strings like `"18h"`. Numeric epoch values sort correctly as DynamoDB sort keys, and they convert directly to/from a JS `Date` on the app side. Unlike place, there is no type-prefixed exception here — see below for why `created_at` no longer needs one.

## Index keys are explicit, generic attributes — not reused business fields

Every GSI key is a dedicated attribute (`GSI1PK`, `GSI1SK`, `GSI2PK`, `GSI2SK`) written only by `packages/server/src/infrastructure/dynamodb/mapper/index-keys.ts`, never by giving an item's own business field (`location`, `user_id`, `start_time`, ...) the same name as an index's key. This is the central rule the rest of this document follows, and it replaces an earlier design where GSI keys *were* business fields — that version needed items to avoid certain field names (`session_start_time` instead of `start_time`, `app_user_id` instead of `user_id`) purely to stay out of an index they weren't meant to be in. Under generic keys, an item is in an index **only if** a repository/mapper explicitly calls one of the `index-keys.ts` builders for it. Membership is a decision, not a side effect of field naming.

## Access Patterns

| # | Access Pattern | Usage | Served by |
|---|---|---|---|
| 1 | Get a session and all its join requests | High | Main table |
| 2 | Browse sessions by city + district, sorted by start time | Medium-high | GSI1 |
| 3 | List courts by city + district | Medium | GSI1 |
| 4 | Get sessions a user hosts or has requested to join | Medium | GSI2 |
| 5 | List a user's request-lifecycle notifications, newest first | Low | Main table |

Access patterns #2–#4 are index-ready today (every write populates the right keys), but no
query/endpoint consumes #2–#4 yet — `GET /sessions` is still `SessionRepositoryDynamoDB.listAll()`
returning `[]`, and there is no `GET /courts` list, `GET /sessions/mine` or `GET /requests/mine`.
See `CLAUDE.md` for current endpoint status.

---

## 1. Get a session and its requests (Main table)

**Why:** Session and Request items share a PK, so DynamoDB physically groups them — one `Query` returns the session plus every join request, with no join and no extra index.

```
Query:
  PK = "SESSION#1"
```

Returns:
```
{ PK: "SESSION#1", SK: "META", court_id: "COURT#1", user_id: "USER#1" (host), ... }
{ PK: "SESSION#1", SK: "REQUEST#USER#2", user_id: "USER#2", status: "Pending", ... }
{ PK: "SESSION#1", SK: "REQUEST#USER#3", user_id: "USER#3", status: "Approved", ... }
```

To show only requests awaiting host approval, add `FilterExpression: status = "Pending"`. Since a session's item collection is small (bounded by max players), this filter is cheap — no separate index needed for this.

---

## 2 & 3. Browse sessions, and list courts, by city + district (GSI1)

```
GSI1PK = "SLOC#<city>#<district>"   (sessions)   e.g. "SLOC#HCM#HCM_DISTRICT_10"
       | "CLOC#<city>#<district>"   (courts)     e.g. "CLOC#HCM#HCM_DISTRICT_10"
GSI1SK = start_time                 (sessions, epoch ms)
       | created_at                 (courts, epoch ms)
```

Sessions and courts share one index in **separate partitions**, distinguished by the `SLOC#`/`CLOC#`
prefix — not by any difference in shape. Built by `sessionGsi1`/`courtGsi1` in `index-keys.ts`.
Request items get no `GSI1PK`/`GSI1SK` at all, so they can never appear in GSI1 — not because of a
field they avoid, but because nothing ever calls a GSI1 builder for a request.

```
Query on GSI1:
  GSI1PK = "SLOC#HCM#HCM_DISTRICT_10"
  GSI1SK between 1785600000000 and 1785700000000   (optional range for time-of-day filtering)
```
Returns every session in that district, sorted by start time.

```
Query on GSI1:
  GSI1PK = "CLOC#HCM#HCM_DISTRICT_10"
```
Returns every court in that district, sorted by creation time.

**Trade-off — no whole-city browse.** Because the partition key combines city and district, there is
no single query for "every session in Ho Chi Minh City" — that would require one query per district in
the city (fanned out client-side, e.g. over `CITY_AREAS[city]`) or a second index keyed on `city`
alone. Accepted deliberately: the primary screen is "sessions near me" (a specific district), and a
GSI can be added later online if that changes.

---

## 4. Sessions a user hosts or has requested to join (GSI2)

```
GSI2PK = "USER#<userId>"
GSI2SK = "SESSION#<start_time>"     (sessions this user hosts)
       | "REQUEST#<session_start_time>"   (sessions this user has requested to join)
```

Both a session's host and a request's requester get a `GSI2PK`/`GSI2SK` pair, built by
`sessionGsi2`/`requestGsi2` in `index-keys.ts` — so this one index answers "what is this user's
session activity" in a single `Query`, sorted by when the session happens (not when the row was
created). `USER#` profile items and `AUTH#` pointers get no GSI2 keys, so neither appears here.

```
Query on GSI2:
  GSI2PK = "USER#2"
```
Returns every session USER#2 hosts and every request they've made, interleaved by session time.

To fetch only one kind (e.g. two separate tabs in the app), narrow the key condition with the type
prefix:

```
Query on GSI2:
  GSI2PK = "USER#1"
  begins_with(GSI2SK, "SESSION#")   → sessions USER#1 hosts

Query on GSI2:
  GSI2PK = "USER#2"
  begins_with(GSI2SK, "REQUEST#")   → sessions USER#2 has requested
```

`begins_with` on a sort key is evaluated as part of the key condition, so DynamoDB only reads the
matching range — unlike a `FilterExpression`, which reads everything in the partition first and
discards non-matches afterward.

---

## 5. Request-lifecycle notifications (Main table)

**Why:** both sides of a join request need to know promptly when its status changes — the host
when someone joins/rejoins or withdraws (they may have already paid for the court), the player
when the host approves or rejects. Written by a DynamoDB Streams-triggered Lambda
(`request-status-changed`, `infra/notification.ts`), not inside the use cases that actually
change a request's status — decoupling the notification from that write means a notification
failure can never roll back, or even delay, the status change itself. See `CLAUDE.md`'s
late-withdrawal-protection section for the full rationale.

```
PK = "USER#<recipientId>"
SK = "NOTIF#<epochMs>#<eventId>"
```

`recipientId` is whoever should see this notification — the host for `REQUEST_CREATED`/
`REQUEST_WITHDRAWN`, the requesting player for `REQUEST_APPROVED`/`REQUEST_REJECTED` — not
always the host, despite the item still living in that person's own `USER#<id>` partition
(the same item collection their profile `META` row is in).

```
Query:
  PK = "USER#1"
  begins_with(SK, "NOTIF#")
  ScanIndexForward: false   (newest first)
  Limit: 30
```

Each item carries `type` (`NotificationType`: `REQUEST_CREATED`, `REQUEST_APPROVED`,
`REQUEST_REJECTED`, `REQUEST_WITHDRAWN`), `session_id`/`court_name`/`session_start_time` (copied
from the request item's own denormalized fields — no extra read), `actor_name` (whoever
performed the action: the player for `CREATED`/`WITHDRAWN`, the host for `APPROVED`/`REJECTED`),
`was_approved` (only meaningful for `WITHDRAWN`; the stream record's old image), `created_at`,
and `expires_at`.

**Delete-on-undo, not a second notification.** When a host undoes an `APPROVED`/`REJECTED`
decision back to `PENDING`, the player's earlier decision notice for that session is **deleted**
(`DeleteCommand` after a `Query` filtered on `session_id` and `type`) rather than a new "pending
again" notification being sent — the list always matches the request's current state. A small
partition (60-day TTL, at most a few dozen rows), so a filtered `Query` + per-item delete is fine
without a secondary index.

**Idempotency.** The stream can redeliver a record. The SK's `eventId` suffix is the stream
record's own `eventID`, and a create write uses `ConditionExpression: attribute_not_exists(SK)` —
a redelivery just fails that condition and is swallowed. A redelivered *delete* (undo) is
naturally idempotent the other way: the second attempt just finds nothing left to delete.

**Read watermark, not per-item read flags.** The `USER#<id>/META` item (the same item `findById`
already reads) gains one optional attribute, `notifications_read_at` (epoch ms). A notification is
unread if its `created_at` is after that watermark; absent = everything is unread. "Mark all read"
is one `UpdateCommand` on `META`, not one write per notification.

**TTL cleanup.** `expires_at` (epoch **seconds**, `created_at` + 60 days) is the table's configured
TTL attribute (`infra/database.ts`) — DynamoDB deletes expired rows for free, so this list doesn't
grow forever.

**Event filtering.** One broad filter — `SK` beginning with `REQUEST#`, `eventName` in
`INSERT`/`MODIFY` — evaluated by AWS *before* the Lambda runs, so court creations and session
edits never cost an invocation. `classifyTransition`
(`infrastructure/function/stream/classify-transition.ts`) does the precise old-status/new-status
dispatch in code instead, since the six transitions this Lambda cares about would already exceed
an event source mapping's 5-filter limit. This is a second, independent Streams consumer from the
denormalization fan-out below — different filter, different Lambda, implemented now where the
fan-out below is still design intent.

**Failure handling.** The event source mapping's `destinationConfig.onFailure` routes a batch
that exhausts `maximumRetryAttempts` (3) to an SQS dead-letter queue instead of silently dropping
it — without this, a crashing Lambda loses the records for good, which is exactly what happened
(and went unnoticed) before this was added.

## Request anti-churn attributes (Main table)

The Request item (§1) gains two attributes to support the join/withdraw rate limit:

- `join_count` (number) — how many times this `(session, user)` pair has ever joined, including
  the current join. Set to 1 on a brand-new request, incremented on every rejoin. Rows written
  before this shipped lack it entirely; the mapper treats a missing value as `1`.
- `withdrawn_at` (epoch ms, optional) — set by `withdrawRequest` on every withdraw, in both of its
  shapes (plain flip and the slot-giveback transaction). Never cleared by a rejoin; a later
  withdraw just overwrites it.

`Request.assertCanRejoin` (domain layer, pure) checks both before a `WITHDRAWN` request's row can
be overwritten by a fresh join: the cap (`join_count >= MAX_JOINS_PER_SESSION`, a permanent block
for this session) and the cooldown (less than `REJOIN_COOLDOWN_MINUTES` since `withdrawn_at`, a
temporary one). The repository's own `create()` condition independently re-checks `join_count`
against the value the use case read before writing — the same "two parallel writes, only one can
win" pattern `approveRequest`'s slot-count condition already uses — so two racing rejoins can't
both slip past the cap.

---

## Deferred: sessions at a specific court

An earlier design had a third GSI (`court_id` → `created_at`) for this, but nothing ever queried it,
so it was removed rather than paid for on every session write. Adding it back is a plain online GSI
create when a "sessions at this court" screen is actually built — no table replacement, no downtime,
consistent with the "one GSI per distinct access pattern" principle below. The same future GSI3 is
also where the Streams-based court-rename fan-out (below) would query from.

---

## Denormalization

To avoid a second lookup on common reads, some fields are copied ("denormalized") from their source entity onto the items that need them for display:

| Denormalized onto | Fields | Copied from |
|---|---|---|
| Session | `court_name`, `lat`, `lng`, `location` | Court |
| Session, Request | `user_name`, `skill_level` | User |
| Request | `court_name`, `lat`, `lng`, `location` | Court (via the session) |
| Request | `session_start_time`, `session_end_time` | Session |

**Trade-off:** these copies can go stale if the source changes (a user renames themselves, a court's address changes). This is fixed with an event-driven fan-out rather than a query-time join:

1. **DynamoDB Streams** on the table emits an event whenever an item changes.
2. A **Lambda** function checks whether a denormalized field (`court_name`, `user_name`, `skill_level`) actually changed.
3. **Court changed** → query the (deferred) court-index for that `court_id` → get every affected session → for each, also `Query` the base table on `PK = SESSION#<id>` to reach its request items → batch-update the copied fields on both levels.
4. **User changed** → query GSI2 for that `user_id` → get every session they host and every request they've made → batch-update the copied fields.

This is eventual consistency: there's a brief lag between the source change and every copy catching up. Acceptable here since court/name changes are rare, and the trade-off favors the far more frequent case (rendering session/request lists without a join). None of this particular Streams/Lambda fan-out (repairing stale denormalized copies) is implemented yet — this section is design intent. The table's stream is live, though: §5's withdrawal notifications are a separate, already-implemented Streams consumer, with its own filter and Lambda.

---

## Design principles applied

- **GSI keys are dedicated, generic attributes, built in one place** (`GSI1PK`/`GSI1SK`/`GSI2PK`/`GSI2SK`, via `mapper/index-keys.ts`) — never a business field reused as a key, and never inferred from what fields an item happens to carry. Index membership is a call site decision, not a shape accident.
- **One GSI per distinct access pattern** — not one per attribute, and not one kept around unqueried. A GSI is only added once a real screen/feature needs it (sessions-at-a-court was removed for exactly this reason, and can come back online with no downtime when it's needed).
- **One index, multiple entity types, separate partitions** — GSI1 holds both sessions (`SLOC#`) and courts (`CLOC#`); GSI2 holds both a user's hosted sessions (`SESSION#`) and their requests (`REQUEST#`). Prefixing the partition or sort key keeps unrelated entity types from ever mixing inside one `Query`.
- **One representation per fact** — place is stored once, as `location`; `city` and `district` are derived from it at the mapper boundary. Redundant copies of the same value in a denormalized table are a drift risk with no read benefit.
- **Denormalize for hot reads, fan out for rare writes** — copy fields onto items that need them for display, and accept eventual consistency, repaired via Streams + Lambda when the source changes.
