---
name: delivery-loop
description: Turns a design document or story map whose delivery is already sliced into a self-running delivery queue — one markdown queue file that scheduled agents claim tasks from, one at a time, so every slice gets its spec written, then its plan, then every task that plan contains built as its own commit, and its PRs opened, unattended and in order. The queue grows itself: each PLAN task expands the board into one row per task it planned, so the work is scheduled at the granularity the plan actually chose rather than one the queue guessed in advance. A conflict that needs a decision stops the queue with a Human review block that explains the context and leaves a space for the human's answer; the next tick after the answer resumes the task. It writes the queue, gets the human's approval, schedules the recurring tick, and stops — it never claims a task itself. Use when a sliced design document, story map or release plan is approved and should be taken all the way to open PRs by scheduled agents rather than in one live session, or when the user says "create a delivery loop", "queue this design doc", "deliver this story map", "build these slices overnight", or invokes /delivery-loop.
role: orchestrator
user-invocable: true
argument-hint: "[--design-doc <path>] [--story-map <path>] [--ticket <ID>] [--slices <ids>] [--cadence <minutes>] [--stages spec,plan,task|plan,task] [--max-open-prs <n>] [--no-schedule] [--headless]"
model: opus
---

# Delivery Loop

You are turning **one sliced delivery** — a design document, a story map, a release plan — into a queue that specifies, plans and builds itself. The output is a single markdown file (the queue) and a recurring schedule that starts a fresh agent every few minutes. Each agent reads the queue, claims the one task that is ready, does it, records it, and readies the next. You write the queue and start the schedule; the agents do the work.

The queue is the contract between agents that never meet. Everything a claiming agent needs — what to read, how to claim, where to build, what it may and may not do, and how to stop — is in the file, because the agent has nothing else. A queue that relies on this conversation is broken.

Its readers are the claiming agent with no memory, the human who answers its questions without opening anything else, and whoever reads the ledger after the release has shipped.

The template is [`references/queue-template.md`](references/queue-template.md). Read it before step 6; this file explains the decisions behind it.

**This is the upstream sibling of `software-engineering-skills:implementation-loop`.** That one starts from an approved plan and schedules its PRs. This one starts *before a spec exists*: it writes the specs and the plans too, and schedules the individual tasks those plans produce. If the input is already an approved plan, that is the other skill — say so and stop.

## What this skill does not produce

- **Specs, plans, code or PRs.** The scheduled agents write those, through `software-engineering-skills:specs`, `software-engineering-skills:plan` and `software-engineering-skills:build`. You do not claim the first task to "get it started".
- **The slicing.** The slices, their order and what each one delivers come from the source document. A source with no usable slicing is a `software-engineering-skills:user-story-mapping-workshop` conversation — stop and offer it.
- **Merges, releases or flag enablement.** The queue ends with every PR of every slice open. Merging, releasing and turning the flag on are human acts; the release plan records what each one is waiting for.
- **Authority the human did not give.** The queue's standing authorization lists exactly which branches may be pushed, which PRs opened, and **how many PRs may be open at once**. Nothing else outward-facing is licensed by it.

## Rules

- **Serial by construction.** At most one row is ever `READY`. Finishing a row readies the next; nothing readies two.
- **The board grows.** A PLAN task appends the rows for the tasks it planned, in the same locked edit that marks itself `DONE`. One row per plan task, one row per plan PR, nothing invented. See *The board grows itself*.
- **One worktree per PR branch, owned by that branch.** Its task rows run in it, one after another; nothing else does. A row that finds the worktree dirty, or its HEAD somewhere the ledger does not record, stops. See *Worktrees*.
- **Two channels to the human, never confused.** A conflict that makes the work wrong either way is a **Human review**: the queue stops. A question that can proceed on a stated assumption is a **Decisions awaiting the human** row: the queue keeps moving.
- **The board is the only signal.** A task is done when its row says `DONE`, not when its artifact exists, not when its commit exists. Every board edit happens under the lock, with its event-log line in the same edit.
- **Read at the ref the branch will be cut from**, not at a working tree. A slice built on top of unmerged slices is specified against their tips, not against the base branch.
- **The human approves before anything is scheduled.** A running queue pushes branches and opens PRs unattended; starting it is outward-facing. No schedule without an explicit yes.
- **Never overwrite a queue.** An existing queue file is live state other agents may be mid-edit on. Ask; headless, halt.

## The unit of work

The source slices delivery into **releases**. `software-engineering-skills:specs` specifies exactly **one functionality** — one rib of a story map, one item of a sliced design document. Those two granularities are not the same, and conflating them is how a queue ends up with a spec that covers half a release.

So the queue has three levels, and only the middle one is a document boundary:

| Level | From | What it is |
|---|---|---|
| **Slice** `S<n>` | The source's release slicing | A releasable increment with an outcome and a guardrail metric. Delivered, not merged, by the queue |
| **Unit** `S<n>.U<m>` | One rib / one sliced item | One spec, one plan. The smallest thing `software-engineering-skills:specs` accepts |
| **Task** | The unit's plan | One plan task, one commit. Written by the plan, not by you |

Units are ordered within a slice by the source's priority — walking-skeleton ribs first, then `prioritization.md`'s order — and slices in release order. That ordering is the board.

## Task stages

Per unit, by default: **SPEC → PLAN → (the plan's tasks, one row each) → PR (one row each)**.

- **SPEC** writes `spec-S<n>-U<m>-<slug>.md` with `software-engineering-skills:specs`, scoped to that unit alone, verified against the code at the ref its branches will be cut from.
- **PLAN** writes `plan-S<n>-U<m>-<slug>.md` with `software-engineering-skills:plan`, then **expands the board**.
- **A task row** builds exactly one plan task — one commit, through `software-engineering-skills:build` — in its PR's worktree. No branches created beyond its own, nothing pushed, no PR opened.
- **A PR row** closes a branch: the branch-level checks, the conformance judge, the push, the pull request, the monitor.

`--stages plan,task` drops the SPEC rows, and is correct only when the source already carries an approved spec per unit. Decide this in step 3 and state it in the queue. There is no task-only mode: without a plan there are no task rows to schedule, which is exactly what `software-engineering-skills:implementation-loop` is for.

## The board grows itself

A queue cannot list its task rows in advance, because the tasks do not exist until the plan is written. Guessing them is worse than useless — the board would then disagree with the plan, and the plan is what the builder reads.

So the PLAN row's completion edit is also an **expansion**, under the same lock, in one edit:

1. Read the plan's `## PR Stack` table and each PR's task checklist.
2. Append one board row per plan task, in plan order, `Kind` = `TASK`, keeping the plan's own task IDs — `S1.U2 · E1`, `S1.U2 · P2` — so the board and the plan never need translating.
3. Append one row per plan PR, `Kind` = `PR`, immediately after the last task row assigned to it.
4. Append one **Stack ledger** line per plan PR: repo, branch, PR base, and `cut from: resolved at first task`.
5. Mark the PLAN row `DONE` and flip the first appended row to `READY`.
6. Log one event line naming the counts: *expanded S1.U2 into 6 task rows across 2 PRs*.

Three rules keep the expansion honest:

- **One row per plan task, and nothing else.** No merging two small tasks into a row, no splitting a big one. If the plan is wrong, that is a `software-engineering-skills:plan` conversation, not a board edit.
- **Branch names come from the plan's stack table**, checked against the remote for collisions at expansion time. A collision is a Human review, not a rename.
- **The expansion has a ceiling.** More than `<max tasks per unit>` (default 15) or more than four PRs means the unit was too big to be one spec. Expand anyway, and record a row in *Decisions awaiting the human* saying so — the work is not wrong, the slicing was coarse, and the human decides whether that matters.

**Units are lazy too.** A unit's SPEC and PLAN rows are appended by the previous unit's last PR row, for the same reason: what the next unit must be specified against depends on what the previous one actually landed. Only the first unit's rows exist when the queue is written, and the queue says so out loud, so a human reading a two-row board does not think work is missing.

## The stack, and how it shortens

The queue never merges, so every branch is cut from something the queue itself produced — until the human merges, at which point the chain can reset. That decision is made **per PR, at the moment its first task row creates the worktree**, not written in advance:

- Every PR after the first in a unit: cut from `origin/<previous PR's branch>`.
- A unit's first PR: cut from `origin/<base branch>` **if** every earlier unit's PRs are merged (`gh pr view --json state`, then `git merge-base --is-ancestor`); otherwise from `origin/<last branch of the most recent unit>`.
- The resolved answer, and the evidence for it, goes in the **Stack ledger**. A later reader must be able to see why a branch sits where it does.

This is what makes a long unattended delivery survivable: a human who merges as they go keeps the stack one or two deep; a human who does not gets a correct, deep stack instead of a queue that quietly built each slice against a base that does not have the previous slice in it.

**The open-PR cap is part of the authorization.** The queue may hold at most `--max-open-prs` (default 4) unmerged PRs at once. The first task row of a PR that would exceed it does not start: it raises a Human review — merge the stack below, raise the cap, or pause — because opening a fifth PR is an outward-facing act the standing authorization does not cover. This is deliberate. A stack deeper than four is a restack cost nobody agreed to pay, and a delivery loop that outruns its reviewer is not delivering anything.

## Worktrees

**One worktree per PR branch**, at `<root>/<delivery-slug>/<repo>/<branch>`, created by that PR's first task row with `git worktree add -b <branch> <path> <cut-from>` and kept as that PR's home until the PR merges or closes. The path follows the harness first — a worktree convention in the user's or project's `CLAUDE.md` or rules wins — and `software-engineering-skills:build`'s default layout otherwise.

This is where the delivery loop differs from `software-engineering-skills:implementation-loop`, which gives every code task its own worktree and never reuses one. Here a branch is built by several task rows in succession, so they must share it. The hazard that rule was protecting against — a worktree holding state nobody owns — is handled instead by **ownership plus a precondition**:

- The ledger records, per branch, its worktree path and the SHA its last task row committed.
- Every task row, before it writes anything: the worktree is the one the ledger names for **its** branch; `git status --porcelain` is empty; `HEAD` is the SHA the ledger records (or the cut-from, for the first task). Anything else — uncommitted edits, an unexpected commit, a detached HEAD, a path that exists but is not in the ledger — is a **Human review**. Never clean it up, never adopt it, never `git checkout` past it.
- **SPEC and PLAN rows keep no checkout.** They read with `git show` / `git grep` at the ref, or a throwaway `git worktree add --detach` removed before they finish.
- **Updating an earlier branch** — merging the base up the stack — happens in a throwaway detached worktree, pushed with `git push origin HEAD:<branch>`, never inside that branch's own worktree.
- **The queue never removes a PR worktree.** It is the PR's home until the PR merges or closes; cleanup is the human's, or `software-engineering-skills:monitor-pr`'s.
- **The cost is real and accepted**: one bootstrap per PR branch, not per task. Say so in the queue.

## The release plan

The source slices delivery for a reason, and the queue has to carry that reason forward or the slicing is decoration. The queue's **Release plan** section holds, per slice: the outcome and its KPI, the units it contains, the feature flag and its default, the guardrail metric with its threshold, and a **release gate** — what a human must do to actually release it.

Agents record against it; they never clear it. When a slice's last PR row finishes, the claiming agent sets that slice to `delivered — awaiting the human` in the release plan, sends one notification, and readies the next slice's first row. Delivery continues while releases queue up behind a human, which is the intended shape: building is unattended, releasing is not.

## Asking the human

Identical in structure to `software-engineering-skills:implementation-loop`, and for the same reason: an unattended queue meets questions, and each has to land in the channel that matches its cost.

**Decisions awaiting the human** — the question can proceed. State the assumption and where a reversal would land, then carry on. Most questions belong here.

**Human review** — proceeding *either way* produces work that is wrong rather than merely debatable: the source contradicts the code and no binding decision settles it; the unit cannot be specified inside its slice boundary; a worktree, branch or commit the queue did not create sits where this task's must go; the plan's branch name is taken; the next act is outward-facing and not covered by the standing authorization (including the open-PR cap).

The block carries: status (`OPEN` → `ANSWERED` → `APPLIED` | `WITHDRAWN`), who raised it and what it blocks, **everything left in place**, what the task was doing, the conflict quoted against the evidence, why it cannot proceed on an assumption, options with one recommended, and a marked empty space for the answer.

**The human's whole job is to write the answer and flip one word.** On the next tick, an agent that finds no `READY` row claims the `NEEDS-HUMAN` row whose block reads `ANSWERED`, reads the answer before anything else, continues from what was left in place, and sets the block to `APPLIED`. An answer it cannot act on without guessing goes back to `OPEN` with a follow-up saying exactly what is unclear.

Raising a block sets the queue's **Status** to `stopped — waiting on HR-<n>` and sends one notification when a notification tool is available.

## Scheduling the tick

The tick prompt is one line and points at the queue: `Follow the instructions in <queue path>. Read the whole file before acting. If no task is claimable, exit without writing anything.` Write it into the queue's metadata so the schedule can be rebuilt from the file.

The lock is a directory in `/tmp` and the repositories are local checkouts, so the tick must run on the same machine:

| Scheduler | Survives | Use when |
|---|---|---|
| **Desktop scheduled task** — `~/.claude/scheduled-tasks/<name>/SKILL.md`, frontmatter `name` and `description`, body the tick prompt | App restarts; fires while the desktop app is running | **Default** — a delivery queue outlives any session |
| **`CronCreate`**, or the built-in `/loop <n>m <tick prompt>`, in this session | This session only; recurring jobs expire after 7 days | Rarely: a one-slice queue the human will keep a session open for — say both limits out loud |
| **Cloud routine** (`/schedule`) | Everything | **Never** for a local queue: a cloud agent sees neither the queue file, the lock, nor the checkouts |

For the desktop scheduled task: create it through the desktop app where you can. Where you can only write the file, write it and have the human confirm in the app that it is listed and set to the cadence — do not claim a schedule exists because a file does. Either way, tell the human the **permission mode** the tick must run with: it edits files, runs git, pushes and calls `gh` with nobody watching, and a tick stuck on a permission prompt holds a `CLAIMED` row until the reclaim window passes.

**Cadence** defaults to 30 minutes. Most ticks are no-ops by design. The **reclaim window** defaults to 6 hours — longer than the slowest row is expected to take, or live work gets stolen. Task rows are short (one commit); SPEC and PLAN rows are the long ones.

**Ending.** The agent that finishes the last row sets the queue's Status to `complete` and logs that the schedule can be removed; later ticks see `complete` and exit. It removes the schedule only when it owns it — a `CronCreate` job in its own session. A desktop scheduled task is removed by the human.

## Steps

### 1. Load the source and its lineage (hard input)

- Take `--design-doc` / `--story-map`, or find the source from `--ticket` in the configured location. Read it end to end, and read what it cites: `feature-description.md`, `prioritization.md`, spikes, `software-engineering-skills:arm-workshop` output, design decisions, open questions, scope boundaries.
- **It must slice delivery.** For each slice, find or derive: an id, a name, the outcome or KPI it targets, and the ribs/items it contains. A source that is one undifferentiated feature is not queueable here — stop and offer `software-engineering-skills:user-story-mapping-workshop`.
- **It must be approved**, or the human must approve it now. A draft is not something to deliver unattended.
- **Is it actually this skill's input?** An approved `plan.md` with a PR stack is `software-engineering-skills:implementation-loop`'s. A single `spec.md` with no slicing is one unit — offer `software-engineering-skills:plan` plus that skill instead. Say which and stop.
- Collect the source's **open questions** and any **external merge gates**. Questions the source already recommends an answer for become `Q` rows in the decisions table; one that would change the shape of slice 1 goes to the human now.
- Check memory for prior context: `~/.claude/projects/<project-slug>/memory/`, starting from `MEMORY.md`.

### 2. Derive the units (hard gate)

Turn each slice into an ordered list of units, each one small enough for a single spec: one rib, one sliced item, one observable capability that ships and is validated on its own. Use the same signals `software-engineering-skills:specs` uses to refuse a request — more than one user activity end-to-end, parts that would ship separately, a name joining two capabilities with "and".

Present the slice → unit table to the human and get it confirmed. This is the one structural decision the source does not make for you, and every row on the board descends from it. `--slices` narrows which slices are queued; the rest stay in the source, unqueued, and the report says so.

### 3. Decide the stages

`spec,plan,task` by default. `plan,task` only when an approved spec already exists per unit — name the files. `--stages` overrides. Ask when it is not clear-cut: a queue that skips SPEC on a source that never had one plans from guesses.

### 4. Preflight (hard gate)

Establish every item with evidence, per repository. The queue's metadata, worktree section and guardrails are filled from these answers.

- [ ] The **reference checkout** path and remote; the base branch exists and is fetched. Agents never edit this checkout.
- [ ] The **worktree root** — the harness's convention if one exists, else `software-engineering-skills:build`'s default layout — and the **bootstrap command**, with any known fallback.
- [ ] **Stack update strategy**: whether force push is allowed, from the repo's rules, branch protection or a ruleset. Blocked → merge; allowed → rebase with `--force-with-lease`. Cannot establish it → ask; never find out by trying.
- [ ] **Open-PR path**: the repository's own PR skill if it has one, else `software-engineering-skills:open-pr`. Note whether it pauses for human input — the standing authorization must cover that pause.
- [ ] **The open-PR cap** (`--max-open-prs`, default 4), agreed with the human, and what happens when it is reached.
- [ ] **Commit attribution** and any other house rule a claiming agent would otherwise miss — from the user's and repositories' `CLAUDE.md` and rules. Copied into the guardrails verbatim.
- [ ] The **skills and agents** the rows invoke exist: `software-engineering-skills:specs`, `software-engineering-skills:plan`, `software-engineering-skills:build`, the open-PR path, and what `build` dispatches (`tdd-developer`, the yellow-gate reviewers, `plan-conformance-judge`). A missing one is a halt, not a substitution.
- [ ] **No branch-name collisions** for the first unit's PRs, and no path under the worktree root taken. Later units' names are checked at expansion time, not now — they do not exist yet.
- [ ] The **release gates**: per slice, what a human must do to release it, and who that human is.
- [ ] The **scheduler** available on this machine, and the **lock path** — `/tmp/<ticket-slug>-delivery.lock`, unused.

Report it as a short table.

### 5. Write the unit briefs and the release plan

One brief per unit: id, slice, the rib or item it covers **quoted from the source with its location**, what it delivers, what is explicitly out of it (usually the sibling units), the repository, and the spec and plan filenames it will produce. **Point into the source; do not restate it** — a brief that paraphrases becomes a second, drifting copy.

The release plan is per slice: outcome, KPI, units, flag and default, guardrail metric with threshold, release gate. Take the numbers from the source; where it has none, say `unverified:` and what would confirm it rather than inventing a threshold.

### 6. Write the queue

Fill [`references/queue-template.md`](references/queue-template.md). Write it beside the source as `delivery-queue-<slug>.md` — or where the harness puts plans. Every placeholder filled, every skill-instruction comment removed, the first row `READY` and every other row `BLOCKED`, **Status** `draft`, the event log's first line naming the source, the slices, the units and the stages. Only the first unit's SPEC and PLAN rows exist at this point; every other row arrives by expansion, and the queue says so out loud so a human reading a short board does not think work is missing.

If the plan location renders markdown as rich text, follow its editing rules (the template's "one paragraph is one physical line" and no-frontmatter lines exist for exactly that).

### 7. Quality gate (hard stop)

Hand the queue, the source and repository access to an independent read-only subagent (`subagent_type: "general-purpose"`, do not pin a model). It returns a verdict per item with evidence.

- [ ] **Self-sufficient**: an agent given only the tick prompt could claim, do and record any row — including expanding a board — without this conversation. Every path absolute or relative to a stated root; no "as discussed".
- [ ] **Complete**: every slice and unit the human confirmed in step 2 has its rows and its brief, in order; nothing in the queue the source does not ask for; every unqueued slice named as such.
- [ ] **Serial**: exactly one `READY` row; every unblocking rule readies exactly one successor — including the expansion's; the last row readies nothing and sets `complete`.
- [ ] **The expansion contract is executable**: a PLAN agent can read it and know exactly which rows to append, with which IDs, in which order, and what to do when the plan exceeds the ceiling or collides with an existing branch name.
- [ ] **Worktrees**: one per PR branch; the ownership precondition (clean tree, ledger HEAD) is stated for task rows; SPEC/PLAN rows keep no checkout; the reclaim exception is the only other entry.
- [ ] **Stack**: the cut-from resolution rule is stated with its commands, the ledger records the resolved answer and its evidence, and the open-PR cap is enforced at a named step.
- [ ] **Human review**: the section, its answer procedure and its template are present; the claim protocol resumes an `ANSWERED` block; the test separating it from the decisions table is stated.
- [ ] **Authorization**: every outward-facing act a row performs is on the standing authorization list — including the cap — and nothing else is.
- [ ] **Release plan**: every slice has an outcome, a guardrail and a release gate, and nothing in the queue lets an agent clear one.
- [ ] **Guardrails** match the user's and repositories' rules, attribution verbatim.

Then prove the lock yourself: run the protocol's step 1 and step 3 against the real lock path, and confirm it acquires, writes a holder, and releases. Fix blockers and re-run only the failing items (max 2 iterations; then surface what remains and ask).

### 8. Present, approve, schedule (hard stop)

Show the human the slice → unit table, the board as it stands, the release plan, the standing authorization with its cap, the stages, the cadence and the scheduler — and ask. **Only on an explicit yes**: set the queue's **Status** to `running`, create the schedule, write the scheduler's name or id into the metadata and the event log, and tell the human the permission mode the tick needs. `--no-schedule`: set `running` only if they ask, print the tick prompt, and stop.

### 9. Report and stop

Print the report below and stop. Do not run a tick. Do not claim the first row.

## Headless mode

The run is headless when `--headless` is passed or there is provably no human in the loop.

- The queue is written with **Status** `draft` and **never scheduled** — starting unattended agents that push and open PRs is exactly the approval a headless run cannot give.
- **The slice → unit split still needs confirming**, and cannot be. Derive it, mark it `unconfirmed (headless)` in the queue and the report, and say that the first SPEC row must not be claimed until a human has read it.
- Preflight items that need a human (an unknowable force-push policy, the open-PR cap, a release gate's owner) are recorded as `unresolved (headless)`, not assumed.
- The quality gate still runs, and its verdicts are still recorded.
- An existing queue at the target path halts the run.

## Final report template

````markdown
# Delivery loop: <Feature> — <scheduled | written, not scheduled>

**Queue**: <path>   **Source**: <path>   **Stages**: SPEC → PLAN → tasks → PR | PLAN → tasks → PR
**Scheduler**: <desktop scheduled task `<name>` | CronCreate `<id>` (session-only, expires <date>) | none>   **Cadence**: every <n> min   **Reclaim after**: <n> h   **Open-PR cap**: <n>

| Slice | Outcome / KPI | Units | Rows now | Release gate |
|---|---|---|---|---|
<!-- "Rows now" is what exists before any expansion — 2 per unit with SPEC, 1 without. -->

**First claimable**: `<task>` — expect the first claim within <n> minutes.
**The board grows**: each PLAN row appends one row per task it plans and one per PR. Expect ~<n> rows per unit.
**Worktrees**: one per PR branch at `<root>/<delivery-slug>/<repo>/<branch>`; none are removed by the queue.
**Standing authorization**: <the list, one line, including the cap>
**Slices not queued**: <ids and why — or none>
**Open questions carried in**: <Q ids, one line each — or none>

**For the human**
1. Answer Human review blocks in the queue: write under **Human answer**, set Status to `ANSWERED`. Nothing else to touch.
2. The tick must run with <permission mode>; <confirm the scheduled task is listed and set to every <n> minutes — if it was written as a file>.
3. **Merge as you go.** The queue stops at <n> open PRs. Reviewing and merging the bottom of the stack is what keeps it moving, and what keeps the next slice cut from `<base branch>` instead of from a tower of unmerged branches.
4. Releasing a delivered slice is yours: <the release gates, one line each>.
5. When Status reads `complete`: merge what is left, remove the schedule and the worktrees.
````

## Running this by hand (no skill)

The artifact matters, not the automation. A human doing this manually writes one file that lists the release slices in order and breaks each into the smallest pieces that could be specified on their own; marks exactly one step ready; and adds a rule saying that the person who writes a plan must also write that plan's tasks onto the board, because nobody could have listed them earlier. It tells every agent which branch's directory to work in and to refuse to touch it if someone left changes there; it caps how many pull requests may be open at once so the work cannot outrun whoever reviews it; it gives the agents one place to write a question that can wait and another, louder place for one that cannot — with the context written out and an empty space for the answer; and it schedules a prompt that says *follow this file*. The discipline that carries the value is that the board is grown by the document that knows the answer rather than guessed up front, and that when an agent meets something it must not decide, it stops and writes the question well enough to be answered from a phone.
