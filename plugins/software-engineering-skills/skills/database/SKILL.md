---
name: database
description: The single entry point for database work — reads the request and routes it to the one skill that handles it, then stops. Something new to store, or a question of which model or datastore fits, goes to software-engineering-skills:schema-design. A change to an existing schema, an approved schema-design.md, or a migration-plan.md to resume goes to software-engineering-skills:schema-migration. A migration, branch, PR, or design document to check goes to software-engineering-skills:schema-review. It classifies from the request and the repository rather than keywords alone, says what decided the route, asks once when two routes are plausible, passes the other arguments through unchanged, and never designs, migrates, or reviews anything itself. Use when the user invokes /database, or asks for help with a schema, data model, migration, or database change without naming which kind of work it is.
role: orchestrator
user-invocable: true
argument-hint: "[<request in plain words | schema-design.md | migration-plan.md | migration file | PR number | branch>] [--repo <path>] [--ticket <ID>] [--store <engine>] [--consumers <path,path>] [--headless]"
---

# Database

You are making **one decision**: which database skill handles this request. Then you hand it
over and stop.

| Skill | Handles | Produces |
|---|---|---|
| `software-engineering-skills:schema-design` | Data that has no schema yet — new entities, a new solution, a choice of model or datastore | `schema-design.md`, approved by the human |
| `software-engineering-skills:schema-migration` | A change to a schema that already exists — and implementing an approved design | Migrations, one release phase at a time, with `migration-plan.md` when it spans releases |
| `software-engineering-skills:schema-review` | Judging a change or a proposal someone has already made | A verdict — `approve`, `revise`, or `block` — with findings |

The three are not slash commands; this skill is how a person reaches them. Claude also
invokes them on its own when a conversation calls for one, without coming through here.

## What this skill does not do

- **Design, migrate, or review.** The skill it routes to does that, including its own
  questions and approval gates. You never pre-empt them.
- **Fix the input.** A design document that is still a draft, a plan nobody approved — the
  target skill decides what to do with those; route on what the input *is*.
- **Guess.** Two plausible routes is one question to the human, not a coin flip.

## Classification

Decide from three things, in this order: the **input document**, if there is one; whether the
**structures named already exist** in the schema; and the **intent** of the request.

| Signals | Route |
|---|---|
| A `migration-plan.md` | **schema-migration** — resume its next phase |
| A `schema-design.md` with `Status: approved` | **schema-migration** — implement it |
| A `schema-design.md` still `draft`, with "check", "review", "is this right" | **schema-review** — proposal review |
| A `schema-design.md` still `draft`, with "change", "rework", "add …" | **schema-design** — revise it |
| A `feature-description.md` or `spec.md` introducing data that has no schema yet | **schema-design** |
| A PR number, branch, `base..head` range, or existing migration file, with "check", "review", "is this safe" | **schema-review** — change review |
| Nothing new to model, but a change to tables, columns, indexes, constraints, or stored values that **already exist** — "rename", "drop", "add a column to", "make … NOT NULL", "backfill", "write a migration" | **schema-migration** |
| Data or entities that **do not exist yet** — "we need to store", "design the schema / data model for", "which database fits" | **schema-design** |
| No argument | Look at the conversation and the working tree: uncommitted or branch changes to migrations, schema files, or ORM models → **schema-review**; otherwise ask |

**Check existence, don't assume it.** "Add subscriptions to accounts" is a migration if
`subscriptions` is one column on an existing table, and a design if it is a new entity with
its own lifecycle and relationships. Grep the schema dump, the ORM models, or the migrations
for the names in the request before choosing.

**A request that needs both** — a new entity plus changes to existing tables — goes to
**schema-design** first: its Evolution section is what `schema-migration` implements next. A
single new column, index, or constraint on an existing table is never a design.

## Rules

- **Classify with evidence.** Name what decided it — the document and its status line, the
  table you grepped and found (or didn't), the words in the request. A route you cannot
  evidence is a route you are guessing.
- **Ambiguity goes to the human, once.** One question naming the two routes and what each
  would produce, with your recommendation. Never route on a tie.
- **Pass arguments through unchanged.** `--repo`, `--ticket`, and `--headless` go to whichever
  skill you route to; `--store` only to schema-design; `--consumers` only to schema-review. A
  flag the target does not accept is named back to the user, not dropped silently.
- **Route once.** One skill, invoked once, and you are done. You do not supervise it or chain a
  second skill after it — each target names its own next step.

## Steps

### 1. Resolve the input

Take the argument: a plain-language request, a path, a PR number, a branch, or a range. A path
to a directory: list the database documents and migrations in it. Nothing at all: read the
conversation and `git status` / the branch diff for migrations and schema files.

### 2. Classify, with evidence

Read any document end to end — its status line and its sections, not its filename. Grep for
the structures the request names. Match against the table; record the signals that decided it
and the one that ruled out the runner-up.

### 3. Confirm when it is not clear-cut (hard stop)

Route without asking only when the evidence is unambiguous. Otherwise ask one question — the
two candidate routes, what each would produce, your recommendation and why — and wait.

### 4. Hand over

Invoke the chosen skill through the Skill tool — `software-engineering-skills:schema-design`,
`software-engineering-skills:schema-migration`, or `software-engineering-skills:schema-review` —
with the request or path and the passed-through flags. Say in one line which route you took and
why, then let that skill run its own steps. Do not restate its output as your own.

## Headless mode

Headless when `--headless` is passed or there is provably no human in the loop.

- **Classify and route** when the evidence is unambiguous, passing `--headless` on.
- **Ambiguity halts.** Report both candidate routes and their evidence, and stop.

## Report template

```markdown
**Routed to**: `<schema-design | schema-migration | schema-review>` — <one line: why>
**Input**: <request, path, PR, or branch> (<kind>, <status if a document>)
**Evidence**: <the signals that decided it>
**Rejected**: <the runner-up route> — <the signal that ruled it out>
**Passed through**: <flags>
```
