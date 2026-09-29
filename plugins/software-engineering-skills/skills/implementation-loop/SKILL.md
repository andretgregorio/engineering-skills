---
name: implementation-loop
description: Turns an approved implementation plan that orders its PRs into a self-running build queue — one markdown queue file that agents claim tasks from, one at a time, so every PR in the stack gets its spec, its plan and its code written unattended, in order, each code task in a worktree of its own. A conflict that needs a decision stops the queue with a Human review block that explains the context and leaves a space for the human's answer; the next tick after the answer resumes the task. It writes the queue, gets the human's approval, and starts its driver — a recurring schedule that fires unattended ticks, or one orchestrator session that dispatches a subagent per task and carries Human reviews to the human in chat — chosen by --queue-mode or asked. It never claims a task itself. Use when a plan with an ordered PR stack is approved and should be built by scheduled or orchestrated agents rather than in one live /build session, or when the user says "create an implementation loop", "queue this plan", "schedule agents to build this", "build this overnight", or invokes /implementation-loop.
role: orchestrator
user-invocable: true
argument-hint: "[--plan-file <path>] [--ticket <ID>] [--cadence <minutes>] [--stages spec,plan,code|code] [--queue-mode scheduled|orchestrated] [--no-schedule] [--headless]"
model: opus
---

# Implementation Loop

You are turning **one approved plan with a PR ordering** into a queue that builds itself. The output is a single markdown file — the queue — and a **driver** that starts agents against it. Each agent reads the queue, claims the one task that is ready, does it, records it, and readies the next. You write the queue and start the driver; the agents do the work.

There are two drivers, and the queue is the same file under either — see *Driving the queue*:

- **Scheduled** — a recurring schedule starts a fresh agent every few minutes, unattended. The human hears about a blocking question from a notification and answers it in the file.
- **Orchestrated** — one long-lived session, the orchestrator, dispatches a subagent per task the moment the previous one finishes, carries every blocking question to the human in chat and their answer back into the file, and hands the human's own requests to subagents too. It never does a task itself.

The queue is the contract between agents that never meet. Everything a claiming agent needs — what to read, how to claim, where to build, what it may and may not do, and how to stop — is in the file, because the agent has nothing else. A queue that relies on this conversation is broken.

Its readers are the claiming agent with no memory, the human who answers its questions without opening anything else, and whoever reads the ledger after the stack has merged.

The template is [`references/queue-template.md`](references/queue-template.md). Read it before step 5; this file explains the decisions behind it.

## What this skill does not produce

- **Code, specs or plans.** The claiming agents write those, through `/specs`, `/plan` and `/build`. You do not claim the first task to "get it started".
- **A new PR ordering.** The order, the branches and the scope of each PR come from the source plan. When the source has no usable ordering, that is a `/plan` conversation — stop and offer it.
- **Merges, approvals or releases.** The queue ends with every PR open against its parent. Merging the stack is a human act, or `/monitor-pr`'s.
- **Authority the human did not give.** The queue's standing authorization lists exactly which branches may be pushed and which PRs opened. Nothing else outward-facing is licensed by it.

## Rules

- **Serial by construction.** At most one row is ever `READY`. Finishing a row readies the next; nothing readies two.
- **One CODE task, one worktree, never reused.** Every CODE task creates its own worktree from the remote tip of its base and keeps it as that PR's home. No task builds in, reads from, or checks out inside a worktree it did not create. See *Worktrees*.
- **Two channels to the human, never confused.** A conflict that makes the work wrong either way is a **Human review**: the queue stops. A question that can proceed on a stated assumption is a **Decisions awaiting the human** row: the queue keeps moving. See *Asking the human*.
- **`specs`, `plan` and `build` run headless inside the queue.** The queue tells every agent it starts — tick, worker or ad-hoc subagent — to invoke `software-engineering-skills:specs`, `software-engineering-skills:plan` and `software-engineering-skills:build` with `--headless`, and no other skill, and maps each headless outcome to a channel: `assumed (headless)` → a decisions row; a halt → a Human review; a `draft` document → set `approved` by the task; a `build` PR → a draft, covered as one by the standing authorization. Nothing inside a task talks to the human except through the file — even under an orchestrator, which is the bridge, not a participant in the skill's conversation.
- **The board is the only signal.** A task is done when its row says `DONE`, not when its artifact exists. Every board edit happens under the lock, with its event-log line in the same edit.
- **Read at a ref, not at a working tree.** Every path, line and symbol an agent asserts is read at a named commit. The source plan's citations were true once and will drift.
- **The human approves before any driver starts.** A running queue pushes branches and opens PRs; starting it is outward-facing whether a schedule or an orchestrator runs it. No driver without an explicit yes.
- **One driver at a time.** The queue's **Driver** line names the one running. The lock keeps two drivers from claiming the same row, but not from reclaiming each other's live work.
- **Never overwrite a queue.** An existing queue file is live state other agents may be mid-edit on. Ask; headless, halt.

## Anatomy of a queue

| Section | What it holds | Who changes it |
|---|---|---|
| Metadata | Source plan, status, repositories, worktree root, stack strategy, open-PR path, driver, tick prompt, orchestrator prompt, lock path | Agents change **Status** only; the orchestrator also sets `paused` / `running` on the human's word |
| Reading order | What a claiming agent reads, in order, before touching anything | Human |
| Standing authorization | The exact outward-facing acts the human approved | Human |
| Driving this queue | The two drivers, and the orchestrator's whole contract — its loop, how it relays Human reviews, how it routes the human's requests | Human |
| Claim protocol | Lock, claim, release, record, conflict, resume, reclaim — identical under either driver | Human |
| The board | One row per task: status, claimant, timestamps, output | Agents, under the lock |
| What each kind of task does | SPEC, PLAN, CODE — the steps, the skills they invoke, what "done" means | Human |
| Worktrees | One per CODE task, never reused, and the few exceptions | Human |
| Stack ledger | Per PR: repo, branch, cut-from, PR base, worktree, PR link, state | Agents |
| PR briefs | Per PR: title, content, out of scope, what must be proven, merge gate | Human |
| External merge gates | Tickets or PRs that block merging, not building | Agents record, human clears |
| Human review | Blocking conflicts, one block each, with the human's answer | Agents raise and close, human answers |
| Decisions awaiting the human | Non-blocking questions and the assumption taken | Agents append |
| Guardrails, Editing this document | The hard limits and the file's own editing rules | Human |
| Event log | One line per state change, append-only | Agents |

### Task stages

By default every PR is three rows — **SPEC → PLAN → CODE** — because a plan that orders PRs is usually coarser than a buildable plan: a design document with an approach and a PR list, not per-task acceptance criteria. Each SPEC narrows the source to one PR and re-verifies it against the code as it is *now*, after the PRs below it have landed; each PLAN turns that into buildable tasks with a one-row PR stack; each CODE builds it.

When the source is already an approved `/plan` document — every PR's tasks carry acceptance criteria, files and tests — SPEC and PLAN are redundant, and the queue is **CODE-only**: one row per PR, building that PR's tasks from the source plan. Decide this in step 2 and state it in the queue.

## Worktrees

Every CODE task creates `<root>/<plan-slug>/<repo>/<branch>` with `git worktree add -b <branch> <path> origin/<base>`, bootstraps it, and records the path in the stack ledger before it writes any code. The path follows the harness first — a worktree convention in the user's or project's `CLAUDE.md` or rules wins — and `/build`'s default layout otherwise.

A shared stack worktree is the cheaper design and the wrong one for unattended agents. It accumulates state nobody owns: a human's comment edits, an earlier agent's half-applied fix, anything left uncommitted between ticks. The next agent either builds on it without knowing — and ships someone else's change in its PR — or stops the queue to ask whose it is. A fresh worktree per task removes the hazard, and makes provenance answerable from the path alone.

What follows from that:

- **Cut from the remote tip**, `origin/<previous branch>`, not a local branch — it carries any fix pushed since the previous task finished.
- **SPEC and PLAN tasks keep no checkout.** They read with `git show` / `git grep` at a ref, or a throwaway `git worktree add --detach` removed before they finish.
- **Updating an earlier branch** — merging the base up the stack — happens in a throwaway detached worktree, pushed with `git push origin HEAD:<branch>`, never inside that branch's own worktree.
- **An unexpected path or branch** where the task's must go is a Human review. Never delete it, never adopt it.
- **The one exception**: a reclaimed CODE task continues in the worktree the ledger records for that same task.
- **The queue never removes a CODE worktree.** It is the PR's home until the PR merges or closes; cleanup is the human's, or `/monitor-pr`'s.
- **The cost is real and accepted**: each worktree pays its own install. Say so in the queue.

## Asking the human

An unattended queue will meet questions. What matters is that each lands in the channel that matches its cost.

**Decisions awaiting the human** is for questions that can proceed. The agent states the assumption it took and where a reversal would land, and carries on. Most questions belong here — a queue that stops for every ambiguity finishes nothing, and one that stops for none builds the wrong thing quietly.

**Human review** is for conflicts that cannot. The test is whether proceeding *either way* produces work that is wrong rather than merely debatable: the source plan contradicts the code and no binding decision settles it; the task cannot finish inside its scope boundary; the repository is in a state the agent must not act on alone (a worktree or branch it did not create where its own must go, commits that are not the stack's); or the next act is outward-facing and not covered by the standing authorization.

A Human review is a block, not a table row, because a human has to decide from it without opening anything else. Every block carries:

| Field | Why |
|---|---|
| Status — `OPEN` → `ANSWERED` → `APPLIED` (or `WITHDRAWN`) | The only thing the next tick reads to know it may resume |
| Raised, Blocks | Who stopped the queue, when, and what is waiting on it |
| Left in place | Every artifact, worktree, branch and uncommitted change — so nothing is redone or lost |
| What the task was doing | Context for a reader who has not read the task's spec or plan |
| The conflict | The document's claim, quoted with its location, against the evidence of what is true |
| Why this cannot proceed on an assumption | The paragraph that separates this from a decisions-table row. If it cannot be written, the item is a row |
| Options, one recommended | Each with what it costs and which later rows and PRs it touches |
| **Human answer** | A marked, empty space for the decision |
| Answered by, Applied | Who decided, and what the resuming agent did with it |

**The human's whole job is to write the answer and flip one word.** They set the block to `ANSWERED` and touch nothing else. On its next tick, an agent that finds no `READY` row looks for a `NEEDS-HUMAN` row whose block is `ANSWERED`, claims it, reads the answer before anything else, continues from what was left in place, and on completion sets the block to `APPLIED`. An answer it cannot act on without guessing goes back to `OPEN` with a follow-up line saying exactly what is unclear — a guessed answer is worse than a second question.

Raising a block also sets the queue's **Status** line to `stopped — waiting on HR-<n>`, so the stop is visible from the top of the file, and sends one notification when a notification tool is available.

## Driving the queue

The claim protocol does not know which driver runs it. A driver decides only two things: **when** a claiming agent starts, and **how the human hears** about a Human review. Everything else — the lock, the board, the worktrees, the authorization — is the queue's, which is why a queue can switch drivers mid-flight: stop one, rewrite the **Driver** line, start the other. Starting the day orchestrated and leaving it scheduled overnight is a legitimate use.

### Choosing

`--queue-mode scheduled|orchestrated` decides it. Without the flag, ask — one question, both options described by what the human's next few days look like, not by mechanism:

| | **Scheduled** | **Orchestrated** |
|---|---|---|
| The human | Away — overnight, across days, checking in from a phone | Around, and wants to steer while it runs |
| Pace | One task per tick at best; an idle gap of up to one cadence between tasks | The next task starts the moment the last one finishes |
| A Human review | A notification; answered by editing the file | Brought to the human in chat, with the options; their reply is written into the file for them |
| The human's own requests | A separate session, which must not touch the queue's worktrees | Said to the orchestrator, which routes them to subagents without colliding with the queue |
| Lives | As long as the scheduler — survives app restarts | As long as the orchestrator's session |
| Permission prompts | Nobody sees them; a stuck tick holds its row until the reclaim window | Reach the human in the orchestrator's session |

Recommend one only when the user's own words decide it — "overnight", "while I'm out" → scheduled; "I'll be around", "keep me in the loop", "let me steer" → orchestrated. Otherwise present both without a recommendation. Headless with no flag: record `scheduled` as `unresolved (headless)`.

### Scheduled: the tick

The tick prompt is one line and points at the queue: `Follow the instructions in <queue path>. Read the whole file before acting. If no task is claimable, exit without writing anything.` Write it into the queue's metadata so the schedule can be rebuilt from the file.

Pick the scheduler by where the queue lives. The lock is a directory in `/tmp` and the repositories are local checkouts, so the tick must run on the same machine:

| Scheduler | Survives | Use when |
|---|---|---|
| **Desktop scheduled task** — lives at `~/.claude/scheduled-tasks/<name>/SKILL.md`, frontmatter `name` and `description`, body the tick prompt | App restarts; fires while the desktop app is running | **Default** for a local queue |
| **`CronCreate`**, or `/loop <n>m <tick prompt>`, in this session | This session only; recurring jobs expire after 7 days | A short queue the human will keep a session open for — say both limits out loud, and consider orchestrated instead |
| **Cloud routine** (`/schedule`) | Everything | **Never** for a local queue: a cloud agent sees neither the queue file, the lock, nor the checkouts |

For the desktop scheduled task: create it through the desktop app where you can. Where you can only write the file, write it and have the human confirm in the app that it is listed and set to the cadence — do not claim a schedule exists because a file does. Either way, tell the human the **permission mode** the tick must run with: it edits files, runs git, pushes and calls `gh` with nobody watching, and a tick stuck on a permission prompt holds a `CLAIMED` row until the reclaim window passes.

**Cadence** defaults to 30 minutes (off the `:00`/`:30` marks when the scheduler takes a cron expression). Most ticks are no-ops by design; a shorter cadence only shortens the idle gap between tasks. The **reclaim window** defaults to 6 hours — longer than the slowest CODE task is expected to take, or live work gets stolen.

**Ending.** The agent that finishes the last row sets the queue's Status to `complete` and logs that the schedule can be removed; later ticks see `complete` and exit. It removes the schedule only when it owns it — a `CronCreate` job in its own session. A desktop scheduled task is removed by the human.

### Orchestrated: one session, many subagents

The orchestrator is a **dispatcher and a bridge**, never a worker. It starts claiming agents, reads the board, carries Human reviews to the human and answers back, and routes the human's own requests to subagents. Its whole contract is written into the queue's **Driving this queue** section, so a fresh session started with the queue's **Orchestrator prompt** can take over from a compacted or closed one — the file, not the orchestrator's memory, is the state.

Why it must not work itself: an orchestrator that builds fills its context with one task's detail and stops being able to hold the queue, the human's requests and the next dispatch at once. It also becomes a second claimant the lock does not know about. So it never claims a row, never writes a spec, plan or commit, and never edits a row's Status except to mark a dead worker's claim abandoned.

**Workers.** A worker is one claiming agent, briefed with the **Tick prompt** plus a request to reply with the row it claimed, its Status now, and any `HR-<n>` it raised. One worker at a time — the queue is serial, and a second would find nothing to claim. The next one is dispatched the moment the previous returns and the board shows a `READY` row; there is no cadence. How a worker is started is a preflight answer, because a CODE task runs `/build`, which dispatches subagents of its own:

| Launch | Use when |
|---|---|
| An Agent-tool subagent (`subagent_type: "general-purpose"`, background) | The harness lets a subagent dispatch subagents — **probe it** in preflight, do not assume it |
| A headless session in the background — `claude -p "<tick prompt>" --permission-mode <mode>` from the orchestrator's shell | It does not. The orchestrator is notified when the process exits and reads the board, exactly as for a subagent |

**Reading the board, not the reply.** When a worker returns, the orchestrator re-reads the file and acts on what the board says — a worker's summary is a claim, the board is the record. A row still `CLAIMED` with no worker behind it means the worker died: the orchestrator marks it abandoned (its **Claimed by** becomes `abandoned — <old id>`, under the lock) and the claim protocol reclaims such a row at once instead of after the window. A second abandonment of the same row is not retried; it goes to the human.

**The bridge.** A Human review is presented in chat in full enough to decide from — the conflict, why no assumption works, the options with the recommendation — and nothing is dispatched until it is answered. The human's reply goes under **Human answer** verbatim, with **Answered by** `<human> via orchestrator`, and the block flips to `ANSWERED`; the next worker resumes the row. The orchestrator never answers a block itself and never paraphrases an answer into something the human did not say.

**The human's requests** go one of four ways, and the orchestrator decides which before acting:

| Request | Route |
|---|---|
| A question about progress | Answered from the file; no subagent |
| A change to what the queue has not built yet — amend a brief, skip a PR, pause, resume | An edit to a human-owned section, on the human's explicit word, under the lock, logged `human via orchestrator`. A `DONE` row is never re-opened |
| Work on something the queue already produced — a change to a finished PR, a review comment, a red check, an update up the stack | An ad-hoc subagent briefed with the queue's guardrails, worktree rules and standing authorization; it works in a throwaway detached worktree, never on the branch of the row currently `CLAIMED`, and logs what it pushed |
| Anything unrelated | An ordinary subagent, told not to touch the queue file, the lock, or the worktree root |

Ad-hoc subagents may run alongside the worker — at most two, never two on one branch. Anything outward-facing beyond the standing authorization is asked in chat first, and the yes is logged.

**Ending.** When the board reads `complete`, the orchestrator reports the final stack ledger and stops dispatching. If the human closes the session earlier, the queue simply stops: nothing advances until a driver runs again, and a worker that died with the session leaves a `CLAIMED` row the next driver reclaims.

## Steps

### 1. Load the source plan and its lineage (hard input)

- Take `--plan-file`, or find the plan from `--ticket` in the configured plan location. Read it end to end.
- **It must order PRs.** For each PR, find or derive: number, title, repository, branch, base, and a scope you can point into. A plan with no PR ordering is not queueable — stop and offer `/plan`.
- **It must be approved.** A draft is not something to run unattended. Ask the human to approve it, or stop.
- Read what it cites: feature description, spec, spikes, design decisions, open questions, scope boundaries. The queue points at them; you need to know what they bind.
- Collect **external merge gates** — tickets or PRs the source says must merge first — and the source's **open questions**. Open questions the source already recommends an answer for become `Q` rows in the decisions table; one that would change the shape of PR 1 goes to the human now.
- Check memory for prior context: `~/.claude/projects/<project-slug>/memory/`, starting from `MEMORY.md`.

### 2. Decide the stages and the driver

SPEC → PLAN → CODE per PR, or CODE-only when the source is an approved `/plan` with buildable tasks per PR (see *Task stages*). `--stages` overrides. Ask when it is not clear-cut: a CODE-only queue on a coarse plan builds from guesses.

Scheduled or orchestrated: `--queue-mode` decides it; without the flag, ask (see *Choosing*). Both questions can go in one ask. The answer decides what step 3 checks and what step 7 starts.

### 3. Preflight (hard gate)

Establish every item with evidence, per repository. The queue's metadata, worktree section and guardrails are filled from these answers.

- [ ] The **reference checkout** path and remote; the base branch exists and is fetched. Agents never edit this checkout.
- [ ] The **worktree root** — the harness's convention if one exists, else `/build`'s default layout — and the **bootstrap command**, with any known fallback.
- [ ] **Stack update strategy**: whether force push is allowed, from the repo's rules, branch protection or a ruleset. Blocked → merge; allowed → rebase with `--force-with-lease`. Cannot establish it → ask; never find out by trying.
- [ ] **Open-PR path**: the repository's own PR skill if it has one, else `/open-pr`. Note whether it pauses for human input — the standing authorization must cover that pause.
- [ ] **Commit attribution** and any other house rule a claiming agent would otherwise miss — from the user's and repositories' `CLAUDE.md` and rules. Copied into the guardrails verbatim.
- [ ] The **skills and agents** the tasks invoke exist: `specs`, `plan`, `build` and what `build` dispatches. A missing one is a halt, not a substitution.
- [ ] The **branch names** do not already exist, locally or on the remote, and no path under the worktree root is taken.
- [ ] The **lock path** — `/tmp/<ticket-slug>-queue.lock`, unused.
- [ ] *Scheduled*: the **scheduler** available on this machine.
- [ ] *Orchestrated*: the **worker launch**. Probe whether a subagent can dispatch a subagent of its own — dispatch one whose only job is to dispatch a trivial second one and report whether it could. Yes → Agent-tool workers. No → headless `claude -p` workers: confirm `claude` is on `PATH` and name the permission mode they run with. Never pick the subagent launch on assumption: a worker that cannot dispatch fails inside `/build`, halfway through a CODE task.

Report it as a short table.

### 4. Write the PR briefs

One brief per PR: the exact title (Conventional Commits where the repo uses them), repository, branch, cut-from, PR base, content, out of scope, what must be proven, merge gate. **Point into the source; do not restate it.** A brief that paraphrases the source becomes a second, drifting copy of it — quote section names and decision IDs so the agent reads the original.

### 5. Write the queue

Fill [`references/queue-template.md`](references/queue-template.md). Write it beside the source plan as `queue-<slug>.md` — or where the harness puts plans. Every placeholder filled, every skill-instruction comment removed, the first row `READY` and every other row `BLOCKED`, **Status** `draft`, the event log's first line naming the source and the stages. If the plan location renders markdown as rich text, follow its editing rules (the template's "one paragraph is one physical line" and no-frontmatter lines exist for exactly that).

### 6. Quality gate (hard stop)

Hand the queue, the source plan and repository access to an independent read-only subagent (`subagent_type: "general-purpose"`, do not pin a model). It returns a verdict per item with evidence.

- [ ] **Self-sufficient**: an agent given only the tick prompt could claim, do and record any row without this conversation. Every path absolute or relative to a stated root; no "as discussed".
- [ ] **Complete**: every PR in the source has its rows and its brief, in the source's order; nothing in the queue that the source does not ask for.
- [ ] **Serial**: exactly one `READY` row; the unblocking rule readies exactly one successor per row; the last row readies nothing and sets `complete`.
- [ ] **Chain**: each branch is cut from the previous one's remote tip and targets it as PR base; the ledger, the briefs and the CODE steps agree on every name.
- [ ] **Worktrees**: every CODE task creates its own at a path unique to it; no step builds in, reads from, or checks out inside another task's; the reclaim exception is the only reuse.
- [ ] **Human review**: the section, its answer procedure and its template are present; the claim protocol resumes an `ANSWERED` block; the test separating it from the decisions table is stated.
- [ ] **Authorization**: every outward-facing act a task performs is on the standing authorization list, and nothing else is.
- [ ] **Driver**: the **Driver** line names one driver; the **Driving this queue** section is present with both drivers; for an orchestrated queue, an orchestrator given only the **Orchestrator prompt** could run its loop, relay a Human review, and route each kind of request without this conversation, and the claim protocol reclaims an `abandoned` row at once.
- [ ] **Headless**: every `specs`, `plan` and `build` invocation in the queue carries `--headless`, no other skill invocation does, the guardrail maps each headless outcome (assumption, halt, draft document, draft PR) to its channel, and the standing authorization covers PRs as drafts where `build` opens them.
- [ ] **Guardrails** match the user's and repositories' rules, attribution verbatim.

Then prove the lock yourself: run the protocol's step 1 and step 3 against the real lock path, and confirm it acquires, writes a holder, and releases. Fix blockers and re-run only the failing items (max 2 iterations; then surface what remains and ask).

### 7. Present, approve, start the driver (hard stop)

Show the human the board, the stack ledger, the standing authorization, the stages and the driver — the cadence and scheduler, or the worker launch — and ask. **Only on an explicit yes**, set the queue's **Status** to `running`, and then:

- *Scheduled*: create the schedule, write the scheduler's name or id into the **Driver** line and the event log, and tell the human the permission mode the tick needs.
- *Orchestrated*: write `orchestrated — session <this session's name or id>` into the **Driver** line and the event log, and tell the human the permission mode workers run with and that permission prompts will reach them here.

`--no-schedule`: start no driver; set `running` only if they ask, print the tick prompt or the orchestrator prompt, and stop.

### 8. Report, then stop or orchestrate

Print the report below.

- *Scheduled*: stop. Do not run a tick. Do not claim the first row.
- *Orchestrated*: this session becomes the orchestrator. Say so in one line, then follow the queue's **Driving this queue → Orchestrated** section from its first step — read from the file, not from what you remember writing, so this session runs the queue exactly as a fresh one would. You still never claim a row.

## Headless mode

The run is headless when `--headless` is passed or there is provably no human in the loop.

- The queue is written with **Status** `draft` and **no driver is started** — starting agents that push and open PRs is exactly the approval a headless run cannot give. `--queue-mode orchestrated` is recorded in the **Driver** line but has no human to bridge to; the report says a human starts it with the orchestrator prompt.
- Preflight items that need a human (an unknowable force-push policy, an ambiguous stage choice) are recorded as `unresolved (headless)` in the report, not assumed.
- The quality gate still runs, and its verdicts are still recorded.
- An existing queue at the target path halts the run.

## Final report template

````markdown
# Implementation loop: <Feature> — <scheduled | orchestrated | written, no driver started>

**Queue**: <path>   **Source**: <path>   **Stages**: SPEC → PLAN → CODE | CODE-only
**Driver**: <scheduled — desktop scheduled task `<name>` | CronCreate `<id>` (session-only, expires <date>), every <n> min | orchestrated — this session; workers are <Agent-tool subagents | headless `claude -p` sessions> | none>   **Reclaim after**: <n> h (scheduled) · at once when the orchestrator marks a claim abandoned

| PR | Repo | Branch | Base | Rows | Merge gate |
|---|---|---|---|---|---|

**First claimable**: `<task>` — <expect the first claim within <n> minutes | the first worker is dispatched now>.
**Worktrees**: each CODE task creates `<root>/<plan-slug>/<repo>/<branch>`; none are removed by the queue.
**Standing authorization**: <the list, one line>
**Open questions carried in**: <Q ids, one line each — or none>

**For the human**
1. <Scheduled: answer Human review blocks in the queue — write under **Human answer**, set Status to `ANSWERED`, nothing else to touch. | Orchestrated: Human reviews come to you here; answer in chat. Ask for anything else here too — progress, a fix on an open PR, a pause — and it is routed to a subagent without colliding with the queue.>
2. <The tick must run with <permission mode>; confirm the scheduled task is listed and set to every <n> minutes — if it was written as a file. | Workers run with <permission mode>; prompts they raise reach you in this session. Closing this session stops the queue where it stands; resume with the orchestrator prompt in the queue's metadata.>
3. When Status reads `complete`: review the stack bottom-up, merge in order, remove the schedule if there is one, and the worktrees.
````

## Running this by hand (no skill)

The artifact matters, not the automation. A human doing this manually writes one file that lists the PRs in order, breaks each into the steps an agent should take, and marks exactly one step as ready; adds a lock so two agents never claim the same step; tells every agent to build in a fresh worktree of its own and never in someone else's; gives the agents one place to write down a question that can wait and another, louder place for one that cannot — with the context written out and an empty space for the answer; and then either schedules a prompt that says *follow this file*, or sits one person — the orchestrator — beside the file whose only jobs are to hand the next step to a fresh pair of hands the moment the last one finishes, carry questions to the human and answers back, and route the human's own requests so they never trip over the queue's work. The discipline that carries the value is that the file, not anyone's memory, decides what is next — and that when an agent meets something it must not decide, it stops and writes the question well enough to be answered from a phone.
