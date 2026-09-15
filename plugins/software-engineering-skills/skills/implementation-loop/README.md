# Implementation Loop Skill

Turns **one approved plan that orders its PRs** into a queue that builds itself: a markdown file that scheduled agents claim tasks from, one at a time, until every PR in the stack is open.

```
/implementation-loop [--plan-file <path>] [--ticket <ID>] [--cadence <minutes>] [--stages spec,plan,code|code] [--no-schedule] [--headless]
```

## Purpose

`/build` executes a plan in one live session. That session has to stay open, and its context is the build's memory. This skill is for when the plan should be built by **scheduled agents instead** — overnight, or across days, each agent short-lived and knowing nothing but what the queue file tells it.

It writes the queue, gets the human's approval, schedules the recurring tick, and stops. It never claims a task itself.

## How the queue runs

```
tick (every 30 min) → read the queue → claim the one READY row → do it → mark DONE, ready the next
                                    ↘ nothing claimable → exit silently (most ticks)
```

- **Serial by construction.** At most one row is ever `READY`, so most ticks are no-ops, and that is not a failure.
- **Per PR, three rows**: a SPEC agent (`/specs`) narrows the source to one PR and re-verifies it against the code as it is now; a PLAN agent (`/plan`) writes buildable tasks; a CODE agent (`/build`) builds the branch and opens the PR. When the source is already an approved `/plan`, the queue is **CODE-only**.
- **A directory lock** (`mkdir` is atomic) protects each board edit for seconds; the `CLAIMED` row protects the work. A row stuck `CLAIMED` past the reclaim window (6 h) is picked up from its partial output, never restarted.
- **The board is the only signal.** An artifact on disk is not done until its row says `DONE`.

## Every CODE task gets its own worktree

Each CODE task creates `<root>/<plan-slug>/<repo>/<branch>` from the remote tip of its base and keeps it as that PR's home. **Worktrees are never reused**: no task builds in, reads from, or checks out inside one it did not create.

A shared stack worktree accumulates state nobody owns — a human's edits, an earlier agent's half-applied fix — and the next agent either ships it in its own PR without knowing or stops the queue to ask whose it is. A worktree per task removes that, at the price of one install per PR. Specs and plans read code at a ref and keep no checkout; merges up the stack happen in throwaway detached worktrees.

## Asking the human: two channels

| | **Decisions awaiting the human** | **Human review** |
|---|---|---|
| When | The question can proceed on a stated assumption | Proceeding *either way* makes the work wrong — a plan/code contradiction no decision settles, a scope boundary, a repo state the agent must not touch, an unauthorized outward act |
| Queue | Keeps moving | **Stops** — the row goes `NEEDS-HUMAN` and the file's Status reads `stopped — waiting on HR-<n>` |
| Shape | A table row: question, assumption, where a reversal lands | A block: what the task was doing, the conflict with evidence, why it cannot proceed on an assumption, options with one recommended, what was left in place, and **an empty space for the human's answer** |

**To answer a Human review**, the human writes the decision under **Human answer** and sets the block's Status to `ANSWERED`. Nothing else. The next tick claims the stopped task, reads the answer first, continues from what was left in place, and marks the block `APPLIED`. An answer it cannot act on without guessing goes back to `OPEN` with a follow-up question.

## Scheduling

The tick prompt is one line — *follow the instructions in this file* — and is written into the queue so the schedule can be rebuilt.

| Scheduler | Use |
|---|---|
| Desktop scheduled task (`~/.claude/scheduled-tasks/<name>/SKILL.md`) | Default for a local queue |
| `CronCreate` / `/loop` in a session | Short queues only — session-bound, expires after 7 days |
| Cloud routine (`/schedule`) | Never for a local queue — it cannot see the file, the lock, or the checkouts |

The tick runs unattended, so it needs a permission mode that lets it edit, run git, push and call `gh`. A tick stuck on a prompt holds its row until the reclaim window passes.

## What it produces

- `queue-<slug>.md` beside the source plan, from [`references/queue-template.md`](references/queue-template.md): metadata, reading order, standing authorization, claim protocol, board, task instructions, worktree rules, stack ledger, PR briefs, merge gates, Human review, decisions table, guardrails, editing rules, event log.
- A recurring schedule, created only after the human approves.
- A short report: the stack, the first claimable row, the scheduler, and what the human does next.

## Boundaries

| It does | It never does |
|---|---|
| Writes the queue and schedules the tick | Claims a task, or runs one to "get it started" |
| Takes the PR ordering from the source plan | Re-decides the order, the branches or the scope |
| Lists the exact pushes and PRs the human authorized | Licenses any outward act beyond that list |
| Writes the queue as a draft when headless | Schedules unattended agents without an explicit yes |
| Asks when a queue file already exists | Overwrites live queue state |

Full definition, including preflight, the quality gate and the report format: [`SKILL.md`](SKILL.md).
