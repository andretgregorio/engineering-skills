---
name: spike-investigation
description: Answers one falsifiable question about whether a behavior can be built in this codebase, by writing the acceptance criteria as executable assertions first and then hacking the throwaway version until they pass against the real running application. Maps which repositories are involved and spikes all of them, holds a timebox and asks the human to narrow the scope rather than overrun it, and produces a spike report — goal, result, approach, evidence, effort estimate, risks, and notes for the real implementation — while the code itself is discarded. Use when nobody can say yet whether or how a behavior is implementable, when a spec or plan needs a technical note it cannot honestly assert, or when the user says "spike this", "investigate the codebase", "can we even do this", "how hard would this be", "what would it take to", or invokes /spike-investigation.
role: orchestrator
user-invocable: true
argument-hint: "<question or behavior to investigate> [--repos <path,path>] [--timebox <hours>] [--ticket <ID>] [--headless]"
model: opus
---

# Spike Investigation

You are answering **one question about the code that reading the code cannot answer**: can this behavior be built here, by what route, and at what cost. You answer it by building the ugly version and watching it work against the real running system.

Two things fall out of that, and everything below is downstream of them:

- **The report is the deliverable. The code is scaffolding.** The diff exists to produce a fact; once the fact is recorded, the diff is thrown away. Nothing a spike writes is ever cleaned up into production code.
- **A spike that proves nothing is a failure, however much was learned.** "I read a lot of files and it looks feasible" is the outcome this skill exists to prevent. Something has to run, and it has to be able to say no.

Its readers are whoever writes the spec's technical notes, whoever plans the work, and whoever has to decide if it is worth doing at all.

## What this skill does not produce

- **A feature, or any part of one.** No production code, no commits on a shared branch, nothing pushed, nothing opened as a PR. If the spike's diff looks tempting to keep, that is a sign the spike was too large, not that it should be merged.
- **A spec or a plan.** It answers a technical question. What the feature *should* be is `/specs`; how it gets built is `/plan`. The spike report is an input to both, cited by path.
- **An architecture decision.** If the question turns out to be "which of these two designs", stop — that is `/arm-workshop`. A spike can serve such a workshop by pricing one option, but it cannot pick between them.
- **A schedule.** It estimates effort for the real implementation in rough sizes with named unknowns. It does not produce dates or story points.

## Rules

- **One question, falsifiable, written down before any code.** The question must have an answer that could be *no*. "Investigate the notifications system" is not a spike; "can we send a notification when an enrollment expires, without changing the enrollment write path" is.
- **The question becomes acceptance criteria before it becomes code.** Write the assertions that would settle it — action, observation, expected value — and get them agreed. Every expected value is derived from the requirement, never from a run of the system. See *Acceptance criteria first*.
- **Every repository the behavior touches is in the spike.** A spike that proves the backend half and assumes the frontend half has proven nothing about the feature — the seam between repos is where these questions usually die. See *Repository scope*.
- **Always start from the freshly fetched remote integration branch.** `git fetch`, then cut every worktree from `origin/develop` (or `origin/main` — whatever the workspace calls it), never from a local branch that may have drifted and never from a feature branch. Nothing runs on a base branch and nothing is pushed: throwaway worktrees, throwaway branches, deleted at the end. And read every fact from the worktree — a claim read out of a canonical checkout that is thirty commits behind is a wrong claim in the report.
- **It has to actually run.** The proof is a script that exercises the real running application end to end. See *Proving it works*. A unit test is a fallback, named as one.
- **Every criterion goes red before it goes green.** Run the probe against the unmodified code and watch each criterion fail for the right reason, before the spike makes it pass. A criterion that was green all along has proved nothing yet: it is either a behavior that already works or an assertion too weak to see the difference, and the green cannot tell you which. Show it can fail, or report it as unproven — never as working. See *Proving it works*.
- **The timebox is a hard stop, not a target.** Estimate before starting; if the spike as framed exceeds the box, go back to the human with narrowing options rather than starting a run that will not finish. See *The timebox*.
- **Ugly is allowed; dishonest is not.** Hardcode, copy-paste, comment things out, fake the data. Do not fake the *result* — see *What hacky permits, and what it does not*.
- **Record while you work, not from memory at the end.** Command, output, path, timestamp. The report's value dies with its evidence.
- **Report the negative result with the same care as the positive one.** "This cannot be done without changing X" is a valuable answer and often the more expensive one to obtain.
- **You do not get to declare your own spike sound.** When the report is written, an independent `spike-conformance-judge` checks it against the user's original request — while the worktrees still exist. See *The judge*.
- **Be succinct.** The report is a one-pager plus its evidence, read by someone deciding what to do next.

## The question

Frame it before anything else, and get it agreed. A spike question has three parts:

| Part | Example |
|---|---|
| The behavior | "an expiring enrollment sends the student a reminder email" |
| The constraint that makes it uncertain | "…without a new scheduled job, using the existing notification pipeline" |
| What would settle it | "an email lands in the local mail catcher when the clock is moved forward" |

If you cannot write the third part, you do not yet have a spike — you have a research task. Say so and ask what decision is waiting on the answer; the answer to *that* is usually the real question.

**One question per spike.** Two independent uncertainties are two spikes, run in sequence (the first often collapses the second). Say which one you are taking and why.

## Acceptance criteria first

Before any code — before the worktree, before the application comes up — turn the question into **the assertions that would settle it**. This is the step that separates a spike that answers the question from a spike that agrees with itself.

Each criterion has three parts and fits on one line:

| Part | Example |
|---|---|
| The action, at the boundary a user touches | "pick the *Institution (A–Z)* sort option" |
| The observation, on what the system produced | "the titles rendered on the result cards, in order" |
| The expected value, **derived from the requirement** | "Ash, Birch, Cedar, Oak — the Zeta rows after the Alpha rows" |

**The expected value is written down before the first run and never adjusted to match what the run produced.** Fitting an expectation to observed output is the most damaging thing a spike can do, because it turns the probe from a question into a mirror: everything passes, nothing was tested, and the report says the behavior works. When a run and a criterion disagree, *that disagreement is the finding* — take it to the human and decide which one is wrong.

**Every criterion must be able to fail, and you must name the wrong answer it rules out.** A criterion whose expected value is also what a broken implementation would produce is not a criterion. This is where the fixture earns its keep:

- **Ordering**: the correct order must differ from insertion order, from its own reverse, and from the default sort. A fixture where alphabetical happens to equal insertion order tests nothing, and a sort assertion with no tiebreaker is satisfied by whatever the database felt like returning.
- **Filtering**: the expected set must be a strict, non-obvious subset — not every row, not none of them, not exactly the first page.
- **Pagination on the path**: more rows than one page holds, and an assertion past page 1.
- **Anything keyed by identity**: values that differ per row, so a wrong join or a swap is visible.

**Cover the combinations, and the order they are applied in.** When the question is about several dimensions a user can mix — filters, sorts, tabs, flags — the dimensions in isolation are the easy half, and the interaction is where these features actually break. If two dimensions are reachable from the same screen, there are criteria for B-after-A *and* A-after-B. A spike whose criteria only ever exercise one dimension at a time cannot report the composite behavior as `proven`, however many single-dimension criteria are green.

**When the question comes from a reported symptom, the first criterion reproduces the symptom** — written from the reporter's own words, in the environment where they saw it if you can reach it. If it does not reproduce, *that* is the finding, and it goes back to the human immediately: it means the cause lies outside what you are looking at, or the environment differs in a way that matters. A spike that could not reproduce the complaint and then explained it with a mechanism it proved somewhere else has answered a question nobody asked, and it will be believed.

**Then check the list against the question, once, explicitly**: if every one of these passed, would the human's question be answered? If yes, the list is the spike. If no, the missing criterion *is* the spike.

Keep the list as short as the question allows — six sharp criteria beat twenty that all share one weakness. Present it at the scope gate (step 3) and get it agreed: it is cheap to change now and worthless to change later.

## Outcomes

The spike ends in exactly one of these, chosen on evidence and stated in the report header:

| Outcome | Meaning |
|---|---|
| `proven` | The probe passes against the real system by the approach described. |
| `proven with caveats` | It works, but only under conditions the real implementation must satisfy — listed, each one a risk row. |
| `disproven` | The behavior cannot be built this way. The report says what blocked it, at which line, and what would have to change. |
| `inconclusive` | The timebox ran out. The report says exactly how far it got, what is now known, and what the next spike should attack. |

**The outcome is bound to the criteria, not to an impression.** `proven` requires every criterion green **and** every one shown able to fail. A criterion that was green on the baseline and never shown discriminating is *unproven*: it caps the outcome at `proven with caveats`, and it takes a line in `## What this spike did not prove` plus a risk row. `disproven` names the criterion that could not be made green; `inconclusive` names the ones never exercised.

`inconclusive` is a legitimate ending and must never be dressed up as `proven with caveats`.

## Repository scope

Establishing which repositories are involved is step 2 and it is not a formality — the usual reason a "simple" change is not simple is that it crosses a contract nobody remembered.

- **Find them by tracing the behavior, not by asking.** Follow the call path outward: the surface the user touches, the API it calls, the schema or shared-types package both sides import, the consumers of the data you would change, the infrastructure that would need a new resource.
- **If more than one repository is involved, all of them are in the spike.** Set up a worktree for each, wired the way the real workspace wires them (sibling layout, local links, whatever the workspace's own rules say), and make the probe cross the seam. A cross-repo spike whose probe only exercises one side is `inconclusive`, not `proven`.
- **The workspace's own rules win.** Read `CLAUDE.md`, `.claude/rules/`, and contributing docs at every level before creating anything — some workspaces require all sibling repos present before install, pin toolchain versions, or forbid touching the canonical checkouts. Getting this wrong costs more time than the spike itself.
- **A repo you can only read still counts.** No write access, a third-party service, a vendored binary: name it, say what you assumed about it, and make that assumption a risk row.

State the repository list to the human before hacking, with what each one is expected to contribute. It is the strongest early signal that the scope is wrong.

## The timebox

**Default: two hours of wall clock** for the whole run — recon, setup, hacking, probing and report. `--timebox <hours>` overrides it.

**Estimate before you start (hard stop).** After the recon in step 2, say how long the spike itself will take and why. If that exceeds the box, do not start: go back to the human with the estimate and **two or three concrete narrowing options**, and let them choose. The narrowing moves that actually work:

- **Attack the riskiest unknown alone.** Prove the one thing nobody is sure of; take the rest as read, and say you did.
- **Stub the far side of the seam.** A hand-rolled fake for the service, the queue, or the third-party API — enough to prove your side. The fake becomes a risk row.
- **Shrink the path, not the proof.** One record instead of a batch, one locale, one tenant, the happy path only. Keep the probe end-to-end; make what flows through it small.
- **Fake everything that is not the question.** Hardcoded auth, a seeded row instead of a real signup, a clock moved by hand, `sleep` instead of a scheduler.
- **Split into two spikes** and run only the first. If it goes badly the second is never needed.

**Check at the halfway mark.** Record the start time (`date -Iseconds`) and compare. At 50% of the box, if the probe has not yet run red against the baseline, you are behind: report position and ask whether to narrow or push on. Do not discover the overrun at the end.

**When the box expires, stop hacking and write the report.** The report is not optional at the deadline — it is what makes an `inconclusive` spike worth the time it cost. Reserve the last ~15% of the box for it.

## Proving it works

The evidence ladder, best first. **Take the highest rung you can reach inside the box, and name the rung you took in the report** — the whole ladder is honest, and pretending you were higher up than you were is not.

1. **A script against the real running application.** Boot the app the way the project boots it, drive it from outside, assert on what comes back: `curl` against the running API, the CLI invoked as a user invokes it, a browser script, a message put on the real queue, a row read back out of the real database. This is what the skill asks for.
2. **A script against the real system with one seam faked** — the third-party API stubbed, the clock advanced, auth hardcoded. Say which seam and why.
3. **An integration test through the framework's own harness** — real routing, real serialization, in-memory or containerized dependencies.
4. **A unit test or a REPL transcript.** Only when nothing above can run inside the box, and only with the reason stated. It proves an API's behavior, never a feature's feasibility.

**The rule that carries all of it: every criterion goes red on the baseline first.** Check out the unmodified code, run the probe, capture the output and read it case by case — each failure must be *because the behavior is missing*, not because the script is broken, the app is not up, or the URL is wrong. Then apply the spike and run the same probe unchanged. Two captured outputs, one red one green, from the same script: that is the artifact.

**A criterion that is green on the baseline is the trap this rule exists for.** It means one of three things and the green cannot tell you which: the behavior already works, the assertion is too weak to see the difference, or the action did nothing and the assertion was satisfied by the state the screen was already in. Reporting it as "already works" without separating those is exactly how a spike comes to certify a feature that visibly does not work. So make each such criterion **fail on purpose**, and watch it go red:

- Perturb the input so the correct answer must change — the opposite sort, a different filter value, the next page — and require the observation to change with it.
- Or break the path deliberately in the throwaway tree (return early, drop the parameter, skip the join) and confirm the criterion notices.
- Or start from a state where the action is not a no-op. Never assert on selecting an option that is already the default: the click does nothing, the page re-renders what it had, and the criterion passes without a single request being made.

A criterion you could not make fail is **unproven** and says so in the report, whatever color it printed. That is the difference between "the sort works" and "we never checked the sort".

**Keep the probe script.** It is the one piece of the spike that survives — save it next to the report and paste its exact invocation and raw output in. Whoever implements the real thing starts by making that script pass again.

## What hacky permits, and what it does not

Spike code is judged by one criterion — does it produce a trustworthy answer. So:

**Permitted, and do not apologize for any of it:** hardcoded IDs, credentials from your own dev environment, **commenting out the authentication or authorization check and hardcoding a signed-in user**, copy-pasted blocks, commented-out branches, `console.log` everywhere, no error handling, no types, no tests beyond the probe, functions in the wrong file, a schema change applied by hand, ignoring the repo's lint and style rules entirely. Do not run the formatter. Do not refactor. Do not write a doc comment.

**Not permitted, because each one corrupts the answer or costs more than the spike is worth:**

- **Anything pushed, committed to a shared branch, or opened as a PR.**
- **Faking the result.** A stubbed dependency is fine and is disclosed; a probe that asserts on a value your own spike code hardcoded is a lie. The probe must observe the system, not your scaffolding.
- **Faking anything on the path the criteria observe.** Fake freely *off* that path — auth, the clock, a third-party API, a seeded row instead of a real signup — and disclose each one. Never shortcut a step a criterion is asserting about: the moment the thing under investigation is scaffolding, the green means nothing. "Can I comment out the auth guard?" — yes, unless the question is about authorization.
- **Fitting an expected value to what the system returned.** See *Acceptance criteria first*. Expectations come from the requirement; a probe whose expectations were calibrated to the output proves only that the system is consistent with itself.
- **Mutating anything shared.** No writes to a shared dev or staging database, no messages onto a shared queue, no records in a third-party account others use, no changes to shared infrastructure. Local, isolated, or a throwaway resource you also destroy.
- **Real secrets or real customer data anywhere on disk**, including in the report and the probe script.
- **Breaking someone else's environment** — the canonical checkouts, shared test databases, global tool versions.
- **Disabling or deleting existing tests to get the app to boot.** If the suite is in your way, say so; that is a finding about the codebase, and it belongs in the risks.

## The judge

You report what you found. **Whether that answers what was asked is judged by someone who did not run the spike.** Dispatch `spike-conformance-judge` — read-only, independent — as soon as the report is written, and **before anything is destroyed**.

Its strongest check is reproduction, and that only exists while the worktrees do. Judging after cleanup reduces every reproduction verdict to `unverifiable`, and removes the chance to repair a gap cheaply while the spike is still standing. So the order is: write the report, judge it, *then* tear it down.

Hand it: **the user's original request verbatim** — not your restatement, which is the very thing under audit — the framed question, **the acceptance criteria as agreed**, the report, the probe script, the captured runs, the diff per repository, and the worktree paths. It returns a verdict per dimension (goal fidelity, something actually ran, the criteria could have failed, the probe observes the system, reproduction, repository coverage, outcome honesty, decision usefulness, containment): **meets / falls short / unverifiable**, each with evidence.

- **`falls short` on goal fidelity is the one that matters most**, and it is the failure this gate exists for: a right answer to a question that quietly got easier. It is never fixed by editing the wording of the report — either the missing thing gets proven, or the outcome comes down.
- **`falls short` on *the criteria could have failed* is the one that hides in a green run.** A criterion that could not have failed makes a passing probe a mirror; the repair is a sharper criterion and another run, never a softer sentence in the report. If it cannot be sharpened inside the box, that criterion is unproven and the outcome comes down with it.
- **`falls short` elsewhere**: repair what is cheap and re-run only the failing dimensions (max 2 iterations). What cannot be repaired inside the box is recorded in the report — as a downgraded outcome, a new risk row, or a line in `## What this spike did not prove`, whichever is honest — and surfaced to the human.
- **`unverifiable`** is not a pass. It usually means the evidence was not captured well enough to be re-checked, which is a defect in the report and fixable on the spot while the environment is up.
- Record the judgment in the report's `## Judgment` section, verdicts and all, including the ones that came back short. A gate whose failures are invisible afterwards is decoration.

The judge never continues the spike, never reviews spike code for craft, and never proposes the fix.

## Estimating the real implementation

The estimate is the second reason anyone reads this report, and the spike is what earns the right to give one. Derive it from what you actually touched, not from a feeling.

- **Per repository**, a rough size — `S` (under a day), `M` (a few days), `L` (over a week) — with the files and layers the real change would touch, taken from your diff.
- **What the real version needs that the spike skipped**, itemized, because that is most of the difference: error handling, the states the spike ignored, migrations and their rollback, tests at the levels the repo actually uses, translations, feature flag and rollout, observability, permissions and multi-tenancy, performance at real volumes.
- **The unknowns that survive**, each with what would resolve it — the next spike, a load test, a question for a person.
- **The delivery order across repos**, when there is more than one: shared contracts merge first and their consumers follow; say it here so the plan does not rediscover it.

Give the estimate as a range with the assumption that makes it hold. A single number implies a confidence the spike did not buy.

## Headless mode

The run is **headless** when `--headless` is passed or there is provably no human in the loop.

- **The scope gate still stops the run.** A spike estimated over its box does not silently start in headless mode — report the estimate and the narrowing options, and halt. Guessing which scope the human wanted wastes the whole box.
- **The framing gate still stops the run.** A question that is not falsifiable halts; do not invent one, and do not proceed on criteria whose expected values you cannot derive from the request — halt and say which one you could not write.
- **Everything else takes the most defensible option and records it** in `## Assumptions` as `assumed (headless)`.
- **Never silently overwrite** an existing spike report — halt instead.
- **The judge still runs, and its verdict still binds.** A `falls short` that cannot be repaired inside the box downgrades the outcome in the report — to `inconclusive` when goal fidelity failed — and halts. Headless is not permission to grade your own work.
- Cleanup still happens, and nothing is ever pushed.

## Steps

### 1. Frame the question and write the acceptance criteria (hard stop)

Write the question in the three-part form above, then write the criteria that would settle it per *Acceptance criteria first* — expected values derived from the requirement, the wrong answer each one rules out, the combinations included — and show both to the human before touching anything. Name the decision waiting on the answer and the outcome that would count as `disproven`. If the request holds two questions, say which one you are taking and why. Read the ticket and any upstream `feature-description.md` / `spec.md` / `plan.md` for what has already been settled — a spike that re-answers a resolved question is pure cost. Check memory for prior work in this area (`~/.claude/projects/<project-slug>/memory/`, starting from `MEMORY.md`), including earlier spikes on the same surface.

The criteria are drafted here from the request and sharpened once at step 3, when recon has shown you what the boundary actually looks like — sharpened, never relaxed to fit what the code turned out to do.

### 2. Map the territory (read-only)

Read before you write, and stay out of the working tree. Produce:

- **The repositories involved**, traced outward from the behavior, each with what it must contribute. Parallel read-only subagents (`subagent_type: "general-purpose"`) are worth it when there are several repos or a large monorepo — one per repo, each returning entry points, the nearest analogous feature, and the seams. **Keep the hacking for yourself**; a spike's real product is your understanding of the path, and handing the build to a subagent throws it away.
- **The nearest thing that already works like this.** Almost every spike question has a cousin already in the tree; find it, read it end to end, and plan to imitate it. This single step is what most often turns a two-hour spike into a twenty-minute one.
- **The seams** — where you can inject, and what is hard-wired and will have to be hacked around.
- **How the app runs and how you would drive it from outside**, taken from the project's own docs and scripts, not invented.
- **The workspace's rules** for worktrees, toolchain versions, install order, and anything forbidden.

### 3. Scope, estimate, and timebox (hard stop)

Present: the question, **the acceptance criteria in their final form**, the repository list, the route you intend to try, the probe that will carry the criteria, and **how long you expect it to take**. If it exceeds the box, present the narrowing options from *The timebox* and let the human pick. Record the start time when you begin.

### 4. Set up throwaway workspace

`git fetch` in every involved repository, then one worktree per repository on a branch named `spike/<slug>`, cut from the freshly fetched remote integration branch — `origin/develop`, or whatever the workspace's rules name — following the workspace's own layout rules and install order. Never in a canonical checkout, never off a local branch that may have drifted, never off a feature branch. From here on read every fact about the code from the worktree: a claim taken from a canonical checkout that is behind the remote is a wrong claim in the report, and it reads exactly like a right one.

Bring the application up and confirm it is up **before writing any spike code** — a failure to boot at this point is a finding, and diagnosing it later mixed with your own changes costs double.

### 5. Baseline red, criterion by criterion

Write the probe from the criteria — one case per criterion, each printing its action, what it observed, and what it expected. Run it against the unmodified code, capture the output verbatim, and read every case: a red case must be red because the behavior is absent, and a green case is not a pass but a question, answered per *Proving it works* by making it fail on purpose. Fix the probe until every failure is honest and every criterion has been shown able to fail. Only then start hacking.

**Do not edit an expected value to match what you just saw.** If a criterion and the system disagree, that is a finding — take it to the human.

### 6. Hack until it is green

Take the shortest route that makes the probe pass, under *What hacky permits, and what it does not*. Keep a running note as you go: each thing you tried, each thing that surprised you, each place the codebase resisted. Those notes are the report's `## Approach` and half its `## Risks` — they are unrecoverable afterwards.

**Halt and go back to the human** when: the answer turns out to require a decision between designs (`/arm-workshop`); the behavior is `disproven` early (do not spend the rest of the box looking for a way around — report it, that *is* the answer); the route requires touching something the rules forbid; a criterion turns out to contradict how the system behaves, so the disagreement itself has to be settled before the green means anything; the reported symptom does not reproduce; or the box is going to be blown.

### 7. Halfway checkpoint

At 50% of the box, compare position to plan. Behind means: report in three lines — what is proven, what is not, what you would drop — and ask to narrow or push on. Do not go quiet.

### 8. Capture the evidence

With the probe green, run the whole thing once more from a clean start — restart the app, re-run the probe — and capture that run, not an earlier partial one. Record: the exact command, the raw output for both the baseline and spike runs, **the per-criterion verdict table including how each baseline-green criterion was shown able to fail**, the app version/commit each ran against, and the diffstat per repository. Save the probe script alongside the report.

### 9. Estimate the real implementation

Per *Estimating the real implementation*, derived from your diff and your notes.

### 10. Write the report

Use the template below. Outcome first — a reader must be able to stop after the header and act correctly.

### 11. Judge the spike (hard stop, before anything is destroyed)

Dispatch `spike-conformance-judge` per *The judge*, with the user's original request verbatim, the agreed criteria, the report, the probe, the captured runs, the diff, and the live worktree paths. Repair what its `falls short` verdicts allow you to repair while the environment is still up, re-run only the failing dimensions (max 2 iterations), and record every verdict — including the repaired ones — in the report's `## Judgment`.

An unrepaired `falls short` is a halt: take the judge's evidence to the human with your reading of it, and let them decide whether the outcome comes down or the spike gets more box. Do not proceed to cleanup with an outstanding verdict, and never edit the report's wording to make a verdict go away.

### 12. Destroy the code (hard stop)

Save the diff as a patch appendix next to the report (`spike-<slug>.patch`, one per repo when several) so the implementation can read the route without resurrecting it, then remove every worktree, delete every `spike/*` branch, and tear down any throwaway resource you created. Confirm in the report that nothing was pushed and nothing remains. The patch is an appendix, not a contribution: it is never applied to a real branch.

### 13. Present and stop

Print the report path, give the human the header, the judge's overall verdict, and the estimate, and name what comes next — `/specs` when the answer feeds a technical note, `/plan` when the spec already exists, `/arm-workshop` when the question turned architectural, or another spike when one unknown survived. Do not start it.

## Document template

````markdown
# Spike: <the question, as a question>

**Ticket**: <ABC-123 | none>
**Date**: <date>
**Outcome**: <proven | proven with caveats | disproven | inconclusive>
**Timebox**: <2h> · **Actual**: <1h40>
**Repositories**: <repo-a @ <sha>, repo-b @ <sha>>
**Evidence rung**: <1 real running app | 2 real with a faked seam | 3 integration harness | 4 unit/REPL>
**Criteria**: <n of n green, m unproven>
**Probe**: `<path to the probe script>`

## Goal
<!-- The question in its three parts: the behavior, the constraint that made it uncertain, what would settle it. And the decision that was waiting on the answer. -->

## Result
<!-- The answer, in the first sentence. Then what specifically was observed — not "it worked", but what ran and what came back. Caveats and conditions, each also a risk row below. -->

## Acceptance criteria
<!-- Written before any code, expected values derived from the requirement. `Ruled out` is the wrong answer the criterion would have caught. `Able to fail` is how it was shown discriminating: red on the baseline, or the deliberate break that turned it red. A criterion that could not be made to fail is `unproven` — whatever it printed — and is repeated in `## What this spike did not prove`. -->

| # | Action → observation → expected | Ruled out | Baseline | With spike | Able to fail |
|---|---|---|---|---|---|

## Approach
<!-- The route that worked, in the order a reader would take it: the entry point, the seam used, what was changed in each repository, what was faked and why. Then the routes that did NOT work and what stopped them — this is often the most valuable paragraph in the document. -->

| Repository | What the spike changed | Diffstat |
|---|---|---|

## Evidence

**Baseline (unmodified) — expected red**

```
$ <command>
<raw output — the failure, showing the behavior is absent>
```

**With the spike — expected green**

```
$ <same command, unchanged>
<raw output>
```

<!-- Anything else observed: log lines, the row in the database, the message on the queue, the screenshot path. -->

## Effort estimate for the real implementation

| Repository | Size | What it would touch |
|---|---|---|

**What the real version needs that this spike skipped**: <error handling, empty and error states, migration + rollback, tests at the repo's levels, translations, flag and rollout, observability, permissions, performance at real volume — itemized, not a list of headings>

**Range**: <e.g. 4–7 days, assuming …>
**Delivery order**: <shared contract first, then …>

## Risks

| Risk | What the spike saw | What would tell us early / mitigation |
|---|---|---|

## Notes for the real implementation
<!-- What the next person needs and would otherwise rediscover: the pattern to imitate (by path), the seam to use, the trap that cost time here, the thing that looks removable but is not, the shortcut taken here that must NOT be taken there. -->

## What this spike did not prove
<!-- Explicit. Every assumption, every faked seam, every path not exercised. This section is what stops the report being over-read. -->

## Judgment
<!-- `spike-conformance-judge`, run before cleanup with the user's original request. Overall verdict, then one line per dimension. Verdicts that came back short are recorded here with what was done about them — repaired, outcome downgraded, or taken to the human — never edited away. -->

**Verdict**: <meets | falls short | unverifiable> · **Reported outcome**: <…> · **Outcome the evidence supports**: <…>

| Dimension | Verdict | Gap and what was done |
|---|---|---|
| Goal fidelity | | |
| Something actually ran | | |
| Criteria could have failed | | |
| Probe observes the system | | |
| Reproduction | | |
| Repository coverage | | |
| Outcome honesty | | |
| Decision usefulness | | |
| Containment | | |

## Assumptions
| Assumption | Why | How it was resolved |
|---|---|---|
<!-- Resolved by: evidence | human | assumed (headless) -->

## Appendix — the throwaway diff
<!-- `spike-<slug>.patch`, per repo. Reference only; it is never applied to a real branch. Confirm here: nothing pushed, worktrees removed, branches deleted, throwaway resources destroyed. -->
````

## Running this phase by hand (no skill)

Write down the one question you want answered and what result would make you say no. Then write the handful of assertions that would settle it — what you would do, what you would look at, and what it should say — deciding each expected value from what the behavior *ought* to be, before you have seen what it does. Trace the behavior outward until you know every repository it touches, fetch, and check out a throwaway branch off the remote integration branch in each. Get the application running unchanged, write the crudest possible script that asks it to do the new thing and checks those assertions, and watch every one of them fail for the right reason — and for any that passes straight away, go and break something until it fails, because otherwise you do not know it is looking. Then hack — badly, on purpose — until the same script passes, keeping a running note of everything that surprised you. Stop at the clock, not at satisfaction. Write down what you asked, what happened, how you got there, what would bite whoever does it properly, and how big you now think it is. Then — before you delete anything — hand the original request and your write-up to a colleague who was not involved, and have them run your script themselves and tell you whether it answers the question that was actually asked. Then delete the branch. The discipline that carries the value is the red baseline, per assertion — without it you cannot tell a working spike from a probe that never checked anything, and an expectation you quietly edited to match the output is worse than no expectation at all — and refusing to keep the code, because a spike kept is a spike that stops being allowed to be ugly, and an ugly spike is the fast one.
