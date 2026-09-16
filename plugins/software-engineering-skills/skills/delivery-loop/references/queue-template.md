# Delivery queue template

The file `/delivery-loop` writes. Everything between the two outer fences below is the queue. `<…>` are placeholders the skill fills, `<a | b>` is a choice the skill makes, and `<!-- … -->` comments are instructions to the skill — every one of them is gone before the queue is scheduled. Sections marked *(no-SPEC queues: drop)* are removed when the queue runs `--stages plan,task`. The fenced **Human review** template is the one fence that stays: it is what agents copy.

The document is written for its readers in this order: a claiming agent with no memory of this conversation, the human who answers its questions, and whoever reads the ledger after the release has shipped.

````markdown
# Delivery queue: <TICKET> — <feature>, <n> slices, <m> units

**Ticket**: <ID · link | none>
**Source**: `<file>` (sibling in this directory) — the binding slicing, ordering and scope. This queue schedules it and records what happened; it never re-decides it
**Created**: <YYYY-MM-DD>
**Status**: <draft | running | stopped — waiting on HR-<n> | complete>
**Repository**: `<reference checkout>` (reference checkout, `<base branch>`, never edited) · remote `<remote url>` <!-- one line per repository the delivery touches -->
**Worktree root**: `<root>/<delivery-slug>/` — one worktree per PR branch, at `<root>/<delivery-slug>/<repo>/<branch>`; see **Worktrees**
**Stack update strategy**: <merge | rebase> — <evidence: the ruleset, branch protection setting or repo rule that decided it>
**Open-PR path**: <the repo's own `<skill>` skill | `software-engineering-skills:open-pr`>
**Open-PR cap**: <n> unmerged PRs at once. A task row that would exceed it stops the queue — see **Standing authorization**
**Cadence**: one agent attempts a claim every <n> minutes, via <scheduler> `<name or id>`. At most one task is claimable at any moment, so most ticks are a no-op and should exit silently
**Tick prompt**: `Follow the instructions in <queue path>. Read the whole file before acting. If no task is claimable, exit without writing anything.`
**Lock**: `/tmp/<ticket-slug>-delivery.lock`
**Queue file**: `<absolute path>` — this file, the single source of truth for what is done and what is next

---

## What this queue is

The source slices delivery into <n> releases. Each slice holds one or more **units** — the smallest piece that can carry a spec of its own — and each unit is produced by <a **spec** agent that writes `spec-S<n>-U<m>-<slug>.md`, a **plan** agent that writes `plan-S<n>-U<m>-<slug>.md` from that spec, | a **plan** agent that writes `plan-S<n>-U<m>-<slug>.md` from the existing spec,> and then one agent per task in that plan, each producing exactly one commit, and one agent per pull request, which pushes the branch and opens it.

**The board grows.** Only the rows for the first unit's <spec and plan | plan> exist right now. The task rows cannot exist yet, because the tasks are decided by the plan that has not been written — so each **PLAN** row appends its own successors to the board when it finishes. A short board is not a board with work missing.

The queue is serial by construction: at most one row is ever `READY`. An agent that finds nothing claimable has nothing to do and stops. This is the normal outcome of most ticks and is not a failure.

The queue never merges and never releases. It stops at open pull requests; **Release plan** records what each slice is waiting on.

When a task meets a conflict it cannot resolve without a decision, it writes a **Human review** block, the queue stops, and it stays stopped until the human answers in that block. The next tick after the answer resumes the task.

## Reading order for a claiming agent

Read these before touching anything, in this order. Do not begin work from this file alone — it is an index and a ledger, not a substitute for the source.

1. This file, in full — the board, the stack ledger, the brief for your unit, **Human review**, the decisions table, the guardrails.
2. `<source>` (sibling) — the slicing, its binding decisions, its open questions, and its scope boundaries, which are what you are allowed to touch.
3. <upstream documents the source cites: feature description, prioritization, spike reports — sibling paths>
4. Your unit's `spec-…md` and `plan-…md` when they exist — a TASK or PR row reads the plan; a PLAN row reads the spec.
5. <the house shape to copy for SPEC/PLAN rows, e.g. an earlier spec and plan in this directory>
6. `<workspace CLAUDE.md>`, each repository's `CLAUDE.md`, and the `.claude/rules/` files that match the files you touch. The repository's rules win over anything restated here.

## Standing authorization

The human approved this queue on <date>. That approval is the standing authorization for exactly these outward-facing acts, and no others:

- Pushing the branches recorded in the **Stack ledger**, and only those.
- Opening the pull requests named in the ledger, with the titles their plans give, against the bases the ledger gives<, as drafts>.
- Holding **at most <n> unmerged pull requests open at once**. A task row whose PR would be the <n+1>th does not start — it raises a **Human review** asking the human to merge the bottom of the stack, raise the cap, or pause the queue.
- <anything else the human explicitly authorized — or delete this line>

When a skill you invoke pauses to ask a human for input it could take from this queue — a PR body's "why", a final preview — answer it from the unit brief and the plan, proceed on this authorization, and say so in the plan's Build Log. Anything outward-facing not on this list is a **Human review**.

---

## Claim protocol

The lock is a directory, because `mkdir` is atomic. It is held for seconds — long enough to read the board and rewrite one row — and released before the real work starts. The work itself is done with the row marked `CLAIMED`, which is what keeps the next tick's agent away.

**Agent id**: `"$(hostname -s)-$$-$(date -u +%Y%m%dT%H%M%SZ)"`. Use the same id for the whole task, from claim to completion.

### 1 · Acquire the lock

```bash
QUEUE=<absolute queue path>
LOCK=/tmp/<ticket-slug>-delivery.lock
AGENT="$(hostname -s)-$$-$(date -u +%Y%m%dT%H%M%SZ)"

if ! mkdir "$LOCK" 2>/dev/null; then
  # A lock older than 10 minutes is a crashed holder, not a working one — the lock is only ever held across a few file edits.
  if [ -n "$(find "$LOCK" -name holder -mmin +10 2>/dev/null)" ]; then
    rm -rf "$LOCK" && mkdir "$LOCK" || exit 0
  else
    exit 0   # someone else is claiming right now; this tick is a no-op
  fi
fi
printf '%s %s\n' "$AGENT" "$(date -u +%FT%TZ)" > "$LOCK/holder"
```

### 2 · Claim a row

Under the lock, read the file's **Status** line first: `complete` means release and exit. Otherwise take the first claimable row, looking in this order:

1. The one row in **The board** whose Status is `READY`.
2. A `NEEDS-HUMAN` row whose **Human review** block has Status `ANSWERED` — you are **resuming** it; see step 7.
3. A `CLAIMED` row older than <6> hours — you are **reclaiming** it; see step 8.

If none exists, release the lock and exit without writing anything — including without writing to the event log. If one does, rewrite that row's Status to `CLAIMED`, put your agent id in **Claimed by**, and put the current UTC timestamp in **Claimed**. Then re-read the row and confirm it names your agent id; if it names someone else, you lost the race — release and exit.

### 3 · Release the lock, then work

```bash
rm -rf "$LOCK"
```

Release before starting the task. The `CLAIMED` row is the lock for the duration of the work; the directory lock only protects the board edit.

A TASK row that creates a worktree re-acquires the lock once, early, to write the branch, its resolved cut-from and the worktree path into the **Stack ledger** the moment the worktree exists — so a reclaimer can find it.

### 4 · Record completion

Re-acquire the lock exactly as in step 1. Then, in one edit: set your row's Status to `DONE`, fill **Completed** and **Output**, flip the *next* row from `BLOCKED` to `READY`, update the **Stack ledger** if you created a branch or a worktree, made a commit, or opened a PR, and append one line to the **Event log**. Release the lock. A task is not done until the board says so — the artifact existing on disk, or the commit existing on the branch, is not the signal any other agent reads.

### 5 · If you are a PLAN row, the same edit expands the board

A PLAN row has no successors to unblock until it creates them. In the **same locked edit** as step 4, append the rows its plan implies — see **A PLAN task** for the full contract — and flip the *first appended row* to `READY` instead of a pre-existing one. Never expand outside the lock, and never in a second edit: a board that is half-expanded is a board another agent can claim from.

### 6 · If you hit a conflict

Stop, and hand the decision to the human — but only when proceeding either way would produce work that is **wrong rather than merely debatable**: a contradiction between the source and the code that a binding decision does not settle, a unit that cannot be specified inside its slice boundary, a repository state you must not act on unilaterally (a dirty worktree, a HEAD the ledger does not record, a branch name already taken, commits that are not this queue's), or an outward-facing act the **Standing authorization** does not cover — including a PR that would exceed the open-PR cap. An ordinary open question is not this: record it under **Decisions awaiting the human**, state the assumption you proceeded on, and carry on.

To stop: re-acquire the lock and, in one edit, append a block to **Human review** copied from its template and filled in completely; set your row's Status to `NEEDS-HUMAN` with `HR-<n>` and a one-line reason in **Output**; set this file's **Status** line to `stopped — waiting on HR-<n>`; append an event-log line. Release. Leave every artifact you produced in place — files, worktree, branch, commits, uncommitted changes — and name all of them in the block. Then send one notification if a notification tool is available: `<TICKET> delivery queue stopped: HR-<n> needs your decision (<task>)`.

`NEEDS-HUMAN` stops the queue on purpose: no successor becomes `READY`, and only the human's answer restarts it.

### 7 · Resuming an answered review

A row you claimed through step 2.2 is a resumption, not a fresh start. Read the **Human review** block and its answer before anything else, then continue from what the block's **Left in place** names — never start the task over, and never discard what the first agent built.

Apply the answer as written. If it picks an option, carry that option out; if it is an instruction of its own, follow it. If the answer is ambiguous — you cannot act on it without guessing — do not guess: under the lock, add a **Follow-up** line beneath the answer saying exactly what is unclear, set the block back to `OPEN`, set your row back to `NEEDS-HUMAN`, append an event-log line, and release.

When the task completes, the step-4 edit also sets the block's Status to `APPLIED`, fills its **Applied** line with what you did, and restores this file's **Status** line to `running`.

### 8 · Reclaiming a stalled task

A row `CLAIMED` for more than **<6> hours** with no completion may be reclaimed by any agent, under the lock. Before resetting it, look for partial output — a spec or plan file already on disk, a worktree at the path the **Stack ledger** records, a commit on the branch, an open PR — and continue from it rather than starting over.

- A **PLAN** row that already wrote its plan file but did not expand the board: read the plan and run the expansion.
- A **TASK** row whose branch already carries a commit naming its task ID: the task is built; verify it against the plan's acceptance criteria and complete the row.
- A **TASK** row whose worktree is dirty: this is the one case where uncommitted work is expected. It is the stalled agent's, mid-task. Read it, finish or discard it deliberately, and say which in the event log — do not treat it as the foreign-state Human review that **Worktrees** describes.
- A **PR** row whose branch is already pushed, or whose PR already exists: continue from there; never open a second PR for a branch.

Read any `ANSWERED` **Human review** block for the task too. Append an event-log line naming what you found. Do not delete another agent's work.

---

## The board

Status values: `BLOCKED` (its predecessor has not finished) · `READY` (claimable now) · `CLAIMED` (an agent is working) · `DONE` · `NEEDS-HUMAN` (queue stopped; see the `HR-<n>` in Output).

Kinds: `SPEC` · `PLAN` · `TASK` (one plan task, one commit) · `PR` (push and open one pull request).

| Task | Kind | PR | Status | Claimed by | Claimed (UTC) | Completed (UTC) | Output |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **S1.U1-SPEC** | SPEC | — | READY | | | | |
| **S1.U1-PLAN** | PLAN | — | BLOCKED | | | | |
<!-- Nothing else yet. S1.U1-PLAN appends the TASK and PR rows for S1.U1, then the rows for S1.U2's SPEC and PLAN are appended by S1.U1's last PR row — see the unblocking rules below. -->

**Unblocking rules.** Rows are unblocked strictly downward, one successor each:

- `<n>.<m>-SPEC` → `<n>.<m>-PLAN`.
- `<n>.<m>-PLAN` → **expands** (see **A PLAN task**) and readies the first row it appended.
- A `TASK` row → the next row of the same unit: the next `TASK`, or the `PR` row of its PR when it was that PR's last task.
- A `PR` row → the first `TASK` row of the next PR in the same unit; when it was the unit's last PR, it appends the next unit's <`SPEC` | `PLAN`> and `PLAN` rows and readies the first of them.
- The last `PR` row of the last unit of the last slice readies nothing: set this file's **Status** line to `complete`, mark the slice delivered in **Release plan**, and say in the event log that the schedule `<name or id>` can be removed.

---

## What each kind of task does

### A SPEC task *(no-SPEC queues: drop)*

Write `spec-S<n>-U<m>-<slug>.md` into this directory using the specs skill (`software-engineering-skills:specs`), for the scope of **that unit only** as its brief defines it. Copy the shape of `<house spec>`.

**Read the code at the ref this unit's first branch will be cut from**, not at the base branch and not at a working tree: that is `origin/<base branch>` when every earlier unit's PRs are merged, and `origin/<last branch in the Stack ledger>` otherwise. Resolve it the same way a TASK row does (see **A TASK task**, step 1), state the ref and its SHA in the spec's metadata, and read through `git show <ref>:<path>` / `git grep <pattern> <ref>` or a throwaway `git worktree add --detach` you remove before you finish. Never read from another row's worktree: it can hold uncommitted work that is on no branch.

The skill wants a human in the loop and there is not one. Resolve ambiguity in this order: the source's binding decisions settle most of it; the repositories' `.claude/rules/` settle convention questions; anything left goes in the Ambiguity Log with your recommendation **and** a row in **Decisions awaiting the human**, after which you proceed on your stated assumption. Only a conflict that passes step 6's test becomes a **Human review**.

Set the spec's own **Status** line to `approved` — there is no separate approval step in this queue, and the plan task needs a spec it is allowed to build on. The board is the approval record.

### A PLAN task

Write `plan-S<n>-U<m>-<slug>.md` beside the spec using the plan skill (`software-engineering-skills:plan`), reading <the spec | `<the existing spec path from the unit brief>`> as its input. Copy the shape of `<house plan>`. Read code at a ref, as a SPEC task does. Keep the PR stack shallow — <2> PRs is the expected shape for a unit this size, and the ceiling below is not a target.

The plan's metadata carries `**Repository**` and `**Base branch**`; its `## PR Stack` table carries a branch name per PR. **Do not write worktree paths or resolved bases into the plan** — those are the ledger's, resolved when each branch is actually created.

Then, **in the same locked edit that completes your row** (claim protocol step 5), expand the board:

1. For each PR in the plan's stack table, in order, and for each task in that PR's checklist, in order: append one board row, `Kind` = `TASK`, `Task` = `<unit> · <the plan's own task ID>` (`S1.U2 · E1`), `PR` = the plan's PR number, Status `BLOCKED`.
2. After each PR's last task row, append one row with `Kind` = `PR`, `Task` = `<unit> · PR<k>`, Status `BLOCKED`.
3. Append one **Stack ledger** line per PR: unit, repo, branch (from the plan), PR base (the previous PR's branch, or `resolved at first task` for the unit's first PR), everything else empty.
4. Flip the first appended row to `READY`; mark your own row `DONE`.
5. Append one event-log line naming the counts: `expanded <unit> into <t> task rows across <p> PRs`.

Three rules keep the expansion honest:

- **One row per plan task, and nothing else.** Never merge two small tasks into one row, never split a large one, never add a row the plan does not contain. If the plan is wrong, that is a plan problem, not a board edit.
- **A branch name in the plan's stack table that already exists** — locally or on the remote — is a **Human review**. Do not rename it yourself: the name is in the plan, and the plan is what the builder reads.
- **The ceiling is <15> task rows or <4> PRs for one unit.** Expand anyway, and add a row to **Decisions awaiting the human** saying the unit was coarser than one spec should be. The work is not wrong; the slicing was.

If the plan cannot be written because the spec is internally inconsistent, fix nothing silently: record it in **Decisions awaiting the human**, write the plan on the reading you judge correct, and say in the Approach section which reading you took. Set the plan's **Status** to `approved`.

### A TASK task

Build **exactly one** task of your unit's plan — the one your row names — as exactly one commit. In order:

1. **Find or create your branch's worktree.** The **Stack ledger** line for your PR says which branch you are on.
   - *The ledger records a worktree for this branch*: use it, and check its preconditions first — `git -C <worktree> status --porcelain` is empty, and `git -C <worktree> rev-parse HEAD` equals the **Head** the ledger records. Anything else is a **Human review** (see **Worktrees**).
   - *It does not*: you are this PR's first task. Resolve the cut-from, then create it:
     ```bash
     git -C <reference checkout> fetch origin
     git -C <reference checkout> worktree add -b <this PR's branch> <root>/<delivery-slug>/<repo>/<this PR's branch> <cut-from>
     ```
     `<cut-from>` is `origin/<the previous PR's branch>` when your PR is not the unit's first. When it **is** the unit's first: `origin/<base branch>` if every PR in the ledger above it is `merged` — check with `gh pr view <n> --json state,mergedAt` and confirm with `git merge-base --is-ancestor origin/<that branch> origin/<base branch>` — otherwise `origin/<the last branch in the ledger>`. Record the resolved value **and the evidence** in the ledger.
   - **Before creating anything**, count the ledger's PRs whose State is not `merged` or `closed`. If creating this branch would take the queue past the **Open-PR cap**, stop: that is a **Human review**, and the options are merge the bottom of the stack, raise the cap, or pause the queue.
   - If the path or the branch already exists and the ledger does not record it as this PR's, stop: **Human review**, not something to delete or adopt.
2. **Bootstrap it** on first creation: `<bootstrap command>` from the worktree root (<fallback, e.g. `pnpm install --force` on `Cannot find native binding`>). Prove the baseline suite green before writing anything. Later tasks on the same branch skip this unless the repo's tooling says otherwise.
3. **Confirm the base** on first creation: `git merge-base --is-ancestor <cut-from> HEAD` must succeed. A branch cut from the wrong base is a failure this queue exists to prevent — check it before writing code, not after.
4. **Build the one task** with the build skill (`software-engineering-skills:build`), handing it this brief and nothing wider:
   > Build **only** task `<ID>` from `<plan path>`, in the existing worktree `<path>` on branch `<branch>`. The worktree and the branch are the queue's — do not create, switch, rebase or merge any branch, do not push, and do not open a pull request; a later row does that. Red → green → yellow gate → exactly one commit, named for the task. Stop and report blocked if anything in the task does not match the code.
   The full task block from the plan — files, acceptance criteria, verification, tests, scenarios — goes into that brief verbatim. <Commit attribution rule from the guardrails, restated.>
5. **Verify** the task's own verification from the plan, yourself, and tick that task's checkbox and its acceptance-criteria checkboxes in the plan with the commit SHA. A criterion you cannot verify as written is a **Human review**, not a tick.
6. **Record** on the board: Status `DONE`, the commit SHA in Output; update the ledger's **Head** for this branch to the new SHA; flip the next row to `READY`. Leave the worktree in place.

A build that reports `blocked`, a task that turns out to be two, a file the plan names that is not there — all of these are step 6 conflicts. Never widen the commit to route around them.

### A PR task

Close the branch your row names, and open its pull request. In order:

1. **Check the branch** in its worktree: the ledger's **Head** matches, the tree is clean, every task row of this PR is `DONE`, and the plan's boxes for them are ticked.
2. **Run the branch checks** the repository's CI will run, scoped to what this branch changed. Report what you skipped and why — a silent skip reads as a pass.
3. **Judge it.** Dispatch `plan-conformance-judge` with this PR's tasks from the plan, the spec criteria they trace to, `git diff <cut-from>...<branch>`, and the commit list. `deviates` or `unverifiable` on any task is a **Human review** — never let it be quietly fixed.
4. **Push** `git -C <worktree> push -u origin <branch>`.
5. **Open the PR** through the **Open-PR path** in the metadata, never bare `gh pr create`. Its base is the previous PR's branch, or the branch's cut-from for a unit's first PR — verify after the fact with `gh pr view <n> --json baseRefName` and correct with `gh pr edit <n> --base <branch>` if the skill defaulted. The body carries: the unit and slice, the plan path, the tasks with their commits, the yellow-gate and judge results, the checks run and skipped, and how a reviewer or tester verifies it.
6. **Write the gate into the PR body** if the unit brief or **External merge gates** names one — a `> **Do not merge until …**` line at the top.
7. **Put a monitor on it**: `software-engineering-skills:monitor-pr`, or a `pr-monitor` agent in its own throwaway worktree — never in this branch's worktree. Record which, and its state, in the ledger.
8. **Record** on the board and in the ledger: PR URL, State `open`. If this was the unit's last PR, append the next unit's rows and ready the first; if it was the slice's last unit, mark the slice `delivered — awaiting the human` in **Release plan** and send one notification.

Do not merge anything. Do not approve anything. Do not enable a flag. <Do not force-push — a repository ruleset blocks it on every branch, so a branch whose history needs rewriting has to be recreated, and recreating a branch mid-stack invalidates everything above it.>

**Bringing `<base branch>` into the stack.** <Merge strategy: because force-push is blocked, the stack is updated by **merge**, never rebase — merge `origin/<base branch>` into the lowest branch, then each branch into the next up the stack. | Rebase strategy: `git rebase --onto` each branch onto its new parent, then `git push --force-with-lease`.> Every update to an earlier branch happens in a **throwaway detached worktree** at `origin/<that branch>`, pushed with `git push origin HEAD:<that branch>` and removed afterwards — never inside that branch's own worktree, which belongs to its PR's rows. When an ancestor PR squash-merges into `<base branch>`, retarget its child with `gh pr edit`, then merge `origin/<base branch>` into the child and resolve conflicts in favour of the child's content — the squashed ancestor and the child's copy of those commits are the same change twice.

---

## Worktrees

**One worktree per PR branch**, created by that PR's first TASK row at `<root>/<delivery-slug>/<repo>/<branch>`, used by every later row of the same PR, and kept as that PR's home until the PR merges or closes.

- **Why per branch and not per task.** Several rows build one branch in succession, so they share its checkout; paying a bootstrap per commit would be absurd. What a shared checkout costs — state nobody owns — is bought back by the ledger: every entry is preconditioned on a **clean tree at the Head the ledger records**.
- **A precondition failure is a Human review, always.** A dirty tree, a HEAD the ledger does not know, a detached HEAD, a branch checked out somewhere else, or a path that exists and is not in the ledger. Never `git checkout`, `git stash`, `git reset` or `rm -rf` your way past it — someone's work is in there, and whose it is decides what happens to it. The one exception is the reclaim case in claim-protocol step 8, where the dirty tree is the stalled agent's own.
- **SPEC and PLAN rows keep no checkout.** They read at a ref: `git show`, `git grep`, or a `git worktree add --detach` they remove before they finish.
- **Updates to an earlier branch** (merging the base up the stack, a fix a monitor pushes) happen in a throwaway detached worktree and are pushed to the remote branch. That branch's own worktree is then behind its remote; whoever works there next pulls first and updates the ledger's Head.
- **Monitors never use a queue worktree.** Their own throwaway checkout, cleaned up by them.
- **Cleanup is not the queue's job.** A PR worktree is removed with `git worktree remove` once its PR has merged or closed and nothing is using it — by the human, or by `software-engineering-skills:monitor-pr`.
- **The cost is accepted**: one `<bootstrap command>` per PR branch.

---

## Stack ledger

One line per pull request, appended by the PLAN row that planned it and filled in as its rows run. **Head** is the SHA the last completed TASK row committed, and is the precondition every later row on that branch checks.

| Unit | PR | Repo | Branch | Cut from (resolved) | PR base | Worktree | Head | PR | Monitor | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1.U1 | 1 | `<repo>` | `<branch>` | <resolved at first task> | <resolved at first task> | | | | | not started |
<!-- State: not started · building · pushed · open · merged · closed. "Cut from" carries its evidence — which PRs were merged when it was resolved. -->

---

## Release plan

What each slice delivers, and what a human must do to release it. **Agents record against this table; only a human clears a gate.** A delivered slice does not block the next one — delivery continues while releases queue up behind the human.

| Slice | Outcome / KPI | Units | Flag (default) | Guardrail metric · threshold | Release gate | State |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | <outcome — the behaviour change and by how much> | S1.U1, S1.U2 | `<flag>` (<off>) | <metric · source · threshold> | <what the human must do: merge the stack, enable the flag at <n>%, watch <metric> for <n>h> | pending |
<!-- State: pending · in progress · delivered — awaiting the human · released. Set by agents up to "delivered"; "released" is the human's. -->

---

## Unit briefs

Each brief is the scope contract for its unit's rows. It is a pointer into the source, not a replacement for it — the source's scope boundaries govern, and anything they list as out of scope stays out even if you find it broken while you are in there.

### <S1.U1> — <unit name>

**Slice**: S1 — <slice outcome> · **Repo**: `<repo>` · **Spec**: `spec-S1-U1-<slug>.md` · **Plan**: `plan-S1-U1-<slug>.md`

**Covers**: <the rib or sliced item, quoted from the source with its section or table location>

**Delivers**: <the observable capability, in one or two lines — what a user or a calling client can do afterwards that they cannot do now>

**Out of scope**: <the sibling units, and anything the source reserves for a later slice or another ticket>

**Must be proven**: <the evidence the PR body carries, if the source names one — a measured number, a probe that goes red — or "the plan's verifications">

**Merge gate**: <none | the ticket or PR that must merge first — see External merge gates>

---

## External merge gates

These block **merging**, not building. An agent never waits on one; it records it and keeps going. Only a human clears a gate.

| Gate | Blocks | State as of <date> | Cleared |
| --- | --- | --- | --- |
| <ticket or PR — what it does> | <unit or PR> merge | <observed state, who observed it, when> | ☐ |

---

## Human review

**Blocking conflicts only.** A task that cannot proceed either way without a decision writes one block here, sets its board row to `NEEDS-HUMAN`, and stops — and the queue stops with it (claim protocol step 6). Everything that can proceed on a stated assumption goes in **Decisions awaiting the human** instead.

**To answer a block**: write your decision under **Human answer** — an option letter, a letter with conditions, or an instruction of your own — fill **Answered by**, and change the block's **Status** from `OPEN` to `ANSWERED`. That is all: you do not need to touch the board. The next tick resumes the blocked task from where it stopped, applies your answer, and sets the block to `APPLIED`. To clear a block without a decision — you fixed it by hand, or it no longer applies — write that as the answer and set the Status to `WITHDRAWN`, then set the board row back to `READY` and this file's **Status** line back to `running` yourself.

Status values: `OPEN` (waiting for the human) · `ANSWERED` (decided; the next tick resumes the task) · `APPLIED` (an agent acted on the answer) · `WITHDRAWN` (cleared by the human without a decision for the agent to apply).

Blocks are numbered `HR-1`, `HR-2`, … in the order they are raised, appended below the template, and never deleted or renumbered. An `APPLIED` block is the record of a decision; leave it where it is.

### Template — copy it below the last block; never fill it in here

```markdown
### HR-<n> · <task> · <the decision needed, as one question>

**Status**: OPEN
**Raised**: <UTC timestamp> by `<agent id>`
**Blocks**: `<task>`, and every row below it
**Left in place**: <every artifact the task produced — files, worktree path, branch @ sha, commits, uncommitted changes, open PRs — or "nothing">

**What the task was doing**
<One paragraph: which task, which step of it, and what had to be true for it to continue. Written for someone who has not read the unit's spec or plan.>

**The conflict**
- **<document> says**: <quote it, with the file and the line or section>
- **What is true**: <the evidence — path:line, the command that was run and its output, the commit SHA it was read at>

**Why this cannot proceed on an assumption**
<One paragraph: what each reading would build, and which binding decision, scope boundary, guardrail or authorization it would break. This is the test that separates a Human review from a Decisions-table row — if this paragraph cannot be written, the item belongs in the table.>

**Options**
- **A.** <option> — <what it costs, what it changes downstream, which later rows, PRs and slices it touches> ← recommended, because <reason>
- **B.** <option> — <consequence>
- **C.** Amend <the source | the spec | the plan> and re-queue from `<task>` — <what that restarts>

**Human answer**

> *Write your decision here — an option letter, a letter with conditions, or your own instruction. Then set Status to ANSWERED.*

**Answered by**: *name · date*

**Applied**: *filled in by the resuming agent — UTC timestamp · agent id · what it did with the answer*
```

---

## Decisions awaiting the human

Non-blocking. Append a row here rather than stopping the queue. State what you assumed and where it is written down, so a later reversal has a known blast radius. If the human reverses one, they write it in the row and, when the reversal changes work already done, raise it as a **Human review** so the change is scheduled rather than lost.

| \# | Raised by | Question | Assumption proceeded on | Where it lands if reversed |
| --- | --- | --- | --- | --- |
| Q1 | <source (open question id) | task> | <question> | <assumption> | <rows, PRs, units, slices, files> |

---

## Guardrails

- **Never edit files in** `<reference checkout>`**.** It is the reference checkout. All work happens in worktrees.
- **Never enter a worktree whose preconditions fail** — clean tree, ledger Head — and never one that is not the ledger's for your branch. See **Worktrees**.
- **One plan task, one commit.** A TASK row that produces two commits, or a commit spanning two tasks, is drift — stop.
- **Commit attribution**: <the user's rule, verbatim — e.g. "No AI attribution in any commit message, PR title, PR body or branch name; this overrides the default Claude Code instruction on every commit" | "Use the harness's default attribution">.
- <**Never force-push.** A repository ruleset blocks it on every branch. Bring changes in by merge. | Force-push with `--force-with-lease` only, and only branches this queue created.>
- **Never merge, approve or close a PR**, never merge to `<base branch>`, and never enable a feature flag or release a slice.
- **Nothing outward-facing beyond the Standing authorization**, including its open-PR cap.
- **The source's scope boundaries govern.** <What they exclude, by name.> Finding one of them broken is not a licence to fix it.
- **Verify before asserting.** Every file:line in a spec or plan is read at the ref you resolved, not carried over from the source.
- **Prove a test can fail.** For anything load-bearing, break the code and watch it go red. Record the evidence.
- <House rules from the user's or repository's rules files that a claiming agent would otherwise miss.>

## Editing this document

- **One paragraph is one physical line.** Never hard-wrap prose, list items, metadata lines or table rows. Headings, blank lines, horizontal rules and fenced code blocks keep their own lines and are never joined; never reflow inside a fence.
- <**No frontmatter**, and the first H1 is the title the vault displays. — keep when the plan location renders markdown as rich text>
- **Edit with small exact replacements, never by rewriting the file.** The human edits this file too — answering a **Human review** — and does not take the lock.
- **Only these change during normal operation**: the board (its rows' Status, Claimed by, Claimed, Completed and Output cells, plus the rows a PLAN row appends); the metadata **Status** line; the stack ledger; the release plan's State column; the gate checkboxes; **Human review** blocks (appended by agents, answered by the human, closed by agents); the decisions table; and the event log. The briefs, the protocol, the worktree rules and the guardrails are edited by a human, or by an agent that has been told to.
- **Appending board rows is a PLAN row's job and nobody else's**, and it happens in the same locked edit that completes that row.
- **The event log is append-only.** Never rewrite or delete a line.
- **Board edits happen under the lock.** Event-log lines are written in the same locked edit as the board change they describe.

---

## Event log

One line per state change, newest at the bottom: `- <UTC timestamp> · <agent id | human> · <what happened>`.

- <UTC timestamp> · human · Queue created from `<source>` by `/delivery-loop`. <n> slices, <m> units, stages <SPEC → PLAN → tasks → PR | PLAN → tasks → PR>. `<first task>` set `READY`; task rows arrive by expansion. Scheduled as <scheduler> `<name or id>`, every <n> minutes.
````
