# Migration Engineer Agent

Writes **one phase** of a database schema change — the migrations and data migrations that
ship in one release — in the repository's own migration tool, with real roll-backs and tests,
verified against a local throwaway database.

Runs on `sonnet`. It is the implementer the
[`schema-migration`](../../skills/schema-migration/README.md) skill dispatches.

## Purpose

A migration is code that runs exactly once per environment, against data nobody looked at
first, while the application keeps serving traffic. This agent writes it so the running system
survives it: the lock-safe form of every statement, a backfill that can be stopped and resumed,
a roll-back that actually restores, and tests that went red before the migration existed.

## How it works

1. **Read before writing** — the
   [change-management](../../knowledge-base/database-change-management.md) and
   [test-patterns](../../knowledge-base/database-test-patterns.md) knowledge bases, the repo's
   recent migrations (its conventions win), the current definition of every touched table,
   and the repo's rules. Any claim in the brief that the repo contradicts is `blocked`.
2. **Bring up a sandbox** — a local or containerised database at the phase's starting version.
3. **Red** — the upgrade-with-data test, seeded with the awkward rows, observed failing for the
   right reason.
4. **Write the migrations** — one logical change each, the engine's online forms, a lock
   timeout, a paired roll-back, data migrations separate and batched.
5. **Verify** — new tests green; empty-to-current; `up` → `down` → `up` with an identical
   schema dump; the existing database test suite; the migration linter; regenerated schema
   dumps named.

It ends with a `done` or `blocked` report listing files, each migration's lock profile and
roll-back, the verification output, and what it could **not** verify — usually lock duration
at production volume.

## Boundaries

| It does | It never does |
|---|---|
| Work against a database it started or the repo marks local, passing that connection explicitly on every command | Connect to staging, production, or a shared dev database — it holds no database MCP tools and never trusts an ambient `DATABASE_URL` |
| Fix a mistake with a new migration | Edit a migration that exists on the base branch |
| Implement its phase | Ship a later phase early, or tidy up unrelated migrations |
| Keep backfills separate, batched, and resumable | Put a backfill in the DDL migration |
| Report a contradiction as `blocked` | Invent the missing column, table, or prior phase |
| Leave changes uncommitted unless told otherwise | Branch, push, rebase, or merge |

## Related

| Item | Relationship |
|---|---|
| [`schema-migration`](../../skills/schema-migration/README.md) | Classifies the change, writes the phase plan, briefs this agent, gates its output |
| [`schema-reviewer`](../schema-reviewer/README.md) | Reviews this agent's migrations before the human sees them |
| [`tdd-developer`](../tdd-developer/README.md) | The general-purpose implementer; this one specialises in migrations and owns no application code |

## Example usage

```text
Use the migration-engineer agent to implement phase 1 of docs/specs/ORD-7_quantity/migration-plan.md
```
