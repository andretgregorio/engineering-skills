---
name: plan
description: Turns an approved spec into an implementation plan — an ordered checkbox todo list where every task is classified as an Engineer or a Product task and carries 1–3 verifiable acceptance criteria, the exact files it changes, its automated tests, and its test plan — plus a proposed stack of independently reviewable PRs. Part of the Spec Driven Development workflow — it runs right after /specs, passes a spec-conformance quality gate, and stops before any code is written. Use when a spec is approved and the work needs breaking down, or when the user says "plan this", "break this down", or invokes /plan.
role: orchestrator
user-invocable: true
argument-hint: "[--spec-file <spec_file>] [--ticket <ID>] [--headless]"
model: opus
---

# Plan

You are turning **one approved spec into one implementation plan**: an ordered list of small tasks an engineer executes one at a time, each verifiable on its own, grouped into a stack of pull requests that a reviewer and a tester can each take in isolation.

Its readers are the engineer (human or agent) who builds the feature, the reviewer who receives the PRs, and the tester who validates them.

The plan is also **the implementation's memory**. Every task and every acceptance criterion is a checkbox; the checked boxes are the record of what has actually landed, so a fresh session — or a different person — can pick the work up mid-flight without re-deriving it.

## What this skill does not produce

- **Code, commits, or PRs.** The plan is a document. A throwaway spike is allowed to verify a path or an approach; its code is discarded, never committed.
- **A second spec.** Intent, scope, and acceptance criteria are settled. If planning exposes a hole in them, stop and go back to `/specs` — do not patch the spec from inside the plan.
- **Estimates or a schedule.** Order and dependencies, yes. Story points and dates, no.

## Rules

- **One spec, one plan.** The plan covers exactly the spec's functionality. A task that serves something the spec does not ask for is out — record it under `## Deferred` instead of smuggling it in.
- **No file path you have not opened.** Every path in the plan either exists in the repo (you read it) or is explicitly marked `new:`. Every described change is consistent with what the file actually contains today. An invented path is the single most expensive defect this document can carry.
- **Every task is verifiable by someone else.** The verification is a command, a query, or a numbered walkthrough that a second person can run without asking you a question — with the expected result stated. "Works correctly", "code is clean", and "tests pass" (which tests?) are not verifications.
- **Small tasks.** One behavior or one enabler per task, 1–3 acceptance criteria. A fourth criterion means it is two tasks.
- **Trace both ways.** Every spec acceptance criterion is covered by at least one Product task; every Product task cites the criteria it satisfies; every Engineer task names the task it unlocks.
- **Follow the codebase's conventions, not your own.** Name the existing pattern or the nearest analogous feature each task imitates, by path. A plan that invents a house style will be rewritten in review.
- **The quality gate is a hard stop.** Do not finalize until every item passes.
- **Human approval is a hard stop.** This skill ends by presenting the plan. It never auto-continues into implementation.
- **Be succinct.** This is dense reference material an engineer reads task by task, not an essay. Tables and short lines beat paragraphs.

## Anatomy of a task

Every task carries these fields, in this order. Nothing is optional; "none" is a valid value written out loud.

| Field | Content |
| --- | --- |
| ID + title | `P3 — Reject enrollment when the term has closed`. IDs are `E<n>` for Engineer tasks and `P<n>` for Product tasks, numbered once across the whole plan and never reused. The task's own checkbox lives in its PR's checklist; the detail block below repeats the ID as a heading. |
| Type | `Engineer Task` or `Product Task` (see below). |
| Why | One line. For a Product task, the user-visible outcome. For an Engineer task, the task it unlocks. |
| Spec refs | The spec acceptance criteria, technical notes, error-handling rows, or monitoring rows this task discharges. An Engineer task may cite `unlocks P4` instead. |
| Files | A table: `path` · `new / modified / deleted` · what changes in it. Specific — the function, endpoint, column, resource, or component, not "update the service". |
| Acceptance criteria | 1–3 checkboxes, each an observable outcome with a pass/fail condition. |
| Verification | How each criterion is proven, with the exact command/query and the expected result. |
| Automated tests | A table: test file · level (unit / integration / contract / e2e) · what it asserts · the command that runs just it. Mark which test goes red first. |
| Test plan | The manual and out-of-band checks: environment, preconditions and test data, numbered steps, expected result, who runs it. `none — fully covered by the automated tests above` when that is true. |
| Notes | Ordering constraints, feature-flag state, migration reversibility, anything a reader would otherwise get wrong. Omit when empty. |

A **Product task** additionally carries its **Gherkin scenarios** — the spec deliberately defers these to here. One scenario per behavior the task introduces, written at the observable boundary (what a user or a calling client can see), with no framework, selector, or function name in the steps. These are what the automated tests bind to; the acceptance criteria and the scenarios must agree.

When the task changes a **user-facing surface**, its scenario set has a required shape, because the spec declared those states and they are the ones that get dropped: the happy path, the **empty state** (first-run and zero-results are separate scenarios when the spec separates them), the **error state** for each user-visible failure mode the task touches, and the **keyboard-only path**. A state the spec explicitly marked not-handled needs no scenario — say so in Notes rather than leaving the gap unexplained.

## Engineer tasks vs Product tasks

The classification tells a reader what kind of proof to expect, and it is what stops product behavior from arriving hidden inside a refactor.

**Product task** — implements the behavior. It changes what a user or a calling client can observe, it traces to spec acceptance criteria, it gets Gherkin scenarios, and it is what a tester validates.

**Engineer task** — an enabler that changes no observable behavior. Typical shapes: a small refactor that opens a seam for the next task; introducing the feature flag before anything sits behind it; a schema migration or infrastructure change that unlocks the implementation; adding the metric or log line the spec's monitoring section requires; adding a shared type or contract that both sides will import; a characterization test that pins current behavior before it is changed.

Two consequences worth being strict about:

- **An Engineer task's acceptance criteria are behavior-preserving claims**, and they still have to be verifiable: the existing suite is green with no test changed; the flag off reproduces today's behavior exactly; `terraform plan` shows precisely these N resources and nothing else; the new column is nullable and the migration rolls back cleanly.
- **An Engineer task that unlocks nothing is scope creep.** If you cannot name the task it serves, it belongs under `## Deferred`.

Within a PR, order the Engineer tasks that unlock work before the Product tasks that consume it.

## Verification menu

Reach for whatever actually proves the task; a mix is normal. Always state the expected result, not just the command.

- **Automated tests** — the command that runs the specific test, and the assertion that matters.
- **Infrastructure** — `terraform plan` output (which resources, which attributes) before `apply`, and what `apply` produced.
- **Database** — the `SELECT` to run and the row shape or count expected; for a migration, both the forward and the rollback check.
- **Analytics / data platform** — the query or chart (Amplitude, BigQuery, Datadog, Looker) and the event or metric expected to appear, with its properties.
- **API surface** — the request (`curl`, HTTP client) and the expected status and body.
- **Observability** — the log line, metric, or trace expected in the named dashboard, and its query.
- **Manual testing** — environment, login/role, test data setup, numbered steps, expected result. Use it for what automation genuinely cannot reach (visual, third-party, human judgment) — never as a substitute for a test that could exist.

**Prove the test can fail.** For anything load-bearing, the task says which test is written first and observed red before the implementation makes it green. A test that passes for the wrong reason is worse than no test.

## The PR stack

The plan **may** split the work across several PRs, and should whenever one PR would be too large or too mixed to review honestly. Splits are **stacked branches**: PR 2 branches off PR 1's head, PR 3 off PR 2's, and they merge in order.

Each PR must be:

- **One theme a reviewer can hold in their head.** If judging PR *n* requires reading PR *n+1*, they are one PR.
- **Independently reviewable and independently verifiable.** State per PR what a tester can do with it. "No user-visible change; verified by the suite and by `terraform plan`" is a legitimate answer for an enabler PR — an unverifiable one is not.
- **Safe to merge on its own.** After it lands, the product works: incomplete behavior is off behind the flag, and no intermediate state is user-visible.

Keep the stack shallow — three or four deep at most. Say plainly that reworking an early PR forces a restack of everything above it, and that reviews should therefore land bottom-up. When the work crosses repositories, the dependency order between repos is part of the stack description, and each PR body links the others.

Do not split for the sake of small diffs: a split whose PRs cannot be reviewed independently is churn.

## Headless mode

The run is **headless** when `--headless` is passed or there is provably no human in the loop (CI/automation).

- **Never wait for an answer, never fake one.** Take the most defensible option, record it in `## Open Questions` as `assumed (headless)`, and continue.
- **An unresolved spec ambiguity halts.** A plan built on a coin flip the spec left open gets thrown away; report instead.
- **The approval gate is never auto-approved.** Write the plan with `**Status**: draft`, print the path, and halt.
- **Never silently overwrite** an existing `plan.md` — halt instead.
- The quality gate still runs, and its verdicts are still recorded.

## Steps

### 1. Load the spec and its lineage (hard input)

- Read the spec end to end: intent, technical notes and their spikes, error handling, monitoring, **UI/UX specification**, acceptance criteria, assumptions, ambiguity log. The spec's acceptance criteria are the plan's contract.
- **On a UI feature, open the prototype.** The spec's `## UI/UX Specification` — plus `ui-prototype.md` when the spec's header points at one — carries the surfaces and their states, the pattern choices, and the low-fidelity mockups. It is the boundary the scenarios are written at and the reason a task's Files table names the components it does; read it before step 2, not after the tasks are drafted.
- **`## Unresolved Ambiguities` is a gate.** Any entry that would change the shape of the work goes to the human before you plan. Interactive: ask. Headless: halt.
- If there is no spec, do not improvise one — offer `/specs` and stop. (For a change small and obvious enough that a spec is overkill, say so and ask the human to confirm before planning without one.)
- Read the upstream documents the spec cites (`feature-description.md`, `story-map.md`, any `/arm-workshop` output) for the boundary and the target metric — and, on a UI feature, for the journey and its emotional arc, which say which steps the work must not degrade. Do not contradict them.
- Check memory for prior context on this area: `~/.claude/projects/<project-slug>/memory/`, starting from `MEMORY.md`.

### 2. Ground the plan in the codebase

This is most of the work, and it is what makes the plan worth reading. The spec says what must be true; the plan says which lines change, so the plan cannot be written from memory.

- Open every file you intend to name. Read the surrounding module, not just the target function.
- Find the **nearest analogous feature** already in the tree and read it end to end — its routes, its schema or contract definitions, its tests, its translations, its flag wiring. New code imitates it; cite it by path in the tasks.
- Read the tests covering the surface you touch. They tell you the current behavior, the test level the house uses, and where your new tests belong.
- Locate the seams: what is already injectable, what is hard-wired, what needs an Engineer task to open.
- Note the repo's own rules (`CLAUDE.md`, `.claude/rules/`, contributing docs) that constrain how the change may be written.
- Where you are still guessing after reading — a library behaves a certain way, a query performs well enough, a migration is safe on production volumes — **spike it** in a scratch branch or worktree, record `Spike: <question> → <result> (<where it ran>)`, and throw the code away. If a claim stays unverified, write it as `unverified:` and treat it as a risk, not a fact.

### 3. Decide the build order

Sketch the sequence before writing tasks. The order is the plan's real design decision.

- Start with the thinnest path that reaches the observable outcome, then layer the rest. Prefer a walking skeleton over a fully built layer nobody can exercise yet.
- Put the Engineer enablers where they unlock work — the flag first when anything ships dark, the migration before the code that reads the column, the contract or shared type before the two sides that import it.
- Sequence so that **the system is green and shippable after every task**, and user-visible behavior appears only when it is meant to.
- Note where the spec's monitoring rows marked *needs implementation* land: emitting them is work, and it is usually an Engineer task early in the stack, not an afterthought.

### 4. Write the tasks

One task per behavior or enabler, in execution order, each with the full anatomy above and a checkbox in its PR's checklist. Authoring the Gherkin scenarios for each Product task is part of this step — from the spec's acceptance criteria, one scenario per behavior, at the observable boundary.

On a UI feature the prototype is what makes "the observable boundary" concrete — write the steps against the labels, states, and controls it shows, so a scenario cannot drift from the surface that was approved. For the coverage a UI scenario set owes, load the platform skill through the Skill tool (`ux-web-patterns` or `ux-tui-patterns`) and read its acceptance-criteria template: take the **shape** it implies — happy path, error state, empty state, keyboard accessibility — and write your own scenarios from the spec. Do not paste the template's Gherkin, and do not let it introduce a behavior the spec never specified.

Re-read each task asking a single question: *could a competent engineer who has not read this conversation execute it, and could a second person confirm it is done?* If not, the task is not finished being written.

### 5. Propose the PR split

Group the tasks into PRs against the rules above. Produce the stack table — number, branch, base branch, title, what a reviewer gets, and what a tester can verify — and open each PR's section with the checklist of the tasks it contains. Then say, in one line per PR, why that boundary and not a different one. When one PR is genuinely right, say that too, with the reason.

### 6. Rollout, flags, and rollback

Short and concrete: which flag gates the feature and what its default is; the order of enablement (internal, then percentage, then all); which spec monitoring row is the rollout guardrail, with its threshold; how to roll back each PR in the stack, including the migration; and whether any step is irreversible — an irreversible step is called out as such and gets its own verification before it runs.

### 7. Quality gate (hard stop)

Hand the drafted plan, the spec, and repository access to an independent read-only subagent (`subagent_type: "general-purpose"`, do not pin a model). It returns a verdict per item, with specific evidence — file, line, task ID — for every failure. For a large plan, run two in parallel: one on spec conformance and coverage, one on the file-level claims and internal contradictions.

**Spec conformance**

- [ ] Every spec acceptance criterion is covered by at least one Product task.
- [ ] Every task traces to the spec — a Product task to criteria, an Engineer task to the task it unlocks. Nothing implements something the spec does not ask for.
- [ ] No task's acceptance criteria contradict the spec, weaken a stated threshold, or quietly redefine a term.
- [ ] Every user-visible failure mode in the spec's error handling is implemented by a task or explicitly deferred; every monitoring row marked *needs implementation* has a task.

**Files and changes**

- [ ] Every path exists in the repo or is marked `new:` — checked, not assumed.
- [ ] Every described change is consistent with the file's actual current contents, and with the conventions of the analogous feature the task cites.
- [ ] No task's change is already done, already obsolete, or duplicated by another task.
- [ ] Changes that must land together (a contract and its consumers, a rename across repos) are in the same task or the same PR, and their coupling is stated.

**Contradictions and conflicts**

- [ ] No two tasks change the same file in incompatible ways, and no task is invalidated by a later one.
- [ ] Ordering holds: no task depends on something a later task creates; every Engineer task precedes what it unlocks.
- [ ] Feature-flag semantics, names, and defaults are consistent everywhere they appear.
- [ ] The PR stack bases form a real chain, every PR is shippable and reviewable on its own, and each task appears in exactly one PR.

**Verifiability**

- [ ] Every task has 1–3 acceptance criteria, each observable with a pass/fail condition.
- [ ] Every criterion has a verification a second person could run, with an expected result — no "works correctly", no unnamed test suite.
- [ ] Every Product task names automated tests at a level the repo actually uses, and its Gherkin scenarios agree with its acceptance criteria.
- [ ] On a UI feature: every surface and state in the spec's UI/UX specification is claimed by some task's acceptance criteria, or is listed under `## Deferred` — a spec'd surface that appears in no task is the failure this item exists to catch.
- [ ] On a UI feature: every component and path named in the prototype appears in some task's Files table as existing or `new:`, and every Product task touching a surface has its empty-state, error-state, and keyboard scenarios, or a Notes line citing where the spec marked the state not-handled.
- [ ] Nothing rests on manual testing that automation could cover; every genuinely manual check names environment, data, and steps.

Fix blockers and re-run only the failing items (max 2 iterations; then surface the outstanding blockers to the human and ask how to proceed). Record the verdicts in the plan.

### 8. Persist and present for approval (hard stop)

Write to the location configured for plans at the user or project scope. If none is configured, write **alongside the spec** — `plan.md` in the same `<TICKET>_<slug>/` directory — so the description, the spec, and the plan sit together. Create the directory if missing. If the file exists, ask before overwriting (headless: halt).

Print the path, show the human the task list, the PR stack, and the open questions, and ask them to approve or request changes. **Only on explicit approval** set `**Status**: approved`. Then stop: name `/build` — the implementation phase — as what comes next, and do not start it.

## Document template

````markdown
# Plan: <Feature Name>

**Ticket**: <ABC-123 | none>
**Created**: <date>
**Status**: draft
**Spec**: `spec.md` (sibling in this directory)
**Base branch**: <develop | main>
**PRs**: <n> stacked

## Approach
<!-- One or two paragraphs: how this gets built, in what order, and why that order. -->

## PR Stack
| # | Branch | Base | Title | What a reviewer gets | What a tester can verify |
|---|---|---|---|---|---|
<!-- One line per PR on why that boundary. Stacked: each PR branches off the previous one's head and merges in order. -->

## Tasks

<!-- Each PR opens with its checklist — that is the implementation's state — then one detail block per task. -->

### PR 1 — <title> (`<branch>` off `<base>`)

- [ ] **E1** — <title> · Engineer Task
- [ ] **P2** — <title> · Product Task

#### E1 — <title>

**Type**: Engineer Task
**Why**: <one line — unlocks P2>
**Spec refs**: <AC-2 | technical note "…" | unlocks P2>

**Files**:

| Path | Change | What |
|---|---|---|

**Acceptance criteria**:

- [ ] <observable, pass/fail>
- [ ] <observable, pass/fail>

**Verification**: <command / query / steps → expected result, per criterion>

**Automated tests**:

| Test file | Level | Asserts | Command |
|---|---|---|---|

**Test plan**: <environment, preconditions, numbered steps, expected result | none — covered by the tests above>
**Notes**: <ordering, flag state, reversibility>

#### P2 — <title>

**Type**: Product Task
**Why**: <the user-visible outcome>
**Spec refs**: <AC-3, AC-4>

**Files**: <table as above>

**Scenarios**:

```gherkin
Scenario: <name>
  Given <observable precondition>
  When <the user or client does X>
  Then <observable outcome>
```

**Acceptance criteria**: <1–3 checkboxes, as above>

**Verification**: <as above>

**Automated tests**: <table as above>

**Test plan**: <as above>

### PR 2 — <title> (`<branch>` off `<PR 1 branch>`)
<!-- … -->

## Rollout and Rollback
<!-- Flag and default, enablement order, the guardrail metric and its threshold, how to roll back each PR, anything irreversible. -->

## Deferred
<!-- Work deliberately left out: what, why, and where it should go instead. -->

## Risks
| Risk | Task | Mitigation / what would tell us early |
|---|---|---|

## Open Questions
| Question | Blocks | Assumption taken | Resolved by |
|---|---|---|---|
<!-- Resolved by: inference | human | assumed (headless) -->

## Quality Gate
<checklist above, with verdicts>

## Evidence
<!-- Every file read, test run, spike, dashboard, and document consulted. A reader must be able to re-check any claim. -->
````

## Using the plan during implementation

The plan is live state, and treating it as such is the point of the checkboxes.

- Check a task's box only when its acceptance criteria are checked and their verification has actually been run — not when the code is written.
- One task is normally one commit, and one PR is the set of tasks the stack table assigns to it.
- When reality contradicts the plan — a file is not where you thought, a task turns out to be two — **amend the plan and note what changed**, then continue. Silent drift destroys the document's value as memory.
- If the change no longer matches the spec, that is a spec conversation, not a plan edit.

## Running this phase by hand (no skill)

The artifact matters, not the automation. A human doing this manually: read the approved spec and then read the code it touches, including the nearest feature that already does something similar; decide the order that keeps the system shippable after every step; write down the small steps, each naming the files it changes, the test that will go red first, and the one command that proves it works; mark which steps are plumbing and which are the behavior the user asked for; group them into pull requests a colleague could review without reading the next one; and hand the whole thing to someone else to look for the paths that do not exist and the two steps that contradict each other. The discipline that carries the value is refusing to name a file you have not opened, and refusing to write an acceptance criterion you cannot say how to check.
