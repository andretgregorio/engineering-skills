# Data Modeler Agent

Designs the data model for a new solution, or a new part of an existing one. It takes a
workload — what must be stored, how it is read and written, how much of it there will be, and
what must never be wrong — and **commits** to the model that serves it, with the alternatives
it rejected written down.

Runs on `opus`, read-only over the codebase. It returns its proposal as text; the
[`schema-design`](../../skills/schema-design/README.md) skill persists it.

## Purpose

The expensive schema mistakes are made before the first migration: the wrong model for the
workload, a key that cannot serve the query that matters, a grain nobody declared, a partition
that grows without bound. This agent exists to make those choices deliberately — every index
traced to the access pattern it serves, every one-way door named.

## Patterns it chooses between

Everything in [`knowledge-base/database-design-patterns.md`](../../knowledge-base/database-design-patterns.md),
which it reads in full on every run: relational (normalized OLTP), dimensional (Kimball),
data vault, document, key-value, wide-column, columnar analytical, time-series, graph, and the
cross-cutting patterns — event sourcing, CQRS and read models, multi-tenancy, hierarchies,
temporal data. A solution may use more than one pattern, but each extra one must be justified
by an access pattern the first cannot serve.

## Decide, don't enumerate

| Situation | Response |
|---|---|
| A modeling choice inside a datastore the repo already uses | Decide; record rejected alternatives |
| A datastore the team does not run today | Escalate — operational cost and lock-in are the human's call |
| A one-way door — partition key, shard key, fact grain, a primary-key type other systems store | Decide, flag it as hard to reverse, say what evidence would change it |
| Two requirements in conflict | Escalate the trade-off; never resolve it by quietly dropping one |
| Licensing, managed-service cost, data residency | Escalate |

It **defaults to the datastore already in use**: a new engine must name the access pattern the
current one cannot serve at the stated volume.

## Output

A schema proposal with: the decision, the workload profile (`AP-n` access patterns), a Mermaid
logical model with an entity glossary, the physical model in the chosen pattern's vocabulary
(DDL, document shapes and validators, key-design tables, node and relationship catalogues,
fact grain), constraints, keys and indexes traced to access patterns, data lifecycle and
sensitive data, the evolution path (additive, or expand/contract outlined for
`schema-migration`), alternatives considered, the existing conventions it followed, and the
assumptions and open questions.

## Boundaries

| It does | It never does |
|---|---|
| Inventory the existing data layer and follow its conventions | Ignore the repo's naming, tenancy, or type conventions |
| Commit to a design and record what it rejected | Hand back a menu with "it depends" |
| Trace every index and denormalization to an access pattern | Add an index nobody reads |
| Mark unknown numbers as assumptions or open questions | Invent volume, latency, or consistency figures |
| Outline how the design is introduced | Write migrations or connect to a database |

## Related

| Item | Relationship |
|---|---|
| [`schema-design`](../../skills/schema-design/README.md) | Confirms the workload with the human, dispatches this agent, and persists `schema-design.md` |
| [`schema-reviewer`](../schema-reviewer/README.md) | Reviews this agent's proposal cold before the human sees it |
| [`schema-migration`](../../skills/schema-migration/README.md) | Turns an approved proposal into migrations |
| [`architect`](../architect/README.md) | Owns the system's shape; this agent owns the shape of its data |

## Example usage

```text
Use the data-modeler agent to design the schema for docs/specs/BILL-12_invoicing/feature-description.md
```

```text
@"data-modeler (agent)" do we need a graph database for recommendations, or is Postgres enough?
```
