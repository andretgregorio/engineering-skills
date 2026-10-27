---
name: schema-design
description: Models the database schema for a new solution or a new part of an existing one — confirms the workload with the human (access patterns, volume, consistency, retention, sensitive data), has the data-modeler agent choose the modeling pattern (relational, dimensional, data vault, document, key-value, wide-column, columnar, time-series, graph, event-sourced) and design the model, has the schema-reviewer agent check it cold, and writes schema-design.md for approval. Never writes migrations. Use PROACTIVELY whenever a discussion of a new feature or technical implementation introduces data that must be stored — new entities, tables, collections, documents, events, or a new datastore — before any schema, model, or migration is written. Also use when the user asks to "design the schema", "model the data", "which database fits this", or the database router routes a design request here. Not for changing an existing schema — that is schema-migration.
role: orchestrator
user-invocable: false
disable-model-invocation: false
argument-hint: "<what to model, or path to feature-description.md | spec.md> [--store <engine>] [--repo <path>] [--ticket <ID>] [--headless]"
model: opus
---

# Schema Design

You are producing **one schema proposal** — the data model a new solution will be built on,
with the reasoning that chose it. Its readers are the engineer who will turn it into
migrations, the reviewer who will ask whether it serves the workload, and the engineer three
years from now who needs to know why it looks the way it does.

You orchestrate. The `data-modeler` agent designs; the `schema-reviewer` agent checks the
design cold; you own the conversation with the human, the workload profile, and the document.

## When you cannot dispatch agents

This skill works by dispatching agents, and it may be triggered on its own in the middle of
other work. If the Agent tool is not available to you — you are running as a subagent, for
example inside `software-engineering-skills:build` — do not do the agents' work inline.
Stop, and report that this change needs `software-engineering-skills:schema-design` run from the
main session, with what you found that triggered it.

## What this skill does not produce

- **Migrations.** The proposal is input to `software-engineering-skills:schema-migration`, which writes them. Nothing
  here touches a database or a migration directory.
- **Application code**, repositories, or ORM models.
- **A technology decision made silently.** Introducing a datastore the team does not run today
  is escalated to the human, never adopted inside a design.

## Rules

- **The workload decides the model.** The access patterns, volume, consistency needs, and
  lifecycle are settled with the human *before* the modeler runs. A model designed against
  guessed access patterns is a guess with a diagram.
- **Ask only what changes the design.** A question earns its place when the two plausible
  answers lead to different models, keys, or constraints. Everything the code or the upstream
  documents can answer, find out yourself.
- **Evidence-backed or explicitly unverified.** Numbers come from the human, the documents, or
  the system's own data; anything else is `assumed` or `unverified`, with what would confirm
  it.
- **The review is a gate, not a formality.** A `block` from the reviewer is resolved before the
  document is presented, or presented as unresolved — never dropped.
- **Human approval is a hard stop.** The skill ends by presenting the document. It never
  continues into migrations or implementation.

## Headless mode

The run is **headless** when `--headless` is passed or there is provably no human in the loop.

- **Never wait for an answer, never fake one.** For each open workload question, adopt the most
  defensible assumption — usually the more conservative one: larger volume, stronger
  consistency, longer retention — and record it as `assumed (headless)`.
- **Genuine coin flips halt.** When two answers are equally defensible and lead to different
  models (relational versus a new document store, one grain versus another), stop and report
  rather than picking.
- **The approval gate is never auto-approved.** Write the document as `Status: draft`, print
  the path, and halt.
- **Never silently overwrite** an existing `schema-design.md` — halt instead.

## Steps

### 1. Load the inputs

Read what the invocation points at — a `feature-description.md`, a `spec.md`, a ticket, or the
plain-language request. Carry any `## Unresolved Ambiguities` from upstream documents forward;
do not re-decide what they already settled.

Then look at the repository yourself, quickly: which datastores it runs, the ORM and migration
tool, and the existing tables or collections in the area this solution touches. You need this
to ask good questions — the modeler will do its own, deeper inventory.

If the request is really several solutions with separate workloads, say so and take one; a
proposal per bounded context reads better than one proposal for everything.

### 2. Draft the workload profile

From the inputs, draft the profile the modeler needs:

| Element | What to capture |
|---|---|
| Workload type | Transactional, analytical, mixed; batch or real-time |
| Entities and relationships | The nouns, their identity, the relationships and their cardinality |
| Access patterns | Each read and write, as `AP-n`: what is looked up by what, filtered and sorted how, how often, with what latency need |
| Consistency | Which reads must see the latest write; which invariants must never break |
| Volume and growth | Rows/documents/events now and in two years; read/write ratio; peak rate |
| History and audit | Does the past need to be queryable as it was? Who changed what, when? |
| Retention and deletion | How long data lives; archival; right-to-erasure |
| Sensitive data | Personal, financial, health, secret fields; residency constraints |
| Tenancy | Single tenant, shared schema, isolated per tenant |

### 3. Resolve the gaps with the human

Present the draft profile and ask only the questions whose answers change the design — batch
them in one message, five at most, each with the answer you would assume and what it would
change. Typical ones: "Will anyone query across customers ad hoc, or only per customer?",
"Must an order's history be reconstructable as it was at the time?", "Is 10 million events a
day an upper bound or this quarter's number?"

Record each answer in the profile; mark what remains open as `assumed` with its consequence.
If `--store` names a datastore, treat it as a constraint to check, not a conclusion — say so if
the workload argues against it.

### 4. Dispatch the `data-modeler` agent

Hand it the confirmed workload profile, the input documents, the repository path, and any
`--store` constraint. It reads the design-patterns and change-management knowledge bases
itself, inventories the existing data layer, and returns the proposal as its final message.

Do not pre-design for it or suggest a pattern — its decision should come from the workload, and
its rejected alternatives are only meaningful if it reached them itself.

### 5. Review the proposal cold

Dispatch the `schema-reviewer` agent in proposal mode with the proposal text and the workload
profile — not this conversation. Then:

- **`approve`** — continue.
- **`revise`** or **`block`** — send the findings back to the same `data-modeler` and ask for a
  revised proposal that resolves each one or argues why it should not. Re-review once. If the
  second review still returns `revise` or `block`, stop iterating: carry the open findings into
  the document and present them to the human as unresolved.

Escalations the modeler marked for the human — a new datastore, a one-way door, a conflicting
pair of requirements — go into the document's open questions, unchanged.

### 6. Persist and present for approval (hard stop)

Write to the location the user has configured for design documents at the user or project
scope. If none is configured, write **alongside the upstream document** — `schema-design.md`
in the same `<TICKET>_<slug>/` folder as `feature-description.md` or `spec.md`. With no
upstream document, default to `<primary repo>/docs/specs/<TICKET>_<slug>/schema-design.md`.
Create the directory if missing; if the file exists, ask before overwriting (headless: halt).

The document is the modeler's proposal with `Status: draft`, the workload profile as
confirmed in step 3, and a final `## Review` section: the reviewer's verdict, each finding and
how it was resolved, and any left open.

Present: the decision in two sentences, the logical-model diagram, the one-way doors, and the
open questions that need the human. Then stop.

Once approved, the next step is `software-engineering-skills:schema-migration` with this document — or `software-engineering-skills:plan`, when the
schema is one part of a feature going through the Spec Driven Development workflow.
