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

Session and Request items share the same PK so a single `Query` on the base table returns a session together with every request against it (an "item collection"). The Auth pointer is a separate item from the User it resolves to — see `documentation` / `CLAUDE.md`'s "Auth" section for why identity is two ids, not one.

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

This is eventual consistency: there's a brief lag between the source change and every copy catching up. Acceptable here since court/name changes are rare, and the trade-off favors the far more frequent case (rendering session/request lists without a join). None of this Streams/Lambda fan-out is implemented yet — this section is design intent.

---

## Design principles applied

- **GSI keys are dedicated, generic attributes, built in one place** (`GSI1PK`/`GSI1SK`/`GSI2PK`/`GSI2SK`, via `mapper/index-keys.ts`) — never a business field reused as a key, and never inferred from what fields an item happens to carry. Index membership is a call site decision, not a shape accident.
- **One GSI per distinct access pattern** — not one per attribute, and not one kept around unqueried. A GSI is only added once a real screen/feature needs it (sessions-at-a-court was removed for exactly this reason, and can come back online with no downtime when it's needed).
- **One index, multiple entity types, separate partitions** — GSI1 holds both sessions (`SLOC#`) and courts (`CLOC#`); GSI2 holds both a user's hosted sessions (`SESSION#`) and their requests (`REQUEST#`). Prefixing the partition or sort key keeps unrelated entity types from ever mixing inside one `Query`.
- **One representation per fact** — place is stored once, as `location`; `city` and `district` are derived from it at the mapper boundary. Redundant copies of the same value in a denormalized table are a drift risk with no read benefit.
- **Denormalize for hot reads, fan out for rare writes** — copy fields onto items that need them for display, and accept eventual consistency, repaired via Streams + Lambda when the source changes.
