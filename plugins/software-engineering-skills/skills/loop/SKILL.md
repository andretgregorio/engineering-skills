---
name: loop
description: Routes one document to the loop that can run it — the queue-building skills that turn an approved artifact into work scheduled agents pick up unattended. A design document, story map or release plan whose delivery is sliced goes to software-engineering-skills:delivery-loop, which writes the specs and the plans too. An approved implementation plan that orders its PRs goes to software-engineering-skills:implementation-loop, which schedules those PRs. It classifies from the document's content rather than its filename, says what the evidence was, confirms when two readings are plausible, hands the invocation's other arguments through unchanged, and stops — it never writes a queue, schedules a tick or claims a task itself. Use when the user says "loop this", "queue this up", "run this unattended", "build this overnight", "schedule agents for this", or invokes /loop with a document. NOT for running a prompt on a recurring interval — that is the built-in /loop skill, and an invocation whose first argument is an interval or a slash command belongs to it.
role: orchestrator
user-invocable: true
argument-hint: "[<path to a design doc, story map or plan>] [--ticket <ID>] [<flags passed through to the chosen loop>]"
---

# Loop

You are making **one decision**: which loop runs this document. Then you hand it over and stop.

There are two, and the difference between them is how much of the pipeline still has to be written:

| | Source | What it schedules | Skill |
|---|---|---|---|
| **Delivery loop** | A design document, story map or release plan whose delivery is **sliced** | Per unit: SPEC → PLAN → one row per planned task → one row per PR. The board grows as plans are written | `software-engineering-skills:delivery-loop` |
| **Implementation loop** | An **approved plan** that orders its PRs | Per PR: SPEC → PLAN → CODE, or CODE-only when the plan is already buildable | `software-engineering-skills:implementation-loop` |

Both write a queue file, take the human's approval, schedule a recurring tick, and stop. Choosing between them is this skill's whole job, and getting it wrong is expensive: the wrong loop either re-specifies work that was already planned, or builds a sliced delivery from guesses.

## This is not the built-in `/loop`

Claude Code ships a built-in `/loop` that runs a prompt or slash command on a recurring interval. **If the invocation's first argument is an interval (`5m`, `30m`) or a slash command, that is the one the user wants** — say so in one line, name it, and stop. This skill is `software-engineering-skills:loop`, and it takes a document.

## What this skill does not do

- **Write a queue, schedule anything, or claim a task.** The loop it routes to does all of that, including its own approval gate. You never pre-empt that gate.
- **Fix the input.** A source with no slicing, a draft plan, a spec with nothing downstream of it — each has a named next step. Offer it and stop; do not route a document that is not ready.
- **Re-decide the work.** Slicing, ordering, PR boundaries and scope belong to the document and the loop that reads it.
- **Guess.** Two plausible readings is a question to the human, not a coin flip.

## Classification

Read the document — the whole thing, not the filename. A file called `plan.md` is routinely a design document, and a story map is routinely pasted into a ticket description.

| Signals in the document | Route |
|---|---|
| `## PR Stack` table with branches and bases · tasks with IDs like `E1`/`P2`, each carrying acceptance criteria, a Files table and tests · `**Status**: approved` | **implementation-loop** |
| Backbone activities with ribs · a walking skeleton · release slices with outcome KPIs · a prioritization table | **delivery-loop** |
| Business goals with baselines · use-case scenarios · scope in/out/deferred · **and** a delivery broken into ordered slices or increments | **delivery-loop** |
| Intent, technical notes, error handling, monitoring, acceptance criteria — one feature, no tasks and no slices (a spec) | **neither** — offer `software-engineering-skills:plan`, then this skill again |
| A feature description or design doc with **no** slicing and no task breakdown | **neither** — offer `software-engineering-skills:user-story-mapping-workshop` to slice it, or `software-engineering-skills:specs` when it is genuinely one functionality |
| A plan whose `**Status**` is `draft` | **neither** — the human approves it first; unattended agents do not build a draft |

**When both kinds of document exist** — a story map and an approved plan for one of its slices — the question is what the user wants delivered, and it is theirs to answer: the plan alone through the implementation loop, or the whole map through the delivery loop, which will write plans for the rest. Ask, with both options named. Do not infer it from which file was passed, because a user who passes a directory has not chosen yet.

Two things that do **not** decide the route: the filename, and which skill wrote the document. A hand-written plan with a real PR stack routes like a generated one.

## Rules

- **Classify from content, with evidence.** Name the sections and lines you read. A route you cannot evidence is a route you are guessing.
- **Ambiguity goes to the human, once.** One question, both options named with what each would produce. Never route on a tie.
- **Pass arguments through unchanged.** Every flag the user gave that the target skill accepts — `--ticket`, `--cadence`, `--stages`, `--slices`, `--max-open-prs`, `--no-schedule`, `--headless` — goes on verbatim. A flag the target does not accept is named back to the user, not dropped silently.
- **Route once.** You invoke one loop, with the resolved document path, and you are done. You do not supervise it, re-enter it, or run a second one.
- **A not-ready document is a stop, not a workaround.** Name the missing step and the skill that produces it.

## Steps

### 1. Resolve the input

Take the path from the invocation, or find the document from `--ticket` in the configured location. A directory: list the candidate documents in it and read them. Nothing at all: ask what should be looped, and name the two kinds of input that work.

### 2. Classify, with evidence

Read each candidate end to end and match it against the table above. Record, for the route you pick, the two or three concrete signals that decided it — section headings, a table's columns, a `**Status**` line — and the signal for the route you rejected.

### 3. Check it is ready

- The document is **approved**, or the human approves it now.
- Its open questions do not change the shape of the first thing the loop would schedule. One that does goes to the human before any routing.
- The target skill exists. A missing one is a stop, not a substitution.

### 4. Confirm when it is not clear-cut (hard stop)

Route silently only when the evidence is unambiguous. Otherwise ask one question: the two candidate routes, what each would produce, and your recommendation with its reason. Wait.

### 5. Hand over

Invoke the chosen skill through the Skill tool — `software-engineering-skills:delivery-loop` or `software-engineering-skills:implementation-loop` — with the resolved document path and the passed-through flags. Say in one line which route you took and why, then let that skill run its own steps, including its approval gate. Do not restate its output as your own.

## Headless mode

Headless when `--headless` is passed or there is provably no human in the loop.

- **Classify and route** when the evidence is unambiguous, passing `--headless` on — the target loop will write a draft queue and refuse to schedule it, which is the right headless outcome.
- **Ambiguity halts.** No human to ask means no route: report both candidates, their evidence, and stop.
- **A not-ready document halts** with the missing step named.

## Report template

```markdown
**Routed to**: `/<delivery-loop | implementation-loop>` — <one line: why>
**Document**: <path> (<kind>, Status <approved | …>)
**Evidence**: <the signals that decided it>
**Rejected**: <the other route> — <the signal that ruled it out>
**Passed through**: <flags>
```

## Running this by hand (no skill)

The artifact matters, not the automation. A human doing this opens the document and asks one question: *has somebody already decided what the pull requests are?* If yes, the work is ready to be scheduled as it stands. If the document instead describes a delivery cut into releasable slices, the specs and plans for those slices still have to be written, and the queue has to be able to grow as they are. If it is neither — a spec on its own, or a feature description nobody has sliced — the honest answer is that there is nothing to schedule yet, and saying so beats starting a queue that will spend its first night guessing.
