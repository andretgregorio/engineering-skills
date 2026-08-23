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
| Acceptance criteria | Observable outcomes with pass/fail conditions |

Its value is **resolving ambiguity with a human before build starts** — not synthesizing edge cases. Gherkin scenarios are authored later, per slice, in `/plan`. Spikes are allowed and are documented; their code never reaches the base branch.

```
/specs "<feature name or path to feature-description.md>" [--ticket <ID>] [--headless]
```

### `/plan` — implementation plan

*[Skill README →](skills/plan/README.md)*

Produces `plan.md`: an ordered checkbox todo list where each task is classified **Engineer** or **Product**, carries 1–3 verifiable acceptance criteria, names the exact files it changes, its automated tests and its test plan — grouped into a stack of independently reviewable PRs.

The plan is also the implementation's memory. Every task and criterion is a checkbox, so a fresh session can pick the work up mid-flight without re-deriving it. It passes a spec-conformance quality gate before it is presented, and stops before any code is written.

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

### `/open-pr`

*[Skill README →](skills/open-pr/README.md)*

Opens **one** PR for a branch that is already finished and pushed. It fills the repository's own template when there is one — headings, order, and checklists preserved — and a built-in template otherwise.

Deliberately small, and strict about evidence: every check result and verification step in the body must be something that actually ran. It never merges, never invents reviewers, never puts secrets in a body, and never opens a second PR for a branch that already has one. **A repository's own open-PR skill always wins over this one.**

```
/open-pr <branch> [--base <branch>] [--draft] [--repo <path>] [--plan <plan.md>]
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

## Agents

Each agent directory carries its own README with purpose, boundaries, and input/output contract.

### Implementation

| Agent | Model | Summary |
|---|---|---|
| [`tdd-developer`](agents/tdd-developer/README.md) | sonnet | Implements one planned task at a time inside an assigned worktree, test first, exactly one commit per task. Never creates branches, pushes, or opens PRs — it reports `blocked` when the plan and the codebase disagree. |
| [`pr-monitor`](agents/pr-monitor/README.md) | sonnet | Takes one open PR to *ready for human review*: every check green, every automated finding applied or answered, every changes-requested review addressed or justified. Never merges, approves, or disables a test to get green. |

### Judging and review

| Agent | Model | Summary |
|---|---|---|
| [`plan-conformance-judge`](agents/plan-conformance-judge/README.md) | opus | Read-only. Per task: `conforms`, `deviates`, or `unverifiable`, each with `path:line` evidence. Judges conformance, not craft; never proposes the fix — whether the plan or the code is wrong is the human's call. |
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
