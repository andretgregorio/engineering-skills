# engineering-skills

A personal [Claude Code](https://claude.com/claude-code) plugin marketplace holding one plugin — **`software-engineering-skills`** — a set of skills and subagents for building software the disciplined way: describe the feature, specify it, plan it, then build it test-first with review gates and an independent conformance judge before anything is called done.

The through-line is **Spec Driven Development**: four skills that hand one document to the next, each ending at a human approval gate, plus the agents that do the writing, reviewing, and judging along the way.

## Install

```
/plugin marketplace add andretgregorio/engineering-skills
/plugin install software-engineering-skills@andretgregorio
```

Then restart Claude Code. The skills appear as slash commands (`/specs`, `/plan`, `/build`, …) and the agents become available to the `Task` tool.

To update later:

```
/plugin marketplace update andretgregorio
```

## The Spec Driven Development workflow

Each phase produces one document, stops for human approval, and refuses to do the next phase's job. Nothing writes production code until `/build`.

```
/product-analysis  →  /specs  →  /plan  →  /build
feature-              spec.md     plan.md    branches, commits,
description.md                               stacked PRs
```

| Phase | Skill | Produces | Hard stop |
|---|---|---|---|
| 1. Product analysis | `/product-analysis` | `feature-description.md` — business goals with measured baselines, current behavior, use-case scenarios, scope boundaries, technical constraints, and on a UI feature the journey and its emotional arc | Consistency gate, then human approval |
| 2. Specification | `/specs` | `spec.md` — intent, technical notes, error handling, monitoring, acceptance criteria, ambiguity log, and on a UI feature the surfaces, states, pattern choices and a low-fidelity prototype | Consistency gate, then human approval |
| 3. Planning | `/plan` | `plan.md` — ordered checkbox tasks with acceptance criteria, files, tests and verification, grouped into a stack of reviewable PRs; Gherkin scenarios written against the approved surface | Spec-conformance gate, then human approval |
| 4. Build | `/build` | One worktree per repo, one commit per task, one PR per stack entry | Halts whenever reality contradicts the spec or the plan |

When a feature touches a user-facing surface, five **design and UX reference skills** carry the vocabulary through the pipeline — journey and emotional arc in phase 1, prototype and pattern choices in phase 2, scenario coverage in phase 3. They are model-loaded, not slash commands.

Two rules hold across all four: **ambiguity is surfaced, never absorbed** — anything two reasonable people would decide differently goes to the human — and **evidence is never invented** — an unverified claim is written as `unverified:` with what would confirm it.

Each skill also documents how to run its phase by hand, without the skill.

## What's inside

### Skills

| Skill | What it does |
|---|---|
| [`product-analysis`](plugins/software-engineering-skills/skills/product-analysis/README.md) | Product/business description of a feature before any technical spec exists |
| [`specs`](plugins/software-engineering-skills/skills/specs/README.md) | Specification artifacts for one feature, with ambiguity resolved against a human |
| [`plan`](plugins/software-engineering-skills/skills/plan/README.md) | Turns an approved spec into an ordered task list and a proposed PR stack |
| [`build`](plugins/software-engineering-skills/skills/build/README.md) | Executes an approved plan — worktrees, TDD subagents, yellow-phase review gate, conformance judge, stacked PRs |
| [`spike-investigation`](plugins/software-engineering-skills/skills/spike-investigation/README.md) | Answers one falsifiable "can we build this here" question by hacking the throwaway version and proving it against the real running app — timeboxed, every repo involved, code discarded, report kept |
| [`open-pr`](plugins/software-engineering-skills/skills/open-pr/README.md) | Opens one PR for a finished branch, filling the repo's own template. Loses to a repo's own open-PR skill |
| [`test-mutation`](plugins/software-engineering-skills/skills/test-mutation/README.md) | Mutation testing patterns for checking whether tests actually catch bugs |
| [`arm-workshop`](plugins/software-engineering-skills/skills/arm-workshop/README.md) | Collaborative technical investigation with agent teams — ARM methodology, risk storming, C4 container diagrams |
| [`user-story-mapping-workshop`](plugins/software-engineering-skills/skills/user-story-mapping-workshop/README.md) | Story maps and outcome-based release slicing |

### Design and UX reference skills

Not user-invocable — the refining phases load them through the Skill tool when the feature touches a user-facing surface, and `/plan` loads the platform one for the coverage a UI scenario set owes.

| Skill | Loaded by | What it carries |
|---|---|---|
| [`design-methodology`](plugins/software-engineering-skills/skills/design-methodology/README.md) | `/product-analysis` (journey + arc) · `/specs` (prototype + integration check) | Apple LeanUX++ workflow, journey schema, emotional arc patterns, clig.dev CLI principles |
| [`ux-principles`](plugins/software-engineering-skills/skills/ux-principles/README.md) | both | Nielsen, Norman, Fitts/Hick/Miller, progressive disclosure, WCAG 2.2 AA minimums |
| [`ux-emotional-patterns`](plugins/software-engineering-skills/skills/ux-emotional-patterns/README.md) | both | Walter's hierarchy, empty states, first-run onboarding, tone of voice, microinteractions |
| [`ux-web-patterns`](plugins/software-engineering-skills/skills/ux-web-patterns/README.md) | `/specs` · `/plan`, by platform | Navigation, forms, data display, responsive, motion, design tokens, anti-patterns |
| [`ux-tui-patterns`](plugins/software-engineering-skills/skills/ux-tui-patterns/README.md) | `/specs` · `/plan`, by platform | Arguments, TUI architectures, colour and output contracts, errors, help, progress |

### Agents

| Agent | Role |
|---|---|
| [`tdd-developer`](plugins/software-engineering-skills/agents/tdd-developer/README.md) | Implements one planned task at a time, test-first, one commit per task |
| [`plan-conformance-judge`](plugins/software-engineering-skills/agents/plan-conformance-judge/README.md) | Read-only judge: is this branch what the plan said it would be? |
| [`spike-conformance-judge`](plugins/software-engineering-skills/agents/spike-conformance-judge/README.md) | Read-only judge: did the spike answer the question that was actually asked, and prove it? Re-runs the probe before the worktrees are destroyed |
| [`pr-monitor`](plugins/software-engineering-skills/agents/pr-monitor/README.md) | Drives one open PR to green CI and answered bot findings |
| [`clean-coder-reviewer`](plugins/software-engineering-skills/agents/clean-coder-reviewer/README.md) | Clean Code / SOLID review, with pragmatic trade-offs |
| [`code-smell-detector`](plugins/software-engineering-skills/agents/code-smell-detector/README.md) | Detects code smells across 10 categories and 50+ smells |
| [`test-design-reviewer`](plugins/software-engineering-skills/agents/test-design-reviewer/README.md) | Scores test quality against Dave Farley's properties of good tests |
| [`scenario-story-writer`](plugins/software-engineering-skills/agents/scenario-story-writer/README.md) | Narrative user scenarios and diagnostic/error design, instead of "As a… I want…" |

The four review agents — clean coder, code smells, test design, plus the `test-mutation` skill — are what `/build` fans out as its **yellow gate** after every green, before any commit.

Full reference: [`plugins/software-engineering-skills/README.md`](plugins/software-engineering-skills/README.md).

## Repository layout

```
.claude-plugin/
  marketplace.json                  marketplace manifest (name, owner, plugin list)
plugins/
  software-engineering-skills/
    .claude-plugin/plugin.json      plugin manifest (name, version, license)
    skills/<name>/SKILL.md          one skill per directory, plus README.md
                                    and references/ alongside
    agents/<name>/<name>.md         one agent per directory, plus README.md,
                                    references/, templates/, examples/
```

## Contributing

Adding a skill: create `plugins/software-engineering-skills/skills/<name>/SKILL.md` with YAML frontmatter, plus a `README.md` covering purpose, when to use it, its arguments, and what it produces (`name`, `description`, and where relevant `user-invocable`, `argument-hint`, `model`). The `description` is what Claude matches against, so write it as trigger conditions, not a title. Put anything long in `references/` and load it on demand.

Adding an agent: create `plugins/software-engineering-skills/agents/<name>/<name>.md` with frontmatter (`name`, `description` including `<example>` blocks, `model`, `color`, and `tools` when the agent should be constrained), plus a `README.md` describing purpose, boundaries, and its input/output contract.

Bump `version` in **both** `.claude-plugin/marketplace.json` and `plugins/software-engineering-skills/.claude-plugin/plugin.json` — they are kept in step.

## License

MIT.
