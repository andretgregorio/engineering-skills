# Schema Design Skill

Models the database schema for **one new solution** — or one new part of an existing one —
and writes `schema-design.md` for human approval. It settles the workload with the human
first, has the [`data-modeler`](../../agents/data-modeler/README.md) agent choose the
modeling pattern and design the model, and has the
[`schema-reviewer`](../../agents/schema-reviewer/README.md) agent check the proposal cold
before anyone else sees it.

```
/database "<what to model>" | <path to feature-description.md or spec.md> [--store <engine>] [--repo <path>] [--ticket <ID>] [--headless]
```

Not a slash command: reach it through [`/database`](../database/README.md), which routes here when the request is something new to store. Claude also triggers it on its own when a discussion of a new feature or implementation introduces data that must be stored — new entities, tables, collections, events, or a datastore — before any schema or migration is written.

## Purpose

A data model designed against guessed access patterns is a guess with a diagram. The
questions that decide a model — *will anyone query across customers? must history be
reconstructable as it was? is that volume a ceiling or this quarter's number?* — are cheap to
answer before the first migration and very expensive after. This skill asks them, and only
them, then commits to a design with the reasoning written down.

## What it does

1. **Load the inputs** — the request or upstream document, and a quick look at the datastores,
   ORM, migration tool, and existing tables in the area.
2. **Draft the workload profile** — workload type, entities, access patterns as `AP-n`,
   consistency, volume and growth, history, retention, sensitive data, tenancy.
3. **Resolve the gaps with the human** — at most five questions, each one whose answer changes
   the design, each with the answer it would otherwise assume.
4. **Dispatch the `data-modeler`** with the confirmed profile. It reads
   [`database-design-patterns.md`](../../knowledge-base/database-design-patterns.md) and
   [`database-change-management.md`](../../knowledge-base/database-change-management.md),
   inventories the existing data layer, and returns the proposal.
5. **Review it cold** — the `schema-reviewer` checks access-pattern coverage, pattern fit,
   integrity, evolution, and lifecycle. `revise` or `block` goes back to the modeler once;
   anything still open is shown to the human as unresolved.
6. **Persist and present** — `schema-design.md` with `Status: draft`, the confirmed workload
   profile, and a Review section. Then stop.

## Output

`schema-design.md`, written beside the upstream `feature-description.md` or `spec.md` in its
`<TICKET>_<slug>/` folder — or at `docs/specs/<TICKET>_<slug>/schema-design.md` with no
upstream document. It never overwrites an existing one without asking.

## Boundaries

| It does | It never does |
|---|---|
| Settle access patterns with the human before designing | Design against guessed workloads |
| Treat `--store` as a constraint to check | Adopt a new datastore without escalating it |
| Run an independent review before presenting | Drop a `block` finding to get to approval |
| Stop at the approval gate | Write migrations, ORM models, or application code |

In `--headless` mode it assumes the conservative answer to each open question (larger volume,
stronger consistency, longer retention), records it as `assumed (headless)`, halts on genuine
coin flips, and never auto-approves.

## Related

- [`schema-migration`](../schema-migration/README.md) — the next step: turns an approved design
  into migrations.
- [`schema-review`](../schema-review/README.md) — the same reviewer, on demand, for any design
  document or change.
- [`/specs`](../specs/README.md) and [`/plan`](../plan/README.md) — when the schema is one part of
  a feature going through Spec Driven Development, design it after the spec and let the plan
  schedule its migrations.

Full definition: [`SKILL.md`](SKILL.md).
