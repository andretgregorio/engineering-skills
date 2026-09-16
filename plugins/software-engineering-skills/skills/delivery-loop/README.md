# Delivery Loop Skill

Turns **a design document or story map whose delivery is already sliced** into a queue that specifies, plans and builds itself: a markdown file that scheduled agents claim tasks from, one at a time, until every slice's PRs are open.

```
/delivery-loop [--design-doc <path>] [--story-map <path>] [--ticket <ID>] [--slices <ids>] [--cadence <minutes>] [--stages spec,plan,code|plan,code] [--max-open-prs <n>] [--no-schedule] [--headless]
```

## Purpose

`/implementation-loop` starts from an approved plan and schedules its PRs. This skill starts **one phase earlier**: before any spec exists, writing the specs and the plans too.

Given a sliced delivery, it writes one queue in which every unit of work gets its spec written (`software-engineering-skills:specs`), then its plan (`software-engineering-skills:plan`), then **one row per pull request that plan proposes** — one agent, one session, building every task of that PR as its own commit through `software-engineering-skills:build` and opening the PR at the end of it.

It writes the queue, gets the human's approval, schedules the recurring tick, and stops. It never claims a task itself.

| | `/delivery-loop` | `/implementation-loop` |
|---|---|---|
| Input | Design doc / story map with release slices | An approved plan that orders its PRs |
| Writes specs and plans | Yes — one per unit | Optionally, per PR |
| Scheduled unit of work | **One PR** = every task of it, one commit each, then opened | One PR = one `/build` run |
| Board | **Grows** as plans are written | Known in full up front |
| Worktree | One per **PR branch** | One per **PR branch** |

Not sure which one you want? `software-engineering-skills:loop` reads the document and routes.

## Three levels, and only the middle one is a document

| Level | From | What it is |
|---|---|---|
| **Slice** `S1` | The source's release slicing | A releasable increment with an outcome and a guardrail metric |
| **Unit** `S1.U2` | One rib / one sliced item | One spec, one plan — the smallest thing `/specs` accepts |
| **PR** `S1.U2 · PR1` | The unit's plan | One pull request — every task it holds, one commit each, opened at the end. Written by the plan, not guessed by the queue |

Deriving units from slices is the one structural decision the source does not make for you, and it is confirmed with the human before the queue is written.

## The board grows itself

```
tick (every 30 min) → read the queue → claim the one READY row → do it → mark DONE, ready the next
                                    ↘ nothing claimable → exit silently (most ticks)
```

A queue cannot list its build rows in advance: the pull requests do not exist until the plan is written, and a guessed row would disagree with the plan the builder actually reads. So a **PLAN row appends its own successors** — one row per plan PR, each listing that PR's plan task IDs, plus a stack-ledger line each — in the same locked edit that marks itself `DONE`.

One row per plan PR and nothing else: no splitting a PR across rows, no merging two PRs, no dropping a task from a PR's list. A unit that expands past 15 plan tasks or 4 PRs — or a single PR past 8 tasks — is expanded anyway and logged as a slicing problem, not a build problem.

## A pull request is one sitting

**The unit of scheduling is the PR, because that is the unit of review.** One agent creates the branch's worktree, builds every task in its list — one commit each, verified as it goes — runs the branch checks and the conformance judge, pushes, and opens the PR. It does not stop at a green branch: a row that has not opened its PR is not done.

Splitting those tasks across rows put a cold agent and a worktree handover between commits that only make sense together, and left a branch half-built between ticks — for no gain, since the queue is serial anyway.

## One worktree per PR branch

The CODE row creates it and leaves it as that PR's home; no worktree is ever handed from one row to another, so there is no mid-branch state for anyone else to trip over. A path or branch already sitting where a row's must go, and not recorded in the ledger as that row's, is a Human review — never a `git checkout`, `stash`, `reset` or `rm -rf`.

Specs and plans keep no checkout; they read at a ref. Monitors get their own throwaway worktree.

## The stack shortens when the human merges

The queue never merges, so each branch is cut from something the queue produced — until the human merges, at which point the chain resets. Resolved per PR, at the moment its worktree is created:

- Later PR in a unit → `origin/<previous branch>`.
- A unit's first PR → `origin/<base branch>` if every earlier unit's PRs are merged, else `origin/<last branch in the ledger>`. The resolved answer and its evidence go in the ledger.

**The open-PR cap (default 4) is part of the authorization.** A CODE row whose PR would exceed it does not start — it raises a Human review: merge the bottom of the stack, raise the cap, or pause. A delivery loop that outruns its reviewer is not delivering anything.

## Releases are the human's

The queue's **Release plan** holds, per slice: outcome and KPI, units, flag and default, guardrail metric with threshold, and the release gate. Agents record against it and never clear it. When a slice's last PR is opened, its state becomes `delivered — awaiting the human` and one notification goes out; the next slice keeps building meanwhile.

## Asking the human: two channels

| | **Decisions awaiting the human** | **Human review** |
|---|---|---|
| When | The question can proceed on a stated assumption | Proceeding *either way* makes the work wrong — a source/code contradiction, a unit that will not fit its slice, a worktree or branch the queue did not create, an unauthorized outward act (including the PR cap) |
| Queue | Keeps moving | **Stops** — the row goes `NEEDS-HUMAN` and Status reads `stopped — waiting on HR-<n>` |
| Shape | A table row: question, assumption, where a reversal lands | A block: what the task was doing, the conflict with evidence, why no assumption works, options with one recommended, what was left in place, and **an empty space for the answer** |

To answer, the human writes the decision under **Human answer** and flips the block to `ANSWERED`. Nothing else. The next tick claims the stopped row, reads the answer first, continues from what was left in place, and marks the block `APPLIED`.

## Scheduling

The tick prompt is one line — *follow the instructions in this file* — and is written into the queue so the schedule can be rebuilt.

| Scheduler | Use |
|---|---|
| Desktop scheduled task (`~/.claude/scheduled-tasks/<name>/SKILL.md`) | Default — a delivery queue outlives any session |
| `CronCreate` / the built-in `/loop` in a session | Rarely — session-bound, expires after 7 days |
| Cloud routine (`/schedule`) | Never for a local queue — it cannot see the file, the lock, or the checkouts |

The tick runs unattended, so it needs a permission mode that lets it edit, run git, push and call `gh`. A tick stuck on a prompt holds its row until the reclaim window (6 h) passes.

## What it produces

- `delivery-queue-<slug>.md` beside the source, from [`references/queue-template.md`](references/queue-template.md): metadata, reading order, standing authorization, claim protocol including the expansion step, the board, per-kind row instructions, worktree rules, stack ledger, release plan, unit briefs, merge gates, Human review, decisions table, guardrails, editing rules, event log.
- A recurring schedule, created only after the human approves.
- A short report: the slices and their units, the first claimable row, how many rows to expect per unit, the scheduler, and what the human does next.

## Boundaries

| It does | It never does |
|---|---|
| Writes the queue and schedules the tick | Claim a row, or run one to "get it started" |
| Takes the slicing and its order from the source | Re-slice, re-order, or re-scope the delivery |
| Confirms the slice → unit split with the human | Derive units silently and start specifying |
| Lists the exact pushes, PRs and the PR cap the human authorized | License any outward act beyond that list |
| Records a slice as delivered | Merge, release, or enable a flag |
| Writes the queue as a draft when headless | Schedule unattended agents without an explicit yes |
| Asks when a queue file already exists | Overwrite live queue state |

Full definition, including preflight, the expansion contract and the quality gate: [`SKILL.md`](SKILL.md).
