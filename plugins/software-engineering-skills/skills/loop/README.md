# Loop Skill

One decision: **which loop runs this document.** Then it hands over and stops.

```
/loop [<path to a design doc, story map or plan>] [--ticket <ID>] [<flags passed through>]
```

> **Not the built-in `/loop`.** Claude Code ships a `/loop` that runs a prompt on a recurring interval. This one is `software-engineering-skills:loop` and it takes a document. An invocation whose first argument is an interval (`5m`) or a slash command belongs to the built-in, and this skill says so and stops.

## The two loops it routes to

| | Source | What it schedules | Skill |
|---|---|---|---|
| **Delivery loop** | Design doc, story map or release plan with a **sliced** delivery | Per unit: SPEC → PLAN → one row per planned PR, each building that PR's tasks and opening it. The board grows as plans are written | [`delivery-loop`](../delivery-loop/README.md) |
| **Implementation loop** | An **approved plan** that orders its PRs | Per PR: SPEC → PLAN → CODE, or CODE-only when the plan is already buildable | [`implementation-loop`](../implementation-loop/README.md) |

Both write a queue file, take the human's approval, schedule a recurring tick, and stop. The wrong choice is expensive in both directions: the implementation loop on a sliced design doc builds from guesses, and the delivery loop on a finished plan re-specifies work that was already planned.

## How it decides

From the document's **content**, never its filename — `plan.md` is routinely a design doc, and a story map is routinely pasted into a ticket.

| Signals | Route |
|---|---|
| `## PR Stack` table · `E1`/`P2` tasks with acceptance criteria, Files tables and tests · `Status: approved` | implementation-loop |
| Backbone and ribs · walking skeleton · release slices with outcome KPIs · prioritization table | delivery-loop |
| Business goals, scenarios, scope in/out **and** an ordered set of delivery slices | delivery-loop |
| A spec — one feature, no tasks, no slices | neither: `/plan` first |
| A design doc with no slicing | neither: `/user-story-mapping-workshop` first (or `/specs` if it is genuinely one functionality) |
| A plan still marked `draft` | neither: unattended agents do not build a draft |

**Both kinds present?** That is a question about what the user wants delivered, and it gets asked — the plan alone, or the whole map with the rest of its plans written for it.

## Boundaries

| It does | It never does |
|---|---|
| Reads the document and names the evidence for its route | Route on a filename, or on which skill wrote the file |
| Asks one question when two readings are plausible | Break a tie itself |
| Passes every flag through verbatim | Drop an unsupported flag silently |
| Stops and names the missing upstream step | Route a draft, a spec, or an unsliced design doc |
| Invokes exactly one loop, once | Write a queue, schedule a tick, or claim a task |

Everything after the handover — preflight, the queue file, the approval gate, the schedule — belongs to the loop it routed to.

Full definition: [`SKILL.md`](SKILL.md).
