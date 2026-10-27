# Schema Review Skill

Reviews **one schema change or one schema proposal** and returns a verdict — `approve`,
`revise`, or `block` — with findings ranked Critical / Moderate / Low and `path:line`
evidence. Deliberately small: it dispatches the read-only
[`schema-reviewer`](../../agents/schema-reviewer/README.md) agent and stops; it never changes
anything.

```
/database review [<migration file | design doc | branch | PR number | base..head>] [--repo <path>] [--consumers <path,path>]
```

Not a slash command: reach it through [`/database`](../database/README.md), which routes here for a change or proposal to check. Claude also triggers it on its own before committing or opening a PR whose diff touches migrations, schema files, or ORM models, and when a schema design is put forward in a discussion.

## Purpose

A schema change is judged by the moment it runs, not by the code that reads it afterwards:
the previous application version still running during the rollout, the roll-back that may
come an hour later, the lock it takes on a table that has grown since anyone last looked. A
schema proposal is judged by the queries it has to serve. This skill gets an independent
answer to both before merge — or before the first migration is written.

## What it does

1. **Resolve the target** — a migration or schema file, a design document, a PR, a branch, a
   range, or (by default) the current branch against the default branch including uncommitted
   migration changes. `--consumers` adds other repositories that use the same database.
2. **Dispatch the `schema-reviewer`** — it reads the three database knowledge bases, works out
   the engine, the migration tool, how migrations run at deploy, table sizes, and every reader
   and writer of the touched structures, then reviews in change mode, proposal mode, or both.
3. **Present and stop** — the verdict, summary, and Critical findings inline; for a document,
   the full report as `schema-review.md` beside it.

## What a change review checks

- The previous application version against the new schema, during rollout and after a
  roll-back.
- A roll-back that actually reverses the change and restores data.
- The lock and rewrite every statement takes, given the engine and version.
- Backfills: separate, batched, idempotent, resumable.
- Applied migrations left untouched; one logical change per migration; ordering.
- The new structures' keys, types, constraints, and indexes.
- Migration tests: apply-from-empty, upgrade-with-data, round trip.

## What a proposal review checks

- Every stated access pattern served by a key or an index — and every index serving one.
- The modeling pattern fits the workload, or the departure is justified.
- The chosen pattern's own anti-patterns (undeclared grain, unbounded partitions or arrays,
  dense nodes, …).
- Invariants enforced, one-way doors named, lifecycle and sensitive data handled.

## Boundaries

| It does | It never does |
|---|---|
| Read and report | Edit migrations, schema, or code |
| Treat unknown table sizes as large | Claim a change is safe without evidence |
| Cite `path:line` for every finding | Connect to a database to "check" |
| Stop after the report | Act on a `block` without the human deciding to |

## Related

- [`schema-reviewer`](../../agents/schema-reviewer/README.md) — the agent this skill dispatches.
- [`schema-migration`](../schema-migration/README.md) and
  [`schema-design`](../schema-design/README.md) — run the same reviewer as their gate.
- The knowledge bases it judges against:
  [change management](../../knowledge-base/database-change-management.md),
  [design patterns](../../knowledge-base/database-design-patterns.md),
  [test patterns](../../knowledge-base/database-test-patterns.md).

Full definition: [`SKILL.md`](SKILL.md).
