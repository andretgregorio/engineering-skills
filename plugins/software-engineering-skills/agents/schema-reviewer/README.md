# Schema Reviewer Agent

An independent, read-only reviewer for database schema **changes** and schema **proposals**.
It answers two questions: *will this hurt the running system or its data*, and *will this
model serve the workload it was designed for*.

Runs on `opus`. It is the gate [`schema-migration`](../../skills/schema-migration/README.md)
and [`schema-design`](../../skills/schema-design/README.md) run, and the agent
[`schema-review`](../../skills/schema-review/README.md) dispatches.

## Purpose

A migration that is logically correct can still take production down: it drops a column the
previous application version still reads during the rollout, or rewrites a hundred-million-row
table under an exclusive lock. A schema design that looks clean can still fail the one query
that matters. Both failures are invisible to the author, who knows what they meant. This agent
reads the change or the proposal cold, against the plugin's knowledge base.

## What it checks

| Mode | Checks |
|---|---|
| **Change** — migrations, data migrations, schema files, ORM models in a diff | Compatibility of the previous application version with the new schema (during rollout and after a roll-back); reversibility without data loss; the lock and rewrite each statement takes; data-migration batching, idempotency, and separation; edited applied migrations and ordering; the design quality of what is added; migration tests |
| **Proposal** — a design document, ADR, or RFC | Every stated access pattern served by a key or index, and every index serving one; fit of the chosen pattern to the workload; pattern-specific anti-patterns; invariants enforced; one-way doors named; lifecycle and sensitive data |

It reads all three knowledge bases in full on every run:
[change management](../../knowledge-base/database-change-management.md),
[design patterns](../../knowledge-base/database-design-patterns.md), and
[test patterns](../../knowledge-base/database-test-patterns.md).

## Verdicts

| Verdict | When |
|---|---|
| `block` | Any Critical finding — breaks a running or rolled-back version, loses data, long blocking lock or rewrite on a table that is or may be large, an edited applied migration, an unserved access pattern, an unenforced stated invariant |
| `revise` | Moderate findings only — missing roll-back or migration tests, missing FK index, invariant enforced only in code, unbounded growth |
| `approve` | Low findings or none |

**Unknown table size is judged as large.** Every finding carries `path:line` evidence, *when*
it bites (rollout, roll-back, at volume, on an access pattern), and the fix direction from the
knowledge base — never the patch.

## Boundaries

**CRITICAL: REVIEW-ONLY ROLE.** It never edits files, never runs a `git` command that writes,
and never connects to a database. It uses only `Read`, `Grep`, `Glob`, and read-only `Bash`.

| It does | It never does |
|---|---|
| Grep every reader and writer of a touched structure, at base and head | Claim a column is unused without looking |
| Mark unknowns `unverified` | Assume a table is small |
| Judge a proposal against its stated requirements | Prefer a different model on taste |
| Review the change in front of it | Redesign the schema around it |
| Call out what is already sound | Return a report that is all criticism |

## Related

| Item | Relationship |
|---|---|
| [`schema-review`](../../skills/schema-review/README.md) | The normal way to invoke this agent on a PR, branch, file, or document |
| [`migration-engineer`](../migration-engineer/README.md) | Writes the migrations this agent gates inside `schema-migration` |
| [`data-modeler`](../data-modeler/README.md) | Writes the proposals this agent gates inside `schema-design` |

## Example usage

```text
Use the schema-reviewer agent to review the migrations in this branch
```

```text
@"schema-reviewer (agent)" is docs/specs/BILL-12_invoicing/schema-design.md going to hold up?
```
