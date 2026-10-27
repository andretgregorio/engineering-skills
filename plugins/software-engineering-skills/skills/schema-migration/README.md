# Schema Migration Skill

Gets the database from the schema it has to the schema it needs **without an outage and
without losing a way back** — one release at a time.

```
/database "<change>" | <path to schema-design.md> | <path to migration-plan.md> [--repo <path>] [--ticket <ID>] [--headless]
```

Not a slash command: reach it through [`/database`](../database/README.md), which routes here for a change to an existing schema, an approved design, or a plan to resume. Claude also triggers it on its own when an implementation needs a change to an existing schema — a column added, renamed, dropped, or retyped, an index or constraint, a backfill — and before it would otherwise write a migration file by hand.

## Purpose

The application and the database deploy on independent clocks. During a rolling deploy the
previous application version runs against the new schema; after a roll-back it keeps doing so.
A migration that ignores that window — a rename, a drop, a `NOT NULL` without a backfill, an
index built under a write lock — fails in production even when every test passed. This skill
plans the change around that window and writes it the way the
[change-management knowledge base](../../knowledge-base/database-change-management.md)
prescribes.

## What it does

1. **Resolve the change** — plain language, an approved `schema-design.md`, or an approved
   `migration-plan.md` to resume (the human confirms the previous phase is deployed everywhere
   first, and recon runs again — code merged since may read what a contract phase removes).
2. **Recon** — engine and version, migration tool and conventions, the base ref and any
   migrations already deployed from the branch, how migrations run at deploy, how to start a
   local database, every reader and writer of the touched structures, and table sizes
   (unknown means large).
3. **Classify** — each element is additive, lock-sensitive, breaking, or data. A type change
   that rewrites the table is breaking, even a widening.
4. **Plan the phases** — breaking changes become expand → migrate → contract across separate
   releases, each with its migrations, its data migrations, the application work the same
   release needs, a precondition, and acceptance criteria. **Hard stop for approval** when
   there is more than one phase, a data migration, or a lock-sensitive statement on a large
   table — and any plan that needs approval is written to `migration-plan.md` first, with a
   status that moves `draft` → `approved` → `in progress` → `complete`.
5. **Dispatch the [`migration-engineer`](../../agents/migration-engineer/README.md)** for the
   current phase only — migrations, roll-backs, data migrations, and tests, red first, verified
   against a local throwaway database.
6. **Gate with the [`schema-reviewer`](../../agents/schema-reviewer/README.md)** — `revise` or
   `block` goes back to the engineer, at most twice, then to the human.
7. **Record and present** — tick the phase in the plan, log the evidence and verdict, and name
   what was not verified, the application work still owed, and the next phase's precondition.

## Phases, by example

Renaming the `NOT NULL` column `orders.qty` to `quantity`:

| Phase | Release | Migrations | Application work in the same release |
|---|---|---|---|
| 1 — Expand | N | Add nullable `quantity` | Write both columns; keep reading `qty` |
| 2 — Migrate | N+1 | Batched backfill of `quantity` from `qty`; once verified, enforce `NOT NULL` on `quantity` | Keep writing both; flip the read switch to `quantity` after the backfill is verified |
| 3 — Contract | N+2 | Make `qty` nullable | Stop writing `qty`; have the ORM ignore it |
| 4 — Contract | N+3 | Drop `qty` (archived first if the plan says so) | — |

Each phase passes the **roll-back test**: a roll-back to the release before it still works —
release N+1 still writes `qty`, so dropping it in N+2 would break that roll-back even as a
post-deployment migration. Collapsing two phases into one release gives up the roll-back
between them; that is the human's call, recorded in the plan, never a default.

## Boundaries

| It does | It never does |
|---|---|
| Write one phase per run | Ship the contract step in the release that switches reads |
| Verify against a local throwaway database | Apply migrations to a shared, staging, or production database |
| List the application work each phase needs | Write that application code |
| Halt on a contradiction between schema, plan, and request | Route around it |
| Leave changes uncommitted unless asked | Commit, push, or open a PR on its own |

In `--headless` mode a single additive phase may proceed; anything that needs approval is
written as a draft and halts, and resuming a later phase always halts — deployment state is a
fact only a human can confirm.

## Related

- [`schema-design`](../schema-design/README.md) — produces the `schema-design.md` this skill
  can implement.
- [`schema-review`](../schema-review/README.md) — the same reviewer, on demand, for a PR or
  branch.
- [`/open-pr`](../open-pr/README.md) — opens the PR once the human commits the phase.
- [`database-test-patterns.md`](../../knowledge-base/database-test-patterns.md) — the migration
  tests every phase carries.

Full definition: [`SKILL.md`](SKILL.md).
