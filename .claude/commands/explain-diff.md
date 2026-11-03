---
description: Explain the current uncommitted diff as a reviewable report - problem/intention, file-by-file before/after diffs with reasoning, net effect
argument-hint: [optional: path(s) to scope the report to, otherwise the whole diff]
---

The user ran `/explain-diff $ARGUMENTS`. If a path (or paths) is given, scope the report to just
those files' changes within the current diff. Otherwise cover the whole diff.

Scope: `git diff` against `HEAD` — everything currently uncommitted (same convention as `/done`).
Always pull the real diff via `git diff` for each file covered; never reconstruct hunks from
memory or from what you think you changed — if several edits touched a file across the
conversation, the report must reflect the file's actual current diff, not a mental summary of
the edits.

If there is nothing uncommitted in scope, say so and stop — don't invent a report for an empty
diff.

## Report structure

Produce exactly these sections, in this order:

### Problem (or Context, for a new feature rather than a fix)
One short paragraph, user-facing framing: what was broken, missing, or being added, and why it
mattered. For a bug fix, describe the symptom as the user experienced it, not the internals yet.

### Root cause (bug fixes only — omit for new features, replace with nothing extra)
One short paragraph: the underlying mechanism that produced the symptom. This is where the
"why did this happen" technical explanation goes, before showing any code.

### The fix / What changed
One numbered subsection per file touched, in an order that tells the story logically (usually:
shared/foundational pieces first, then the places that consume them), not alphabetical. For each
file:
- A `diff` fenced code block, generated from the real `git diff` for that file — trimmed to the
  changed lines plus just enough surrounding context to read, not the whole file.
- Immediately after the diff, a paragraph starting with **Intention:** that explains *why* this
  specific change was made — the reasoning, the alternative that was rejected, the edge case it
  guards against. Never restate *what* the diff shows (the diff already shows that) — the prose
  earns its place only by adding the "why" the diff can't carry on its own.

### Net effect
A short closing section: tie the file-by-file changes back into one coherent behavior change,
and explicitly state what did *not* change / the scope boundary, when that's worth knowing (e.g.
"the original feature's behavior is otherwise unchanged — this only adds a narrow exception for
X"). If the fix introduces a numbered list of states/conditions (as a bug fix narrowing down a
race or an edge case often does), spell them out in order.

## Style rules

- Write for the user's own review of their own codebase, not for an external audience — direct,
  concrete, no marketing language, no restating obvious things.
- Keep diff hunks minimal: enough to see the before/after clearly, not padded with unrelated
  unchanged lines.
- Every claim about *why* something was done should be something you can actually stand behind —
  if you're not sure why a past edit did something a particular way, say so rather than inventing
  a plausible-sounding reason.
- This is a chat report, not a file to publish — output it directly in the response unless the
  user has asked for it to be saved somewhere.
