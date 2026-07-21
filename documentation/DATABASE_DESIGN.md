# Shuttle Connect — DynamoDB Table Design

Single-table design for the Shuttle Connect badminton session-booking app. One physical table (`ShuttleConnectTable`) holds all entity types, with three Global Secondary Indexes (GSIs) supporting the access patterns below.

## Entities

| Entity | PK | SK |
|---|---|---|
| Session | `SESSION#<sessionId>` | `META` |
| Request (a user's request to join a session) | `SESSION#<sessionId>` | `REQUEST#<userId>` |
| Court | `COURT#<courtId>` | `META` |
| User | `USER#<userId>` | `META` |

Session and Request items share the same PK so a single `Query` on the base table returns a session together with every request against it (an "item collection").

**Timestamp format:** `startTime`, `endTime`, and `created_at` are stored as **Unix epoch milliseconds** (a `Number` type, e.g. `1785600000000`), not human-readable strings like `"18h"`. Numeric epoch values sort correctly as DynamoDB sort keys (lexicographic string sort would break down once you cross into different date/hour formats), and they convert directly to/from a JS `Date` on the app side.

## Access Patterns

| # | Access Pattern | Usage | Served by |
|---|---|---|---|
| 1 | Get a session and all its join requests | High | Main table |
| 2 | Browse sessions by district, sorted by start time | Medium-high | GSI1 |
| 3 | Get sessions a user hosts or has requested to join | Medium | GSI2 |
| 4 | Browse sessions at a specific court, sorted by time | Medium | GSI3 |

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

## 2. Browse sessions by district (GSI1)

```
GSI1PK = district
GSI1SK = startTime
```

**Note:** Request items do not carry `district`, so only Session items appear in this index.

```
Query on GSI1:
  GSI1PK = "10"
  GSI1SK between 1785600000000 and 1785700000000   (optional range for time-of-day filtering)
```

Returns every session in district `10`, sorted by start time.

---

## 3. Sessions a user hosts or has requested to join (GSI2)

```
GSI2PK = user_id
GSI2SK = created_at   (prefixed by entity type: "SESSION#<ts>" or "REQUEST#<ts>")
```

Both the session's host and every request's requester carry `user_id`, so this one index answers "what is this user's session activity" — hosted and requested — in a single `Query`, sorted chronologically.

```
Query on GSI2:
  GSI2PK = "USER#2"
```

Returns:
```
{ GSI2SK: "REQUEST#1785600500000", ... }   → USER#2's join request
```

To fetch only sessions this user hosts, or only sessions they've requested (e.g., two separate tabs in the app), narrow the key condition with the type prefix:

```
Query on GSI2:
  GSI2PK = "USER#1"
  begins_with(GSI2SK, "SESSION#")   → sessions USER#1 hosts

Query on GSI2:
  GSI2PK = "USER#2"
  begins_with(GSI2SK, "REQUEST#")   → sessions USER#2 has requested
```

`begins_with` on a sort key is evaluated as part of the key condition, so DynamoDB only reads the matching range — this is efficient, unlike a `FilterExpression`, which reads everything in the partition first and discards non-matches afterward.

---

## 4. Sessions at a court (GSI3)

```
GSI3PK = court_id
GSI3SK = created_at   (prefixed "SESSION#<ts>")
```

**Note:** only Session items carry `court_id` — Request items intentionally do **not**, so they never appear in this index (see "Denormalization" below for how their court info is kept in sync anyway).

```
Query on GSI3:
  GSI3PK = "COURT#1"
```

Returns every session held at that court, sorted by creation/start time.

---

## Denormalization

To avoid a second lookup on common reads, some fields are copied ("denormalized") from their source entity onto the items that need them for display:

| Denormalized onto | Fields | Copied from |
|---|---|---|
| Session | `court_name`, `lat`, `lng` | Court |
| Session, Request | `user_name`, `skill_level` | User |
| Request | `court_name`, `lat`, `lng` | Court (via the session) |

**Trade-off:** these copies can go stale if the source changes (a user renames themselves, a court's address changes). This is fixed with an event-driven fan-out rather than a query-time join:

1. **DynamoDB Streams** on the table emits an event whenever an item changes.
2. A **Lambda** function checks whether a denormalized field (`court_name`, `user_name`, `skill_level`) actually changed.
3. **Court changed** → query GSI3 for that `court_id` → get every affected session → for each, also `Query` the base table on `PK = SESSION#<id>` to reach its request items → batch-update the copied fields on both levels.
4. **User changed** → query GSI2 for that `user_id` → get every session they host and every request they've made → batch-update the copied fields.

This is eventual consistency: there's a brief lag between the source change and every copy catching up. Acceptable here since court/name changes are rare, and the trade-off favors the far more frequent case (rendering session/request lists without a join).

---

## Design principles applied

- **One GSI per distinct access pattern** — not one per attribute. A GSI is only added once a real screen/feature needs it (e.g., "sessions by host" was deferred until actually needed — GSIs can be added later without downtime or migration).
- **Generic key names, entity-specific meaning** — `user_id` means "host" on a Session item and "requester" on a Request item; `GSI1PK`/`GSI2PK` are similarly reused across entity types where their meaning is unambiguous per SK shape.
- **Only give an item a GSI's key attribute if it belongs in that index's results** — Request items deliberately omit `court_id`/`district` so they don't pollute GSI1/GSI3, which are meant to return sessions only.
- **Sort keys are type-prefixed** (`SESSION#<ts>`, `REQUEST#<ts>`) where a GSI partition mixes entity types, so `begins_with` can cheaply narrow results within the key condition itself.
- **Denormalize for hot reads, fan out for rare writes** — copy fields onto items that need them for display, and accept eventual consistency, repaired via Streams + Lambda when the source changes.
