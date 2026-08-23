# Build Skill

Phase 4 of the Spec Driven Development workflow, and the first that writes production code. Executes **one approved plan**: every task becomes one commit, every PR in the stack is opened as soon as its branch is finished, and the plan is updated as it goes so a fresh session can pick the work up mid-flight.

```
/build [--plan-file <plan_file>] [--ticket <ID>] [--no-auto] [--no-stack] [--headless]
```

The plan is the contract. The commits, branches, and PRs are the output. The plan's checkboxes are the record.

## Who does what

**The skill orchestrates; it does not write production code.**

| | Orchestrator (`/build`) | `tdd-developer` (one per repo) |
|---|---|---|
| Unit of work | The whole build | One PR's branch |
| Production code and tests | Never | Yes, test first |
| Commits | Never | One per task, after that task's yellow gate |
| Worktrees, branches, rebases, pushes, PRs | Yes | Never |
| Yellow-gate reviews | Runs them | Pauses and receives the findings |
| Conformance judging | Via `plan-conformance-judge` | Never |
| Ticks the plan | Yes | Never |
| Talks to the human | Every halt and checkpoint | Reports `blocked` upward instead |

## The cycle: red → green → yellow → commit

The yellow phase is not "tidy up if you feel like it" — it is a gate with four independent opinions, and it runs **after every green**:

| Reviewer | Asks |
|---|---|
| `clean-coder-reviewer` | Is this readable and maintainable? |
| `code-smell-detector` | Which smells did this introduce? |
| `test-design-reviewer` | Do these tests document behavior — atomic, isolated, repeatable? |
| `/test-mutation` | Would these tests actually catch the bug — which mutants survive? |

Findings split into **blockers** (fixed before the commit) and **notes** (recorded, not built). Rules that keep it honest: no commit before its yellow gate; **a surviving mutant is a test defect** — never kill it by weakening the code; the gate reviews the task's diff, not the repo, so findings about untouched code are notes, never blockers.

The reviews are run by the orchestrator rather than the author on purpose — and because a subagent cannot report mid-flight, the pause at green is also what puts the turn boundary exactly where the worktree needs to be stable.

## The gates

- **Preflight** — a hard gate before any code: plan approved and internally consistent, repos and base branches fetched, every agent and the `/test-mutation` skill available, the open-PR path and worktree layout and force-push policy decided *per repo with evidence*, `gh-stack` probed for, bootstrap clean, **baseline suite green**, verification commands present, and the CI-parity list derived from each repo's actual CI config.
- **CI parity** — before a branch is declared ready, the implementer runs the checks CI will run, scoped to what the branch touched. A silent skip reads as a pass, so skips are named with their reason. `terraform apply` is not a check.
- **The judge** — `plan-conformance-judge`, read-only and independent, runs the moment a branch report arrives, **before anything is ticked or pushed**. `deviates` or `unverifiable` is a halt to the human; the implementer never gets to "just fix it", because which side is wrong — plan or code — is the human's call.
- **Exit gate** — completeness, git and PRs, and record, verified before the build is reported finished.

## Halting

The plan was written from a reading of the code; the code is what is actually true. When they disagree, **stop and ask** — always, not "when it looks significant". A missing path, an unverifiable criterion, a test that is already green, a task that turns out to be two, a moved base branch, a plan that is not `approved`. A build that quietly adapts destroys the plan's value as a record and hides a decision nobody agreed to.

Halts are presented evidence-first, with a recommendation and the cost of each option, and the decision is recorded in the plan's `## Build Log` under `Drift`.

## After each branch

The PR is opened the moment its branch is finished — through the repository's own PR skill if it has one, otherwise [`/open-pr`](../open-pr/README.md) — and a `pr-monitor` is spawned on it unconditionally, in its own worktree. So a finished branch is being driven to green while the implementer is already writing the next one. Every monitor push moves the base of the PR above it; **restacking the children is the orchestrator's job, at a turn boundary**, never the monitor's.

Nothing is merged, approved, deployed, or enabled. `ready` is a handoff to a person, not a green light.

## Modes

| Flag | Effect |
|---|---|
| *(default)* | Auto — no stopping at task boundaries, still halts on drift. Stacked per the plan's PR table |
| `--no-auto` | Every task boundary is a human checkpoint; the implementer is dispatched one task at a time |
| `--no-stack` | Collapse the stack: one branch and one PR per repo, task order and one-commit-per-task unchanged |
| `--headless` | Degraded mode — drift halts the run, PRs open as drafts. Contradictory with `--no-auto` |

## Next

Review the stack bottom-up, merge in order, then the plan's rollout steps. The skill stops there.

Full definition: [`SKILL.md`](SKILL.md), including the workspace layout, stack mechanics, the concurrency handoff, the Build Log blocks, and the final report template. Running the phase by hand is described at the end of it.
