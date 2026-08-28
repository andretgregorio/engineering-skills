# Spike Investigation Skill

Answers **one falsifiable question about the code that reading the code cannot answer**: can this behavior be built here, by what route, and at what cost — by building the throwaway version and watching it work against the real running application.

```
/spike-investigation "<question or behavior>" [--repos <path,path>] [--timebox <hours>] [--ticket <ID>] [--headless]
```

## Purpose

Two facts drive everything else:

- **The report is the deliverable. The code is scaffolding.** The diff exists to produce a fact; once the fact is recorded, the diff is thrown away.
- **A spike that proves nothing is a failure, however much was learned.** "I read a lot of files and it looks feasible" is exactly what this skill exists to prevent. Something has to run.

Its readers are whoever writes the spec's technical notes, whoever plans the work, and whoever decides whether it is worth doing at all.

## When to use

Nobody can say yet whether or how a behavior is implementable — "can we even do this", "how hard would this be", "what would it take to". Also when `/specs` needs a technical note it cannot honestly assert, or `/plan` is still guessing after reading the code.

Not for: a feature or any part of one (nothing is pushed or merged); a spec or a plan; an architecture decision — a question that turns out to be "which of these two designs" is `/arm-workshop`, and a spike can only price one option, never choose; or a schedule.

## The question

Three parts, agreed before any code:

| Part | Example |
|---|---|
| The behavior | "an expiring enrollment sends the student a reminder email" |
| The constraint that makes it uncertain | "…without a new scheduled job, using the existing notification pipeline" |
| What would settle it | "an email lands in the local mail catcher when the clock is moved forward" |

No third part means it is a research task, not a spike. One question per spike — two uncertainties are two spikes, run in sequence.

## Outcomes

`proven` · `proven with caveats` · `disproven` · `inconclusive`.

**`disproven` is a result, not a failure** — and often the more expensive one to obtain. `inconclusive` (the box ran out) is legitimate and must never be dressed up as `proven with caveats`.

## The rules that carry the value

- **Every repository the behavior touches is in the spike.** The seam between repos is where these questions usually die; a cross-repo spike whose probe exercises one side only is `inconclusive`, not `proven`. A read-only or third-party repo still counts — name it and make the assumption a risk row.
- **The probe fails on the baseline first.** Run it against unmodified code, read the failure, confirm it fails *because the behavior is absent*. Then apply the spike and run the same script unchanged. Two captured outputs, one red one green, from one script — that is the artifact. Without the red run you cannot tell a working spike from a probe that never checked anything.
- **The timebox is a hard stop, not a target.** Two hours by default. Estimated after recon and *before* hacking; over the box means going back to the human with narrowing options, not starting a run that will not finish. Checkpoint at 50%; the last ~15% is reserved for the report.
- **Ugly is allowed; dishonest is not.**
- **Nothing runs on a base branch and nothing is pushed.** Throwaway worktrees, `spike/<slug>` branches, all destroyed in step 11.

## Evidence ladder

Take the highest rung reachable inside the box, and **name the rung in the report**.

1. A script against the real running application — `curl` at the running API, the CLI as a user invokes it, a browser script, a real message on the real queue.
2. The same, with one seam faked (third-party stubbed, clock advanced, auth hardcoded) — say which and why.
3. An integration test through the framework's own harness.
4. A unit test or REPL transcript — only when nothing above fits the box. Proves an API's behavior, never a feature's feasibility.

The probe script is the one artifact that survives: whoever implements the real thing starts by making it pass again.

## Hacky, precisely

**Permitted, unapologetically:** hardcoded IDs, copy-paste, commented-out branches, `console.log`, no error handling, no types, wrong files, a schema change applied by hand, the repo's lint and style rules ignored entirely. Do not run the formatter. Do not refactor.

**Not permitted**, because each corrupts the answer: anything pushed or merged; a probe asserting on a value the spike itself hardcoded; writes to a shared database, queue, third-party account or infrastructure; real secrets or customer data on disk; breaking a canonical checkout or a shared test database; disabling existing tests to get the app to boot (that is a *finding*).

## Narrowing an over-box spike

Attack the riskiest unknown alone · stub the far side of the seam · shrink the path but keep the proof end-to-end · fake everything that is not the question · split into two spikes and run only the first.

## The judge

When the report is written — and **before the worktrees are destroyed** — an independent [`spike-conformance-judge`](../../agents/spike-conformance-judge/README.md) checks it against the **user's original request, verbatim**, not the spike's restatement of it.

The order matters: the judge's strongest check is re-running the probe itself, which only exists while the environment does. Judging after cleanup reduces every reproduction verdict to `unverifiable` and removes the chance to repair a gap cheaply.

It returns `meets` / `falls short` / `unverifiable` across eight dimensions — goal fidelity, something actually ran, the probe observes the system rather than the scaffolding, reproduction, repository coverage, outcome honesty, decision usefulness, containment.

**Goal fidelity is the one this gate exists for**: a right answer to a question that quietly got easier is the characteristic spike failure, and it is invisible from inside the spike. It is never fixed by rewording the report — either the missing thing gets proven, or the outcome comes down. Every verdict is recorded in the report's `## Judgment`, including the ones that came back short.

## What the report contains

Header (outcome, timebox vs actual, repos and SHAs, evidence rung, probe path), then: **Goal** · **Result** · **Approach** — including the routes that did *not* work, often the most valuable paragraph · **Evidence** — raw baseline-red and spike-green output · **Effort estimate** per repo with what the real version needs that the spike skipped, as a range with its assumption · **Risks** · **Notes for the real implementation** · **What this spike did not prove** · **Judgment** — the judge's verdict per dimension · **Assumptions** · the throwaway-diff appendix.

## Next

`/specs` when the answer feeds a technical note, `/plan` when the spec already exists, `/arm-workshop` when the question turned architectural, or another spike when one unknown survived. The skill names it and stops.

Full definition: [`SKILL.md`](SKILL.md), including the report template. Running the phase by hand is described at the end of it.
