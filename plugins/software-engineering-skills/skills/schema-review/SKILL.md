---
name: schema-review
description: Reviews a database schema change or schema proposal and returns approve, revise, or block, with Critical / Moderate / Low findings and path:line evidence. For a change (migrations, schema files, ORM model edits) it checks compatibility with the running and roll-back application versions, reversibility, lock and rewrite risk, backfills, and migration tests; for a proposal (design doc, ADR, RFC) access-pattern coverage, pattern fit, integrity, and evolution. Read-only — dispatches the schema-reviewer agent. Use PROACTIVELY before committing or opening a PR whose diff touches migrations, schema files, or ORM models, and whenever a schema design or data-model proposal is put forward in a discussion. Also use when the user asks "is this migration safe", "review this schema / data model", or the database router routes a review here.
role: helper
user-invocable: false
disable-model-invocation: false
argument-hint: "[<migration file | design doc | branch | PR number | base..head>] [--repo <path>] [--consumers <path,path>]"
---

# Schema Review

You are producing **one review** of a schema change or a schema proposal — not fixing it. The
review answers whether the change will hurt the running system or its data, and whether the
model will serve the workload it was designed for.

## When you cannot dispatch agents

This skill works by dispatching agents, and it may be triggered on its own in the middle of
other work. If the Agent tool is not available to you — you are running as a subagent, for
example inside `software-engineering-skills:build` — do not do the agents' work inline.
Stop, and report that this change needs `software-engineering-skills:schema-review` run from the
main session, with what you found that triggered it.

## What this skill does not do

**It never modifies migrations, schema, code, or data, and never connects to a database.** It
reads and reports. Acting on a finding is separate, human-approved work — through
`software-engineering-skills:schema-migration` for migration fixes, or `software-engineering-skills:schema-design` to rework a proposal.

## Steps

### 1. Resolve the target

- **A file** — a migration, a schema file, or a design document (`schema-design.md`, an ADR,
  an RFC).
- **A PR number** — fetch its base and head with `gh pr view <n> --json baseRefName,headRefName`
  and review `base...head`.
- **A branch or a range** — `<branch>` means `<default branch>...<branch>`.
- **Nothing** — the current branch against the default branch; if the working tree has
  uncommitted migration changes, include them and say so.
- `--repo <path>` — the repository root when it differs from the current directory.
- `--consumers <path,path>` — other repositories that read or write the same database. A
  compatibility judgement made without them is partial; ask once whether any exist when the
  target touches a table whose name suggests it is shared, and record the answer.

Say what you resolved — the mode you expect (change, proposal, or both) and the files in
scope — before dispatching, so the human can redirect early. If the target contains neither
migrations, schema changes, nor a design document, say so and stop: there is nothing for this
skill to review.

### 2. Dispatch the `schema-reviewer` agent

Hand it the target, the repository path, any consumer repositories, and — for a proposal —
the workload profile or spec it was designed against when one sits beside it. It reads the
three database knowledge bases itself and returns the report as its final message.

Do not pre-digest the diff or summarize the design for it. Its judgement is only as good as
the evidence it gathered itself, and its value is that it reads cold.

### 3. Present the report and stop

Show the verdict, the summary, and every Critical finding in your reply; point to the full
report for the rest. When reviewing a document, write the report as `schema-review.md` beside
it — ask before overwriting an existing one. When reviewing a change, keep it in the
conversation unless the human asks for a file.

Do not act on any finding unasked. A `block` verdict is information for the human, not an
instruction to start editing.
