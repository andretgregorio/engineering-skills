# Queue document template

The file `/implementation-loop` writes. Everything between the two outer fences below is the queue. `<…>` are placeholders the skill fills, `<a | b>` is a choice the skill makes, and `<!-- … -->` comments are instructions to the skill — every one of them is gone before the queue is scheduled. Sections marked *(CODE-only queues: drop)* are removed when the queue runs one CODE task per PR. The fenced **Human review** template is the one fence that stays: it is what agents copy.

The document is written for its readers in this order: a claiming agent with no memory of this conversation, the human who answers its questions, and whoever reads the ledger after the stack has merged.

````markdown
# Queue: <TICKET> — <feature>, <n> stacked PRs

**Ticket**: <ID · link | none>
**Source plan**: `<file>` (sibling in this directory) — the binding approach and PR ordering. This queue schedules it and records what happened; it never re-decides it
**Created**: <YYYY-MM-DD>
**Status**: <draft | running | stopped — waiting on HR-<n> | complete>
**Repository**: `<reference checkout>` (reference checkout, `<base branch>`, never edited) · remote `<remote url>` <!-- one line per repository the stack touches -->
**Worktree root**: `<root>/<plan-slug>/` — every CODE task creates its own worktree at `<root>/<plan-slug>/<repo>/<branch>`. Worktrees are never reused; see **Worktrees**
**Stack update strategy**: <merge | rebase> — <evidence: the ruleset, branch protection setting or repo rule that decided it>
**Open-PR path**: <the repo's own `<skill>` skill | `/open-pr`>
**Cadence**: one agent attempts a claim every <n> minutes, via <scheduler> `<name or id>`. At most one task is claimable at any moment, so most ticks are a no-op and should exit silently
**Tick prompt**: `Follow the instructions in <queue path>. Read the whole file before acting. If no task is claimable, exit without writing anything.`
**Lock**: `/tmp/<ticket-slug>-queue.lock`
**Queue file**: `<absolute path>` — this file, the single source of truth for what is done and what is next

---

## What this queue is

The source plan proposes <n> pull requests, in order. <Each one is produced by three agents in strict succession: a **spec** agent writes `spec-pr-N-<slug>.md`, a **plan** agent writes `plan-pr-N-<slug>.md` from that spec, and a **code** agent builds the branch in a worktree of its own and opens the PR. | Each one is produced by one **code** agent, which builds that PR's tasks from the source plan in a worktree of its own and opens the PR.> Only when PR N's pull request exists does PR N+1's first task become claimable. <m> tasks, executed one at a time, in the order the board lists them.

The queue is serial by construction: at most one row is ever `READY`. An agent that finds nothing claimable has nothing to do and stops. This is the normal outcome of most ticks and is not a failure.

Every branch is cut from the previous branch, and every pull request targets the previous branch as its base. The <n> PRs form one stack on top of `<base branch>`.

When a task meets a conflict it cannot resolve without a decision, it writes a **Human review** block, the queue stops, and it stays stopped until the human answers in that block. The next tick after the answer resumes the task.

## Reading order for a claiming agent

Read these before touching anything, in this order. Do not begin work from this file alone — it is an index and a ledger, not a substitute for the source plan.

1. This file, in full — the board, the stack ledger, the brief for your PR, **Human review**, the decisions table, the guardrails.
2. `<source plan>` (sibling) — the approach, its binding decisions, its open questions, and its scope boundaries, which are what you are allowed to touch.
3. <upstream documents the source cites: feature description, spec, spikes — sibling paths>
4. <for SPEC/PLAN tasks: the house shape to copy, e.g. an earlier spec and plan in this directory>
5. `<workspace CLAUDE.md>`, each repository's `CLAUDE.md`, and the `.claude/rules/` files that match the files you touch. The repository's rules win over anything restated here.

## Standing authorization

The human approved this queue on <date>. That approval is the standing authorization for exactly these outward-facing acts, and no others:

- Pushing the branches named in the **Stack ledger**, and only those.
- Opening the pull requests named in **PR briefs**, with the titles given there, against the bases given there<, as drafts>.
- <anything else the human explicitly authorized — or delete this line>

When a skill you invoke pauses to ask a human for input it could take from this queue — a PR body's "why", a final preview — answer it from the brief and the plan, proceed on this authorization, and say so in the plan's Build Log. Anything outward-facing not on this list is a **Human review**.

---

## Claim protocol

The lock is a directory, because `mkdir` is atomic. It is held for seconds — long enough to read the board and rewrite one row — and released before the real work starts. The work itself is done with the row marked `CLAIMED`, which is what keeps the next tick's agent away.

**Agent id**: `"$(hostname -s)-$$-$(date -u +%Y%m%dT%H%M%SZ)"`. Use the same id for the whole task, from claim to completion.

### 1 · Acquire the lock

```bash
QUEUE=<absolute queue path>
LOCK=/tmp/<ticket-slug>-queue.lock
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
2. A `NEEDS-HUMAN` row whose **Human review** block has Status `ANSWERED` — you are **resuming** it; see step 6.
3. A `CLAIMED` row older than <6> hours — you are **reclaiming** it; see step 7.

If none exists, release the lock and exit without writing anything — including without writing to the event log. If one does, rewrite that row's Status to `CLAIMED`, put your agent id in **Claimed by**, and put the current UTC timestamp in **Claimed**. Then re-read the row and confirm it names your agent id; if it names someone else, you lost the race — release and exit.

### 3 · Release the lock, then work

```bash
rm -rf "$LOCK"
```

Release before starting the task. The `CLAIMED` row is the lock for the duration of the work; the directory lock only protects the board edit.

A CODE task re-acquires the lock once, early, to write its worktree path into the **Stack ledger** the moment the worktree exists — so a reclaimer can find it.

### 4 · Record completion

Re-acquire the lock exactly as in step 1. Then, in one edit: set your row's Status to `DONE`, fill **Completed** and **Output**, flip the *next* row from `BLOCKED` to `READY`, update the **Stack ledger** if you created a branch, a worktree or a PR, and append one line to the **Event log**. Release the lock. A task is not done until the board says so — the artifact existing on disk is not the signal any other agent reads.

### 5 · If you hit a conflict

Stop, and hand the decision to the human — but only when proceeding either way would produce work that is **wrong rather than merely debatable**: a contradiction between the source plan and the code that a binding decision does not settle, a scope boundary the task cannot finish inside, a repository state you must not act on unilaterally (a worktree or branch you did not create sitting where yours must go, commits that are not the stack's), or an outward-facing act the **Standing authorization** does not cover. An ordinary open question is not this: record it under **Decisions awaiting the human**, state the assumption you proceeded on, and carry on.

To stop: re-acquire the lock and, in one edit, append a block to **Human review** copied from its template and filled in completely; set your row's Status to `NEEDS-HUMAN` with `HR-<n>` and a one-line reason in **Output**; set this file's **Status** line to `stopped — waiting on HR-<n>`; append an event-log line. Release. Leave every artifact you produced in place — files, worktree, branch, commits, uncommitted changes — and name all of them in the block. Then send one notification if a notification tool is available: `<TICKET> queue stopped: HR-<n> needs your decision (<task>)`.

`NEEDS-HUMAN` stops the queue on purpose: no successor becomes `READY`, and only the human's answer restarts it.

### 6 · Resuming an answered review

A row you claimed through step 2.2 is a resumption, not a fresh start. Read the **Human review** block and its answer before anything else, then continue from what the block's **Left in place** names — never start the task over, and never discard what the first agent built.

Apply the answer as written. If it picks an option, carry that option out; if it is an instruction of its own, follow it. If the answer is ambiguous — you cannot act on it without guessing — do not guess: under the lock, add a **Follow-up** line beneath the answer saying exactly what is unclear, set the block back to `OPEN`, set your row back to `NEEDS-HUMAN`, append an event-log line, and release.

When the task completes, the step-4 edit also sets the block's Status to `APPLIED`, fills its **Applied** line with what you did, and restores this file's **Status** line to `running`.

### 7 · Reclaiming a stalled task

A row `CLAIMED` for more than **<6> hours** with no completion may be reclaimed by any agent, under the lock. Before resetting it, look for partial output — a spec or plan file already on disk, a worktree at the path the **Stack ledger** records, a branch with commits — and continue from it rather than starting over. A worktree the ledger records for **this task** is yours to continue in; that is the one exception to "never reuse a worktree", because it is the same task. Read any `ANSWERED` **Human review** block for the task too. Append an event-log line naming what you found. Do not delete another agent's work.

---

## The board

Status values: `BLOCKED` (its predecessor has not finished) · `READY` (claimable now) · `CLAIMED` (an agent is working) · `DONE` · `NEEDS-HUMAN` (queue stopped; see the `HR-<n>` in Output).

| Task | Artifact | Status | Claimed by | Claimed (UTC) | Completed (UTC) | Output |
| --- | --- | --- | --- | --- | --- | --- |
| **1-SPEC** | `spec-pr-1-<slug>.md` | READY | | | | |
| **1-PLAN** | `plan-pr-1-<slug>.md` | BLOCKED | | | | |
| **1-CODE** | branch `<branch 1>` + worktree + PR | BLOCKED | | | | |
| **2-SPEC** | `spec-pr-2-<slug>.md` | BLOCKED | | | | |

Rows are unblocked strictly downward: <finishing `N-SPEC` readies `N-PLAN`, finishing `N-PLAN` readies `N-CODE`, and finishing `N-CODE` readies `(N+1)-SPEC` | finishing `N-CODE` readies `(N+1)-CODE`>. `<n>-CODE` readies nothing — when it is `DONE`, set this file's **Status** line to `complete`, and say in the event log that the schedule `<name or id>` can be removed.

---

## What each kind of task does

### A SPEC task *(CODE-only queues: drop)*

Write `spec-pr-N-<slug>.md` into this directory using the `specs` skill (`software-engineering-skills:specs`), for the scope of **that PR only** as its brief defines it. Copy the shape of `<house spec>`.

Every file path, line number and symbol name you assert must be read at the commit you are working from, not carried over from the source plan — the plan was verified at `<sha>` and the tree will have moved. State the commit you verified against in the metadata. Read it at that ref — `git show <ref>:<path>`, `git grep <pattern> <ref>`, or a throwaway `git worktree add --detach` that you remove before you finish. Never read from another task's worktree: it can hold uncommitted work that is on no branch.

The skill wants a human in the loop and there is not one. Resolve ambiguity in this order: the source plan's binding decisions settle most of it; the repositories' `.claude/rules/` settle convention questions; anything left goes in the Ambiguity Log with your recommendation **and** a row in **Decisions awaiting the human**, after which you proceed on your stated assumption. Only a conflict that passes step 5's test becomes a **Human review**.

Set the spec's own **Status** line to `approved` — there is no separate approval step in this queue, and the plan task needs a spec it is allowed to build on. The board is the approval record.

### A PLAN task *(CODE-only queues: drop)*

Write `plan-pr-N-<slug>.md` beside the spec using the `plan` skill (`software-engineering-skills:plan`), reading the spec as its input. Copy the shape of `<house plan>`.

The **PR Stack** table has exactly one row, and its Branch and Base come from the **Stack ledger** — not from your own judgement. The plan's metadata carries `**Repository**`, `**Base branch**`, `**Branch**` and `**Worktree**` lines — the worktree is `<root>/<plan-slug>/<repo>/<branch>`, which the CODE task will create — so the code agent needs no other source.

Every task in the plan carries 1–3 verifiable acceptance criteria, the exact files it changes, and its tests. Read code at a ref, as a SPEC task does. If the plan cannot be written because the spec is internally inconsistent, fix nothing silently: record it in **Decisions awaiting the human**, write the plan on the reading you judge correct, and say in the Approach section which reading you took. Set the plan's **Status** to `approved`.

### A CODE task

Build the branch in a worktree of your own and open the pull request. In order:

1. **Create your worktree.** Never build in one you did not create — see **Worktrees**.
   ```bash
   git -C <reference checkout> fetch origin
   git -C <reference checkout> worktree add -b <this PR's branch> <root>/<plan-slug>/<repo>/<this PR's branch> <cut-from>
   ```
   `<cut-from>` is `origin/<base branch>` for PR 1 and `origin/<previous PR's branch>` for every later PR — the remote tip, which carries any fix pushed to it since its task finished. If the path or the branch already exists and the **Stack ledger** does not record it as this task's, stop: that is a **Human review**, not something to delete or adopt. Then, under the lock, write the worktree path into the ledger.
2. **Bootstrap it**: `<bootstrap command>` from the worktree root (<fallback, e.g. `pnpm install --force` on `Cannot find native binding`>). Prove the baseline suite green before writing anything.
3. **Confirm the base.** For every PR after the first, `git merge-base --is-ancestor origin/<previous PR's branch> HEAD` must succeed. A branch cut from the wrong base is the failure mode this queue exists to prevent — check it before writing code, not after.
4. **Build** <`plan-pr-N-<slug>.md` | PR N's tasks in `<source plan>`, and only those> with the `build` skill (`software-engineering-skills:build`) — one commit per plan task, tests first. The worktree from step 1 is the workspace convention: `/build` follows the harness first, so it must use it and not create another. <Commit attribution rule from the guardrails, restated.>
5. **Open the PR** through the **Open-PR path** in the metadata, never bare `gh pr create`. The PR's base is the previous PR's branch, not `<base branch>`. Verify it after the fact with `gh pr view <n> --json baseRefName` and correct it with `gh pr edit <n> --base <branch>` if the skill defaulted. Title is the string from the brief, exactly.
6. **Write the gate into the PR body** if the brief names one — a `> **Do not merge until …**` line at the top, naming the blocking ticket or PR. See **External merge gates**.
7. **Record** on the board: Status `DONE`, the PR URL in Output, the branch, worktree and PR in the **Stack ledger**, and an event-log line. Then flip the next row to `READY`. Leave your worktree in place — it is this PR's home until it merges.

Do not merge anything. Do not approve anything. <Do not force-push — a repository ruleset blocks it on every branch, so a branch whose history needs rewriting has to be recreated, and recreating a branch mid-stack invalidates everything above it.>

**Bringing `<base branch>` into the stack.** <Merge strategy: because force-push is blocked, the stack is updated by **merge**, never rebase — merge `origin/<base branch>` into branch 1, then branch 1 into branch 2, and so on up the stack. | Rebase strategy: `git rebase --onto` each branch onto its new parent, then `git push --force-with-lease`.> Every update to an earlier branch happens in a **throwaway detached worktree** at `origin/<that branch>`, pushed with `git push origin HEAD:<that branch>` and removed afterwards — never inside that branch's own worktree, which belongs to its task. When an ancestor PR squash-merges into `<base branch>`, retarget its child to `<base branch>` with `gh pr edit`, then merge `origin/<base branch>` into the child and resolve conflicts in favour of the child's content — the squashed ancestor and the child's copy of those commits are the same change twice.

---

## Worktrees

**One worktree per CODE task, created by that task, never reused.** It lives at `<root>/<plan-slug>/<repo>/<branch>`, is cut from the remote tip of its base, and belongs to that PR for the rest of the PR's life. No other task builds in it, reads its working tree, or checks anything out inside it.

- **Why.** A worktree shared across tasks accumulates state nobody owns — uncommitted edits from a human or an earlier agent that no branch carries, which the next task either builds on without knowing or has to stop for. A fresh worktree per task makes that impossible, and makes "who left this here" answerable from the path alone.
- **SPEC and PLAN tasks** read code at a ref and never keep a checkout: `git show`, `git grep`, or a `git worktree add --detach` they remove before they finish.
- **Updates to an earlier branch** (merging the base up the stack, a fix a later task finds) happen in a throwaway detached worktree and are pushed to the remote branch. The branch's own worktree is then behind its remote; whoever works there next pulls first.
- **A path that already exists** and is not recorded in the **Stack ledger** as this task's is a **Human review**. Never delete it, never adopt it.
- **Reclaiming a stalled CODE task** continues in the worktree the ledger records for that task — the same task, so not a reuse.
- **Cleanup is not the queue's job.** A CODE worktree is removed with `git worktree remove` once its PR has merged or closed and nothing is using it — by the human, or by `/monitor-pr`. Throwaway worktrees are removed by the task that made them.
- **The cost is accepted**: each worktree pays its own `<bootstrap command>`. That is the price of isolation.

---

## Stack ledger

Branch N is cut from branch N−1. PR N targets branch N−1 until that PR merges, then is retargeted to `<base branch>`.

| PR | Repo | Branch | Cut from | PR base | Worktree | PR | State |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `<repo>` | `<branch 1>` | `origin/<base branch>` | `<base branch>` | | | not started |
| 2 | `<repo>` | `<branch 2>` | branch 1 | `<branch 1>` | | | not started |

---

## PR briefs

Each brief is the scope contract for its tasks. It is a pointer into the source plan, not a replacement for it — the plan's scope boundaries govern, and anything they list as out of scope stays out even if you find it broken while you are in there.

### PR <n> — `<Conventional Commits title, exactly as it will be used>`

**Repo**: `<repo>` · **Branch**: `<branch>` · **Cut from**: <`origin/<base branch>` | branch n−1> · **PR base**: `<base>`

**Content**: <what this PR changes, citing the source plan's section by name — the files, symbols and behaviours it moves or adds, with the commit the source verified them at>

**Out of scope**: <what the source reserves for a later PR or another ticket>

**Must be proven**: <the evidence the PR body carries, if the source names one — a byte-equality run, a measured count, a probe that goes red — or "the plan's verifications">

**Merge gate**: <none | the ticket or PR that must merge first — see External merge gates>

---

## External merge gates

These block **merging**, not building. An agent never waits on one; it records it and keeps going. Only a human clears a gate.

| Gate | Blocks | State as of <date> | Cleared |
| --- | --- | --- | --- |
| <ticket or PR — what it does> | PR <n> merge | <observed state, who observed it, when> | ☐ |

---

## Human review

**Blocking conflicts only.** A task that cannot proceed either way without a decision writes one block here, sets its board row to `NEEDS-HUMAN`, and stops — and the queue stops with it (claim protocol step 5). Everything that can proceed on a stated assumption goes in **Decisions awaiting the human** instead.

**To answer a block**: write your decision under **Human answer** — an option letter, a letter with conditions, or an instruction of your own — fill **Answered by**, and change the block's **Status** from `OPEN` to `ANSWERED`. That is all: you do not need to touch the board. The next tick resumes the blocked task from where it stopped, applies your answer, and sets the block to `APPLIED`. To clear a block without a decision — you fixed it by hand, or it no longer applies — write that as the answer and set the Status to `WITHDRAWN`, then set the board row back to `READY` and this file's **Status** line back to `running` yourself.

Status values: `OPEN` (waiting for the human) · `ANSWERED` (decided; the next tick resumes the task) · `APPLIED` (an agent acted on the answer) · `WITHDRAWN` (cleared by the human without a decision for the agent to apply).

Blocks are numbered `HR-1`, `HR-2`, … in the order they are raised, appended below the template, and never deleted or renumbered. An `APPLIED` block is the record of a decision; leave it where it is.

### Template — copy it below the last block; never fill it in here

```markdown
### HR-<n> · <task> · <the decision needed, as one question>

**Status**: OPEN
**Raised**: <UTC timestamp> by `<agent id>`
**Blocks**: `<task>`, and every row below it
**Left in place**: <every artifact the task produced — files, worktree path, branch @ sha, commits, uncommitted changes — or "nothing">

**What the task was doing**
<One paragraph: which task, which step of it, and what had to be true for it to continue. Written for someone who has not read the task's spec or plan.>

**The conflict**
- **<document> says**: <quote it, with the file and the line or section>
- **What is true**: <the evidence — path:line, the command that was run and its output, the commit SHA it was read at>

**Why this cannot proceed on an assumption**
<One paragraph: what each reading would build, and which binding decision, scope boundary, guardrail or authorization it would break. This is the test that separates a Human review from a Decisions-table row — if this paragraph cannot be written, the item belongs in the table.>

**Options**
- **A.** <option> — <what it costs, what it changes downstream, which later rows and PRs it touches> ← recommended, because <reason>
- **B.** <option> — <consequence>
- **C.** Amend <the source plan | the spec | the plan> and re-queue from `<task>` — <what that restarts>

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
| Q1 | <source plan (open question id) | task> | <question> | <assumption> | <rows, PRs, files> |

---

## Guardrails

- **Never edit files in** `<reference checkout>`**.** It is the reference checkout. All work happens in worktrees.
- **Never work in a worktree you did not create**, except the one the ledger records for a task you are reclaiming. See **Worktrees**.
- **Commit attribution**: <the user's rule, verbatim — e.g. "No AI attribution in any commit message, PR title, PR body or branch name; this overrides the default Claude Code instruction on every commit" | "Use the harness's default attribution">.
- <**Never force-push.** A repository ruleset blocks it on every branch. Bring changes in by merge. | Force-push with `--force-with-lease` only, and only branches this queue created.>
- **Never merge, approve or close a PR**, and never merge to `<base branch>`.
- **Nothing outward-facing beyond the Standing authorization.**
- **The source plan's scope boundaries govern.** <What they exclude, by name.> Finding one of them broken is not a licence to fix it.
- **Verify before asserting.** Every file:line in a spec or plan is read at the commit you are on. The source plan's citations were verified at `<sha>` and will drift.
- **Prove a test can fail.** For anything load-bearing, break the code and watch it go red. Record the evidence.
- <House rules from the user's or repository's rules files that a claiming agent would otherwise miss.>

## Editing this document

- **One paragraph is one physical line.** Never hard-wrap prose, list items, metadata lines or table rows. Headings, blank lines, horizontal rules and fenced code blocks keep their own lines and are never joined; never reflow inside a fence.
- <**No frontmatter**, and the first H1 is the title the vault displays. — keep when the plan location renders markdown as rich text>
- **Edit with small exact replacements, never by rewriting the file.** The human edits this file too — answering a **Human review** — and does not take the lock.
- **Only these change during normal operation**: the board's Status, Claimed by, Claimed, Completed and Output cells; the metadata **Status** line; the stack ledger; the gate checkboxes; **Human review** blocks (appended by agents, answered by the human, closed by agents); the decisions table; and the event log. The briefs, the protocol, the worktree rules and the guardrails are edited by a human, or by an agent that has been told to.
- **The event log is append-only.** Never rewrite or delete a line.
- **Board edits happen under the lock.** Event-log lines are written in the same locked edit as the board change they describe.

---

## Event log

One line per state change, newest at the bottom: `- <UTC timestamp> · <agent id | human> · <what happened>`.

- <UTC timestamp> · human · Queue created from `<source plan>` by `/implementation-loop`. <m> tasks across <n> stacked PRs. `<first task>` set `READY`; everything else `BLOCKED`. Scheduled as <scheduler> `<name or id>`, every <n> minutes.
````
