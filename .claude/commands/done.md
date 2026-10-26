---
description: Close out a phase/step - static checks, code review, comprehension check, commit, update handoff doc
argument-hint: <step or phase number/name> [review-level]
---

The user ran `/done $ARGUMENTS`. The first token is the step/phase identifier (e.g. `4.5`,
`"6-hour max"`). An optional second token is a code-review effort level (`low`/`medium`/`high`/
`xhigh`/`max`); default to `medium` if omitted.

Scope for every step below: `git diff` against `HEAD` — everything currently uncommitted is this
step's work (per CLAUDE.md, nothing is committed until the user says so, so the working tree
*is* the step).

Run the steps in order. Stop and report back to the user if any step fails or finds something
that needs their input — don't silently skip ahead.

## 1. Static gate

Run, in this order, stopping at the first failure:
1. `pnpm run build:types`
2. `pnpm --filter server exec tsc --noEmit -p .` (skip if no `packages/server` changes in scope)
3. `pnpm --filter frontend exec tsc -b` (skip if no `packages/frontend` changes in scope)
4. `eslint` on the touched directories only (derive from the diff — never the whole repo)
5. `pnpm run lint:fsd` (frontend changes only) — compare the finding count to the known
   pre-existing baseline (currently 8 "insignificant slice" + 1 segment-naming warning, see
   CLAUDE.md's FSD section); report only *new* findings, not the baseline ones
6. `pnpm run build:frontend` (frontend changes only)

If this step fails, report the failure and stop. Do not proceed to code review on broken code.

## 2. Code review

Invoke the `code-review` skill at the resolved effort level against the current diff. Do **not**
pass `--fix` — findings are surfaced for the user to decide on, never auto-applied.

## 3. Comprehension check

Ask the user checkpoint questions about the key changes in this step, **one at a time**, waiting
for their answer and giving feedback before asking the next one (per the project's established
style — see memory `feedback_phase_checkpoint_questions`). Base the questions on what actually
changed in the diff, not generic questions.

**Question focus (user's stated preference, 2026-10-23, extended 2026-10-26):** cover three
categories when the step's diff touches them, not just one:

1. **Architecture and re-render/data-flow** (2026-10-23): tracing exactly what re-renders and why
   when a cache write or a route change happens, why a mutation's `onSuccess` ordering matters,
   why a piece of state lives where it does (store vs. query cache vs. local state), why a
   sequence of effects/renders happens in the order it does.
2. **Data-model / entity design** (2026-10-26): when a step adds or changes a domain entity or
   its persistence shape, ask *why the data model looks the way it does* — PK/SK choice,
   idempotency-key construction, TTL attribute semantics, why an entity does or doesn't need
   `fromPersistence` (check whether anything actually calls it before assuming an entity "needs"
   it — don't take the diff's own comments at face value, verify with a real grep/read before
   confirming or correcting the user's answer, the way the `Session.fromPersistence` question
   went on 2026-10-26: it's defined but grep-confirmed unused, so a correct answer depends on
   stating that precisely, not generalizing from the commented intent).
3. **System-design trade-offs / "why X, not Y"** (2026-10-26): when the step made a choice between
   real architectural alternatives, ask about the alternative directly and what would break or
   get expensive if the other one were chosen — e.g. "why long-polling instead of SNS/push for
   host notifications," "why DynamoDB Streams instead of writing the notification inside the
   withdraw transaction," "why an SQS DLQ instead of just raising `maximumRetryAttempts`." These
   tend to come from design docs/plans already written for the step (e.g.
   `please-check-the-newly-velvet-waffle.md`'s own "why Streams instead of..." reasoning) —
   reuse that reasoning as the basis for the question instead of re-deriving it from scratch.

These three are all preferred over generic recall questions. When a step touches more than one
category, ask at least one question from each relevant category, not just the first one that
comes to mind.

De-prioritize accessibility/ARIA-semantics questions — skip them by default. Include one only
when the accessibility distinction is itself the reason for a real architectural choice in the
diff (e.g. "why RadioGroup over ToggleGroup here" when that choice also affects how required-ness
is modeled) — not as a routine category to cover every step.

## 4. Wait for the user

Stop here. The user will review the code-review findings from step 2 and tell you what to act
on (fix, defer to tech debt, or dismiss). Do not commit until they've done this and said so.

## 5. Commit

Once the user gives the go-ahead:
- Stage and commit by **commitlint scope** (`frontend`, `server`, `types`, `infra`, `root` — see
  `commitlint.config.js`), one commit per scope actually touched in this step. Never bundle two
  scopes into one commit (see debt item D1 in the handoff plan for why this matters here).
- Each commit message follows Conventional Commits and ends with the attribution trailer given
  in this session's system reminders.
- Never stage `bruno/environments/dev.bru` (Bruno rewrites it every run — see debt item D8).

## 6. Update the handoff doc

Update `/Users/admin/.claude/plans/warm-scribbling-parnas.md`'s "START HERE" section: mark this
step done with its commit hashes, move it out of "Next steps," and note anything the step
surfaced (new debt items, open questions, follow-ups) in the right section.

## 7. Clean up

Check for and stop any dev server this session started for verification (`pnpm run dev` /
plain `vite`) — confirm port 5173 isn't still held by a leftover process. Leave `sst dev`
running if the user started it themselves; only stop processes this session launched.

## Report back

Summarize: what was checked, what the review found, what got committed (with hashes), and what's
next per the handoff doc.
