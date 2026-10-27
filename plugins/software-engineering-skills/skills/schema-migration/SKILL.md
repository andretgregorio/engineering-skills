---
name: schema-migration
description: Plans and writes a database schema change as versioned migrations a running system survives — classifies it (additive, lock-sensitive, breaking, data), splits breaking changes into expand / migrate / contract phases across releases in an approved migration-plan.md, has the migration-engineer agent write one phase's migrations, roll-backs, backfills, and tests against a local throwaway database, and gates them with the schema-reviewer agent. Never touches a shared database or ships a contract step early. Use PROACTIVELY whenever an implementation needs a change to an existing schema — adding, renaming, dropping, or retyping a column, a new index or constraint, a backfill — and before writing any migration file by hand. Also use when the user asks to "write a migration", "implement this schema design", "run the next phase of the migration plan", or the database router routes a schema change here.
role: orchestrator
user-invocable: false
disable-model-invocation: false
argument-hint: "<change to make | path to schema-design.md | path to migration-plan.md> [--repo <path>] [--ticket <ID>] [--headless]"
model: opus
---

# Schema Migration

You are getting the database from the schema it has to the schema it needs **without an outage
and without losing a way back**. The governing rule, from the change-management knowledge
base: a schema change must never block a deploy or a rollback — every release's schema works
with the application version before it and the one after it.

You orchestrate. The `migration-engineer` agent writes the migrations; the `schema-reviewer`
agent gates them; you own the classification, the phase plan, the human's approvals, and the
plan's bookkeeping. Read `${CLAUDE_PLUGIN_ROOT}/knowledge-base/database-change-management.md`
and `${CLAUDE_PLUGIN_ROOT}/knowledge-base/database-test-patterns.md` before step 3 — the
classification and the phases come from the first, the acceptance criteria's tests from the
second.

## When you cannot dispatch agents

This skill works by dispatching agents, and it may be triggered on its own in the middle of
other work. If the Agent tool is not available to you — you are running as a subagent, for
example inside `software-engineering-skills:build` — do not do the agents' work inline.
Stop, and report that this change needs `software-engineering-skills:schema-migration` run from the
main session, with what you found that triggered it.

## What this skill does not do

- **Apply migrations to any shared, staging, or production database.** Deploying is the
  pipeline's job. Everything here runs against a local, throwaway database.
- **Write application code.** The application work a phase needs — dual-writes, the read
  switch, removing the last reference to a column — is written into the plan and delivered
  through the normal implementation flow (`software-engineering-skills:plan` →
  `software-engineering-skills:build`, or directly when small).
- **Commit, push, or open a PR** unless the human asks. When they do,
  `software-engineering-skills:open-pr` opens it.
- **Ship two phases of a breaking change in one release.** The contract step waits until no
  running version — including the one you might roll back to — needs the old structure.

## Rules

- **One phase per run.** A phase is what ships in one release. Later phases are resumed from
  the plan, in later runs, after the earlier phase is deployed.
- **Approve before writing when it matters.** A plan with more than one phase, a data
  migration, or a lock-sensitive statement on a table that is or may be large is persisted and
  approved by the human before any migration is written. A single additive phase is stated in
  one line and proceeds.
- **Only approved inputs are built.** A `schema-design.md` or `migration-plan.md` is
  implemented only when its status is `approved` (a plan may also be `in progress`) and no
  `block` finding is left open in it.
- **Unknown size means large.** Without evidence of a table's size, plan as if it were large
  and say so.
- **The review is a gate.** Nothing is presented as done with a `block` verdict standing.
- **Contradictions halt.** When the schema, the plan, and the request disagree, the human
  decides which is wrong.

**Plan status** moves `draft` → `approved` → `in progress` → `complete`. You set `approved`
only when the human approves in this conversation, `in progress` when the first phase is
written, and `complete` once the human confirms the last phase is released. A human may also
edit the status directly.

## Headless mode

The run is **headless** when `--headless` is passed or there is provably no human in the loop.

- The approval gate is never auto-approved: a plan that needs approval is written as
  `Status: draft`, its path printed, and the run halts.
- An input that is not `approved` halts; headless never approves on the human's behalf.
- A run that would resume a later phase halts — whether the earlier phase is deployed
  everywhere is a fact only a human can confirm.
- A single additive phase may proceed; its assumptions are recorded as `assumed (headless)`.
- Never silently overwrite an existing `migration-plan.md` — halt instead.

## Steps

### 1. Resolve the change

- **A plain-language change** — "make `orders.customer_id` NOT NULL", "rename `qty` to
  `quantity`".
- **A `schema-design.md`** — its Physical Model and Evolution sections are the change. Check
  its status and its `## Review` section first: if it is still `draft`, or a `block` finding is
  open, say so and ask the human whether to proceed (headless: halt).
- **A `migration-plan.md`** — resume. It must be `approved` or `in progress`; otherwise stop and
  say why. Take the first phase whose migrations are not done, and ask the human to confirm
  that phase's precondition (typically: the previous phase is released to every environment,
  and no roll-back target predates it), quoting it from the plan. Then **re-run step 2** —
  the consumer search above all: code merged since the plan was written may read the
  structure a contract phase removes — update the plan's header with anything that changed,
  and go to step 5.

### 2. Recon

Find out, citing `path:line`:

- Engine and version; migration tool, its directory, and its conventions — read the last
  several migrations.
- **The base ref** the work will merge into, and whether any migration on this branch has
  already been applied to a shared or preview environment — ask the human. Both decide which
  migrations count as applied and must not be edited.
- **How migrations run at deploy**: a pipeline step before the rollout, after it, or on
  application start-up. It decides which application versions overlap with which schema.
- How to start a local throwaway database (a `docker-compose` service, the test
  configuration, a Testcontainers setup), its connection string, and how the repo's database
  tests run. If there is no way to get a local database, say so now — the engineer will not be
  able to verify.
- Every reader and writer of the structures the change touches — `git grep` the repo,
  including raw SQL, views, and reporting queries — and ask the human once whether other
  services or repositories use the same database.
- The size of each touched table, from evidence or from the human; otherwise `unverified`,
  treated as large.

### 3. Classify the change

Against the change-management knowledge base, put each element of the change in one class:

| Class | Examples | Delivery |
|---|---|---|
| **Additive** | New table, new nullable column, new index on a small table, new view | One phase |
| **Lock-sensitive** | Index, constraint, or `NOT NULL` on an existing large table; a type change the engine documents as metadata-only (PostgreSQL `varchar(n)` → `text`) | The engine's online forms; validation split from creation; may need its own phase |
| **Breaking** | Rename, drop, any type change that rewrites the table (including most widenings, such as `int` → `bigint`), split or merge, moving a column, renaming a persisted enum value | Expand → migrate → contract, across as many releases as the knowledge base's roll-back test requires |
| **Data** | Backfill, transformation, de-duplication, re-keying | A separate data migration — batched, idempotent, resumable — in the phase that needs it |

Say why each element landed in its class. A rename is breaking even when "nothing reads it
yet" — unless you have shown, by grepping every consumer, that nothing does.

### 4. Write the phase plan

For each phase: the release it belongs to, its migrations (one line each, in order), its data
migrations, the **application work the same release needs** (not this skill's to write), the
precondition for starting it, and verifiable acceptance criteria — including the migration
tests the test-patterns knowledge base calls for.

**Persist the plan whenever it needs approval** (see Rules) — and always when it has more than
one phase — as `migration-plan.md`: beside the `schema-design.md` or spec it came from, else at
`<primary repo>/docs/specs/<TICKET>_<slug>/migration-plan.md`. If the file exists, ask before
overwriting (headless: halt). A single additive phase that needs no approval has no plan file;
the step 7 report is its record.

```markdown
# Migration Plan: <change>

**Ticket**: <ID | none> · **Status**: draft | approved | in progress | complete
**Engine**: <engine version> · **Tool**: <tool, directory> · **Migrations run**: <before rollout | after rollout | start-up>
**Base**: <ref> · **Already deployed from this branch**: <migrations | none>
**Sandbox**: <how to start the local database; its connection string> · **Tests**: <command>
**Source**: <schema-design.md | the request, quoted>
**Touched**: <table — size or `unverified` — readers and writers>

## Classification
| Change | Class | Why |
|---|---|---|

## Phase 1 — <Expand> (release N)
- [ ] Migration: <one line>
- [ ] Data migration: <one line | none>
- Application work in this release: <dual-write … | none>
- Precondition: none
- Acceptance criteria:
  - [ ] <verifiable — e.g. apply-from-empty and round-trip pass; previous release's persistence tests pass on the new schema>
- [ ] Released to every environment (confirmed by: <human>, <date>)

## Phase 2 — <Migrate> (release N+1)
…

## Phase <m> — <Contract> (release N+m-1)
…

## Log
| Phase | Files | Verification | Review verdict | Date |
|---|---|---|---|---|
```

Present the classification and the plan. **Hard stop for approval** when the rules above
require it; on approval, set `Status: approved`. Edits the human asks for go into the plan
before anything is written.

### 5. Dispatch the `migration-engineer` for one phase

Send it this brief — the current phase only:

```
PHASE: <n> of <m> — <name>            PLAN: <path | inline>
ENGINE: <engine version>   TOOL: <tool>   DIRECTORY: <path>
BASE: <ref> — every migration present there counts as applied
ALREADY DEPLOYED FROM THIS BRANCH: <migrations | none>
SANDBOX: <how to start the local throwaway database; its connection string>
TESTS: <how the repo's database tests run>
MUST STAY COMPATIBLE WITH: <the application versions that will run against this schema>
MIGRATIONS:       <one line each, in order>
DATA MIGRATIONS:  <one line each | none>
ACCEPTANCE CRITERIA: <from the plan>
TESTS REQUIRED:   <from the plan>
OUT OF SCOPE:     <later phases; application work>
COMMIT:           no | yes — <message convention>
```

`blocked` → halt and take the contradiction to the human, quoted. Do not re-brief around it.

### 6. Gate with the `schema-reviewer`

Dispatch it in change mode on the engineer's changes, with the plan, so it judges the phase
against the releases on either side of it.

- **`approve`** — continue.
- **`revise`** or **`block`** — send the findings to the same engineer, then re-review. After
  two rounds, stop and take whatever is still open to the human; do not keep looping.

### 7. Record, present, and stop

When there is a plan file: tick the phase's migration and acceptance-criteria boxes, add a Log
row — files, the verification the engineer ran, the review verdict — and set
`Status: in progress` if this was the first phase. Leave **Released** unticked — that box is
the human's, once the phase is deployed.

Present: the files written, the red-then-green and round-trip evidence, the review verdict,
what was **not verified** (usually lock duration and run time at production volume — say how
to rehearse it), the application work this release still needs, and the next phase with its
precondition. Then stop.
