# software-engineering-skills

Skills and subagents for the full path from "someone asked for a feature" to "a stack of reviewable PRs is green" — with a human approval gate at every phase boundary.

Installed from the [`andretgregorio`](../../README.md) marketplace:

```
/plugin marketplace add andretgregorio/engineering-skills
/plugin install software-engineering-skills@andretgregorio
```

---

## Spec Driven Development

Four skills, one document each, handed forward in order. Every phase ends by presenting its document and stopping — none of them auto-continues into the next.

### `/product-analysis` — product analysis

*[Skill README →](skills/product-analysis/README.md)*

Produces `feature-description.md`: business goals with measured baselines, how the system behaves today, narrative use-case scenarios, scope boundaries (in / out / deferred), technical constraints, assumptions, and an ambiguity log.

Describes **behavior, never implementation**. "We'll add a table" means you have left the skill's scope — record the constraint that pushed you there instead. Every claim about today's behavior or numbers cites its source, or is written as `unverified:` with what would confirm it.

When the feature touches anything a person sees or operates, step 5 loads the design skills and adds the journey and its **emotional arc** — product intent that is not recoverable later from a spec that never asked. Mockups and pattern choices are deliberately left to `/specs`.

Use it when a customer-facing behavior has been requested but the intent, success metrics, or scope still need clarification.

```
/product-analysis "<feature description>" [--ticket <ID>] [--headless]
```

### `/specs` — specification

*[Skill README →](skills/specs/README.md)*

Produces `spec.md` from the feature description: intent, technical notes, error handling, monitoring, acceptance criteria, assumptions, ambiguity log, and rejected alternatives with the reasoning behind each rejection.

| Artifact | Purpose |
|---|---|
| Intent | What the change achieves and why |
| Technical notes | Where the change fits; components, interfaces, dependencies, constraints |
| Error handling | Anticipated failures, user impact, mitigation |
| Monitoring | What to watch during rollout, per metric |
| UI/UX specification | Surfaces and their states, pattern choices, a low-fidelity prototype, an integration check |
| Acceptance criteria | Observable outcomes with pass/fail conditions |

Its value is **resolving ambiguity with a human before build starts** — not synthesizing edge cases. Gherkin scenarios are authored later, per slice, in `/plan`. Spikes are allowed and are documented; their code never reaches the base branch.

On a UI feature, step 6 loads the platform pattern skill and prototypes the surface at low fidelity: every surface declares its populated, empty, loading and error states, every pattern choice names the alternative it beat, and the accessibility criteria carry numbers rather than intentions. Beyond two surfaces the mockups move to a `ui-prototype.md` sibling, approved together with the spec.

```
/specs "<feature name or path to feature-description.md>" [--ticket <ID>] [--headless]
```

### `/plan` — implementation plan

*[Skill README →](skills/plan/README.md)*

Produces `plan.md`: an ordered checkbox todo list where each task is classified **Engineer** or **Product**, carries 1–3 verifiable acceptance criteria, names the exact files it changes, its automated tests and its test plan — grouped into a stack of independently reviewable PRs.

The plan is also the implementation's memory. Every task and criterion is a checkbox, so a fresh session can pick the work up mid-flight without re-deriving it. It passes a spec-conformance quality gate before it is presented, and stops before any code is written.

On a UI feature the spec's UI/UX specification and its prototype are **hard inputs**: scenarios are written against the surface that was approved, a Product task touching a surface owes empty-state, error-state and keyboard scenarios, and two gate items catch the leaks — a spec'd surface claimed by no task, and a prototype component in no Files table.

```
/plan [--spec-file <spec_file>] [--ticket <ID>] [--headless]
```

### `/build` — execution

*[Skill README →](skills/build/README.md)*

The first phase that writes production code. For each repository it sets up a worktree and dispatches one `tdd-developer` subagent, which builds one PR branch at a time.

Per task: **red → green → yellow → commit**.

- **Red** — the named test at the named level, observed failing for the right reason.
- **Green** — the simplest implementation that satisfies it. The implementer then *pauses*.
- **Yellow** — the orchestrator fans out four independent reviews on that diff: `clean-coder-reviewer`, `code-smell-detector`, `test-design-reviewer`, and the `/test-mutation` skill. The implementer refactors against the findings.
- **Commit** — one commit per task, naming the task ID, the criteria it satisfies, and its yellow-gate result.

The reviews are run by the orchestrator rather than the author on purpose: an agent that just spent an hour on a diff is the reader least able to see what is wrong with it.

When a branch is finished, `plan-conformance-judge` checks it against the plan **before** anything is ticked, pushed, or opened. Then the PR is opened — through the repository's own PR skill if it has one, otherwise `/open-pr` — and a `pr-monitor` is spawned to drive it to ready-for-human-review while the next branch is already being written.

Division of labour:

| | Orchestrator (`/build`) | `tdd-developer` |
|---|---|---|
| Unit of work | The whole build | One PR's branch |
| Production code and tests | Never | Yes, test first |
| Commits | Never | One per task, after its yellow gate |
| Worktrees, branches, pushes, PRs | Yes | Never |
| Yellow-gate reviews | Runs them | Receives the findings |
| Conformance judging | Via `plan-conformance-judge` | Never |
| Talks to the human | Every halt and checkpoint | Reports `blocked` upward instead |

`/build` **stops and asks the human whenever reality contradicts the spec or the plan** — it never routes around a wrong document.

```
/build [--plan-file <plan_file>] [--ticket <ID>] [--no-auto] [--no-stack] [--headless]
```

### Headless mode

Every workflow skill accepts `--headless` (and infers it when there is provably no human in the loop). It is a **degraded mode, not an equivalent one**: unresolved questions get the most defensible assumption, recorded as `assumed (headless)` and listed under Unresolved Ambiguities; genuine coin flips halt rather than guess; approval gates are never auto-approved; existing documents are never silently overwritten.

---

## Standalone skills

### `/loop`

*[Skill README →](skills/loop/README.md)*

One decision: **which loop runs this document**, then it hands over and stops. A design document, story map or release plan whose delivery is sliced goes to `/delivery-loop`; an approved plan that orders its PRs goes to `/implementation-loop`.

It classifies from the document's **content**, never its filename — `plan.md` is routinely a design doc — and names the signals that decided it. A spec with nothing downstream, an unsliced design doc, or a plan still marked `draft` is not routed at all: each has a named next step, and routing a document that is not ready is how a queue spends its first night guessing. Two plausible readings is one question to the human, never a coin flip.

Not to be confused with the **built-in** `/loop`, which runs a prompt on a recurring interval. This one takes a document; an invocation starting with an interval or a slash command is handed back to the built-in.

```
/loop [<path to a design doc, story map or plan>] [--ticket <ID>] [<flags passed through>]
```

### `/delivery-loop`

*[Skill README →](skills/delivery-loop/README.md)*

Turns **a sliced delivery** — a design document, story map or release plan — into a queue that specifies, plans and builds itself. Where `/implementation-loop` starts from a finished plan, this starts one phase earlier: per unit, a spec through `/specs`, a plan through `/plan`, then **one row per pull request that plan proposes** — one agent building every task of that PR as its own commit through `/build`, and opening the PR at the end of it.

- **Three levels, one document boundary.** A **slice** is a releasable increment from the source's slicing; a **unit** is one rib or sliced item — the smallest thing `/specs` accepts, and therefore one spec and one plan; a **PR** is one pull request of that plan's stack, every task in it one commit. The slice → unit split is confirmed with the human before anything is written.
- **The board grows itself.** Build rows cannot exist before the plan that decides them, and a guessed row would disagree with the plan the builder actually reads — so each PLAN row appends its own successors, one per plan PR listing that PR's task IDs, in the same locked edit that completes it. Nothing split, nothing merged, no task on no row.
- **A pull request is one sitting.** The PR is the unit of scheduling because it is the unit of review: the same agent writes the first commit and opens the PR, with the branch checks and the conformance judge in between. A row that has not opened its PR is not done.
- **One worktree per PR branch**, created by that PR's row and never handed on. A path or branch sitting where a row's must go, and not in the ledger as that row's, is a Human review — never a `checkout`, `stash` or `reset` past someone's work.
- **The stack shortens when the human merges.** Each branch's cut-from is resolved when its worktree is created: a unit's first PR comes off `<base branch>` if the earlier units are merged, otherwise off the last branch in the ledger, with the evidence recorded.
- **The open-PR cap is part of the authorization** (default 4). A row whose PR would exceed it stops and asks — a delivery loop that outruns its reviewer is not delivering anything.
- **Releases stay human.** A Release plan carries each slice's outcome, flag, guardrail metric and release gate; agents mark a slice `delivered — awaiting the human` and never clear a gate.

```
/delivery-loop [--design-doc <path>] [--story-map <path>] [--ticket <ID>] [--slices <ids>] [--cadence <minutes>] [--stages spec,plan,code|plan,code] [--max-open-prs <n>] [--no-schedule] [--headless]
```

### `/implementation-loop`

*[Skill README →](skills/implementation-loop/README.md)*

Turns **one approved plan that orders its PRs** into a queue that builds itself — the unattended alternative to running `/build` in one live session. It writes a single markdown queue file, gets the human's approval, schedules a recurring tick, and stops; every tick starts a fresh agent that claims the one `READY` row, does it, and readies the next.

- **Per PR, SPEC → PLAN → CODE** through `/specs`, `/plan` and `/build` — or **CODE-only** when the source is already an approved `/plan` with buildable tasks.
- **Serial by construction**: at most one row is ever `READY`, a directory lock guards each board edit, and a row stalled past the reclaim window is continued from its partial output, never restarted.
- **Every CODE task creates its own worktree** from the remote tip of its base and keeps it as that PR's home. Worktrees are never reused — a shared one accumulates uncommitted state nobody owns, which the next agent either ships unknowingly or stops the queue over.
- **Two channels to the human.** A question that can proceed on a stated assumption is a row in *Decisions awaiting the human* and the queue keeps moving. A conflict that makes the work wrong either way is a **Human review** block — context, the conflict with evidence, options with one recommended, what was left in place, and an empty space for the answer — and the queue stops. The human writes the answer and flips the block to `ANSWERED`; the next tick resumes the task from there.
- **Nothing outward-facing beyond the standing authorization** the human approved: the named branches pushed, the named PRs opened. Never a merge.

```
/implementation-loop [--plan-file <path>] [--ticket <ID>] [--cadence <minutes>] [--stages spec,plan,code|code] [--no-schedule] [--headless]
```

### `/spike-investigation`

*[Skill README →](skills/spike-investigation/README.md)*

Answers **one falsifiable question about the code that reading the code cannot answer**: can this behavior be built here, by what route, and at what cost — by writing the acceptance criteria as executable assertions first, then hacking the throwaway version until they pass against the real running application.

The report is the deliverable; the code is scaffolding. "I read a lot of files and it looks feasible" is exactly the outcome the skill exists to prevent — something has to run, and it has to be able to say no.

- **Every repository the behavior touches is in the spike.** The seam between repos is where these questions usually die, so a cross-repo spike whose probe exercises one side only ends `inconclusive`, not `proven`.
- **The question becomes acceptance criteria before it becomes code.** Action, observation, expected value — the expected value derived from the requirement and never fitted to what a run produced, each criterion naming the wrong answer it rules out, and combinations of dimensions covered in both orders.
- **Every criterion goes red on the baseline first.** Same script, run against unmodified code and observed red for the right reason, then run unchanged against the spike and observed green. Two captured outputs from one script is the artifact. A criterion that was green all along is not a finding of "already works" — it is an assertion that has not shown it can fail, and until it does it is reported as unproven.
- **Always start from the freshly fetched remote integration branch**, and read every fact from the worktree rather than a canonical checkout that may be behind.
- **The timebox is a hard stop, not a target.** Two hours by default, estimated after recon and before hacking. Over the box means going back to the human with concrete narrowing options — attack the riskiest unknown alone, stub the far side of the seam, shrink the path but keep the proof end-to-end — not starting a run that will not finish.
- **Ugly is allowed; dishonest is not.** Hardcode, copy-paste, ignore the linter, skip the types. Never a probe that asserts on a value the spike itself hardcoded, never a write to a shared database or queue, never a disabled test to get the app to boot.
- Ends `proven`, `proven with caveats`, `disproven`, or `inconclusive`, bound to the criteria: `proven` needs every criterion green **and** every one shown able to fail. **`disproven` is a result** — often the more expensive one to obtain.

When the report is written and **before anything is destroyed**, a [`spike-conformance-judge`](agents/spike-conformance-judge/README.md) checks it against the user's original request, verbatim. That order is the point: its strongest check is re-running the probe itself, which only exists while the worktrees do. `falls short` on **goal fidelity** — a right answer to a question that quietly got easier — is the failure the gate exists for, and it is never fixed by rewording the report; `falls short` on **the criteria could have failed** is the one that hides inside a green run. Only then are the worktrees destroyed, the diff surviving as a patch appendix.

The report carries the goal, the result, the per-criterion table with how each one was shown able to fail, the approach *including the routes that failed*, the raw evidence, a per-repo effort estimate with everything the real version needs that the spike skipped, the risks, and the notes that stop the next person rediscovering them. `/specs` and `/plan` both hand off to it when a claim is bigger than their own hour-long spike protocol.

```
/spike-investigation "<question or behavior>" [--repos <path,path>] [--timebox <hours>] [--ticket <ID>] [--headless]
```

### `/open-pr`

*[Skill README →](skills/open-pr/README.md)*

Opens **one** PR for a branch that is already finished and pushed. It fills the repository's own template when there is one — headings, order, and checklists preserved — and a built-in template otherwise.

Deliberately small, and strict about evidence: every check result and verification step in the body must be something that actually ran. It never merges, never invents reviewers, never puts secrets in a body, and never opens a second PR for a branch that already has one. **A repository's own open-PR skill always wins over this one.**

```
/open-pr <branch> [--base <branch>] [--draft] [--repo <path>] [--plan <plan.md>]
```

### `/monitor-pr`

*[Skill README →](skills/monitor-pr/README.md)*

Takes **one** open PR the rest of the way — to **merged**. Where `/open-pr` opens and stops, and `pr-monitor` reaches *ready for human review* and stops, this skill waits for the review, settles what it asks for, and merges.

**Mergeable has an exact definition:** every CI check on the PR's current head is green, **and** an approving code review stands on that same head, **and** every review finding is implemented or answered, **and** GitHub reports no conflicts. All four, on the same commit, at the same moment.

The review **always comes** — even when it is one word saying *approved* — so an absent review is never a reason to merge, only a reason to keep waiting. Every finding gets one of two responses: implemented, or answered with evidence (`path:line`, the guard that exists, the test that covers it). If that justification cannot be written convincingly, the finding was right.

Its gate is stricter than GitHub's. An approving review counts **only if it was submitted against the current head SHA**, checked via `commit.oid` rather than the `reviewDecision` field — which stays `APPROVED` across new pushes unless the repo enables dismiss-stale-reviews. Push a fix after an approval and the gate shuts again.

It dispatches a [`pr-monitor`](agents/pr-monitor/README.md) for the repairs and keeps the merge decision for itself: the thing that fixes the code is deliberately not the thing that decides the code is good enough to ship. It never approves its own PR, never disables a test to get green, and never merges with `--admin` or past a protection rule — a refusal from GitHub is a halt, not a retry.

The wait runs under the built-in `/loop` skill in dynamic mode, self-paced. Nothing moving for three checks earns one `waiting` report naming who owes what; two hours earns `blocked`.

```
/monitor-pr <owner/repo> <pr-number> [--merge-method squash|merge|rebase] [--repo-path <path>]
```

### `test-mutation`

*[Skill README →](skills/test-mutation/README.md)*

Mutation testing patterns for verifying test effectiveness — the difference between "my tests execute this code" and "my tests would notice if this code were wrong". Used as one of the four yellow-gate checks in `/build`, and on its own when analysing branch code for weak or missing tests.

### `/arm-workshop`

*[Skill README →](skills/arm-workshop/README.md)*

Facilitates a collaborative technical investigation using a team of specialist agents, following Thoughtworks' **Architectural Risk Management** methodology. Agents discuss and challenge each other's alternatives, interrogate the human about business strategy and constraints, run **risk storming** to surface architectural fragilities, and document the decision with C4 Container diagrams — all before any implementation is committed to.

Reference material lives in [`skills/arm-workshop/references/`](skills/arm-workshop/references/): ARM methodology, risk storming, C4 container diagrams, design trade-offs, document structure.

```
/arm-workshop [problem-description-or-feature-name]
```

### `/user-story-mapping-workshop`

*[Skill README →](skills/user-story-mapping-workshop/README.md)*

Story maps organised spatially by activity and priority, sliced into releases by outcome. Backbone (activities), ribs (tasks by detail), walking skeleton (the thinnest end-to-end flow across *all* activities — not an MVP), then release slices. After Jeff Patton, with outcome-based prioritization from Gothelf/Seiden and riskiest-assumption-first from Maurya.

---

## Design and UX reference skills

Five **reference skills**: not user-invocable and never invoked directly, they are loaded through the Skill tool by the two refining phases above. Splitting them this way keeps the design vocabulary out of every context that does not need it.

| Skill | Loaded by | For |
|---|---|---|
| [`design-methodology`](skills/design-methodology/README.md) | `/product-analysis` (Phases 1–2) · `/specs` (Phases 3–4) | Apple LeanUX++ workflow, journey schema, named emotional arc patterns, clig.dev CLI principles |
| [`ux-principles`](skills/ux-principles/README.md) | both, always on a UI feature | Nielsen's heuristics, Norman's principles, Fitts/Hick/Miller, progressive disclosure, WCAG 2.2 AA minimums, review checklist |
| [`ux-emotional-patterns`](skills/ux-emotional-patterns/README.md) | both | Walter's hierarchy, surface vs deep delight, empty states, first-run onboarding, tone of voice, microinteractions |
| [`ux-web-patterns`](skills/ux-web-patterns/README.md) | `/specs` · `/plan`, by platform | Navigation, forms and validation, data display, responsive breakpoints, motion, design tokens, anti-patterns |
| [`ux-tui-patterns`](skills/ux-tui-patterns/README.md) | `/specs` · `/plan`, by platform | Argument and subcommand design, TUI architectures, colour and output contracts, error and help text, progress |

Two boundaries hold across all five, because their source material predates this pipeline: **their own output paths and timeboxes do not apply** — the calling skill's persist step decides where anything is written — and **their Gherkin is never pasted**. `ux-web-patterns` ships a Gherkin acceptance-criteria template whose one legitimate reader is `/plan` step 4, and only for the coverage shape it implies: happy path, error state, empty state, keyboard accessibility.

---

## Agents

Each agent directory carries its own README with purpose, boundaries, and input/output contract.

### Implementation

| Agent | Model | Summary |
|---|---|---|
| [`tdd-developer`](agents/tdd-developer/README.md) | sonnet | Implements one planned task at a time inside an assigned worktree, test first, exactly one commit per task. Never creates branches, pushes, or opens PRs — it reports `blocked` when the plan and the codebase disagree. |
| [`pr-monitor`](agents/pr-monitor/README.md) | sonnet | Takes one open PR to *ready for human review*: every check green, every automated finding applied or answered, every changes-requested review addressed or justified. Never merges, approves, or disables a test to get green — merging is [`/monitor-pr`](skills/monitor-pr/README.md), which dispatches this agent for the repairs. |

### Judging and review

| Agent | Model | Summary |
|---|---|---|
| [`plan-conformance-judge`](agents/plan-conformance-judge/README.md) | opus | Read-only. Per task: `conforms`, `deviates`, or `unverifiable`, each with `path:line` evidence. Judges conformance, not craft; never proposes the fix — whether the plan or the code is wrong is the human's call. |
| [`spike-conformance-judge`](agents/spike-conformance-judge/README.md) | opus | Read-only. Did the spike answer *the question that was asked*, and prove it — with criteria that could have failed? Nine dimensions, `meets` / `falls short` / `unverifiable`, run before the worktrees are torn down so it can re-run the probe itself. Never continues the spike, never reviews spike code for craft. |
| [`clean-coder-reviewer`](agents/clean-coder-reviewer/README.md) | sonnet | Readability, maintainability, expressiveness — *Clean Code*, SOLID, and *The Pragmatic Programmer*, including the nuance that a bigger well-written function beats fragmented micro-functions. Review-only. |
| [`code-smell-detector`](agents/code-smell-detector/README.md) | sonnet | 10 smell categories and 50+ distinct smells from the [Luzkan catalog](https://github.com/Luzkan/smells) — bloaters, change preventers, couplers, dispensables, OO abusers, obfuscators, and the rest. Detection-only. |
| [`test-design-reviewer`](agents/test-design-reviewer/README.md) | opus | Scores tests against Dave Farley's properties of good tests, returning a Farley Score. Catches the isolation and repeatability violations behind flaky CI. Worked examples for both a high- and a low-scoring suite live in its `examples/`. |

### Requirements

| Agent | Model | Summary |
|---|---|---|
| [`scenario-story-writer`](agents/scenario-story-writer/README.md) | sonnet | Vivid narrative scenarios grounded in place, time pressure, device, emotion, and stakes — plus diagnostic and error scenarios with contextual, actionable messages. Never writes "As a \<role\> I want…". |

The reviewing and judging agents are read-only: `clean-coder-reviewer` and `plan-conformance-judge` restrict `tools` to `Read`, `Grep`, `Glob`, and `Bash` in their frontmatter, and every one of them repeats the constraint at the top of its prompt.

---

## Layout

```
.claude-plugin/plugin.json       manifest — name, version, license
skills/<name>/SKILL.md           skill definition; long material in references/
skills/<name>/README.md          human-facing docs for that skill
agents/<name>/<name>.md          agent definition (frontmatter + system prompt)
agents/<name>/README.md          human-facing docs for that agent
agents/<name>/references/        detail loaded on demand
agents/<name>/templates/         output templates
agents/<name>/examples/          worked before/after examples
```

Skills and agents load their `references/` on demand rather than inlining them, which keeps each definition readable and its context cost proportional to the job at hand.
