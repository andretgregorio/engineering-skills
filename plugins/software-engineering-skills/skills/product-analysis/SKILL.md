---
name: product-analysis
description: Produce a product/business description of a feature before any technical spec exists — business goals with measured baselines, how the system behaves today, narrative use-case scenarios, scope boundaries, and technical constraints — resolving ambiguities with the human as it goes. Writes feature-description.md and stops for approval; it never plans or implements. Use when a customer-facing behavior has been requested but the product intent, success metrics, or scope still need clarification, or when the user says "describe this feature", "what are we actually building", or invokes /describe-feature.
argument-hint: "<feature description> [--ticket <ID>] [--headless]"
model: opus
---

# Describe Feature

You are producing a **product description** of a new feature or a change to an existing one: what it should do for the user, why the business wants it, and what is true about the system today. This document is the input a technical spec is later written from — it is not the spec.

Its readers are a product stakeholder who must recognise their intent in it, and an engineer who must be able to write a spec from it without a second discovery round.

## What this skill does not produce

No implementation plan, no task breakdown, no architecture, no test scenarios in any test framework's format, no code. If you find yourself writing "we'll add a table" or "the endpoint should accept", you have left this skill's scope — describe the observable behavior instead and record the constraint that pushed you there under Technical Constraints.

## Rules

1. **Describe behavior, never implementation.** The document says what the user experiences and what the business gets. How it gets built belongs to the spec and plan phases.
2. **Evidence-backed or explicitly unverified.** Every claim about current behavior or current numbers cites its source — an Amplitude metric, a Datadog metric or log, a code path, an existing integration or E2E test, a Confluence/Tolaria doc. When you cannot get evidence, write the claim as `unverified:` and say what would confirm it. Never launder a guess into a fact.
3. **The consistency gate is a hard stop.** Do not finalize the document until every gate item passes.
4. **Human approval is a hard stop.** This skill ends by presenting the document. It never auto-continues into planning or implementation.
5. **Preserve human language.** The human owns the intent; you improve precision. Max 2 critique-refine iterations per artifact — if it does not stabilize, say so and ask how to proceed.
6. **Document decisions, not just outcomes.** When the human rejects a suggestion, record what was rejected and why. That reasoning is the part that gets lost.
7. **Ambiguity is surfaced, not absorbed.** Any decision two reasonable people would make differently goes to the human. See step 6.

## Headless mode

The run is **headless** when `--headless` is passed, `ENGINE_FLOW_AUTO_APPROVE=1` is set, or there is provably no human in the loop (CI/automation). This skill is fundamentally a clarification exercise, so headless is a degraded mode, not an equivalent one.

- **Never wait for an answer, never fake one.** For each `requires-stakeholder-input` item, adopt the most defensible assumption, record it in the Ambiguity Log as `assumed (headless)`, and list it under `## Unresolved Ambiguities`.
- **Genuine coin flips halt.** When two options are equally defensible and the choice materially changes the feature, stop and report rather than picking.
- **The approval gate is never auto-approved.** Write the document with `**Status**: draft`, print the path, and halt. A human approves it later; nothing downstream may treat a headless run as signed off.
- **Never silently overwrite** an existing `feature-description.md` — halt instead.

## Steps

### 1. Understand the request and load context

Read the feature description argument, then build the surrounding picture before asking the human anything you could have found yourself.

- Read the product-context and journey-map docs if the project has them (for Groups: the Tolaria `groups-product-context.md` and `groups-journey-map.md` drafts — domain glossary, feature catalog, routes map, critical paths).
- Check your memory files for prior context on this product area: `~/.claude/projects/<project-slug>/memory/` — start from `MEMORY.md` as the index.
- Read the repo's integration and E2E tests covering the affected surface. These are the most reliable statement of current behavior, because they are executable.
- Read any linked ticket or Confluence page.
- Only then ask the human — and ask about intent and priorities, not about things the codebase already answers.

### 2. Establish the business goals

A goal is not a goal until it names a metric, a direction, and a way to tell whether it moved.

- Ask the human what outcome they expect. Push past "make it better" to a metric.
- Typical shapes: funnel conversion at a named step, engagement with a specific surface, awareness/reach, time-to-complete a journey. These usually ladder up to revenue or cost.
- **Get the current baseline from Amplitude** for each metric named, and record the chart/segment and time window you read it from. A target without a baseline is unmeasurable.
- Where the goal is reliability or performance rather than behavior, take the baseline from Datadog instead.
- Check memory for goals and metric definitions used on past features in this area — reuse the same definition so numbers stay comparable across features.
- If this run establishes a reusable metric definition or product-area fact, write it to memory in a generic, feature-independent form.

State each goal as: **metric — baseline (source, window) — target — how we will know**.

### 3. Describe how the system behaves today

The gap between today and the desired behavior is what the feature actually is, so this section carries more weight than its length suggests.

- What does the product do today at the surfaces this feature touches? Cite tests, code, or routes.
- What already exists that this can build on, and what will this change or contradict?
- Which user segments, flags, or generations see different behavior today? (Feature flags and legacy generations are the usual source of "it works for me" disagreements.)
- What technical constraints does the current shape impose — not how to implement, but what the solution will have to live with.

### 4. Write the use-case scenarios

Dispatch the **`scenario-story-writer`** agent. Pass it: the feature description, the business goals from step 2, the current-behavior findings from step 3, and the personas or segments you have identified.

These are narrative scenarios — a named person, their situation and constraints, what they are trying to do, the friction, and what a good product response looks like. They are deliberately **not** `As a <role> I want <action> so that <goal>`, and deliberately not Gherkin.

Require back: happy paths under realistic (imperfect) conditions, stress/edge scenarios, and diagnostic scenarios covering how the product rescues someone when things fail. Every scenario must state an **observable outcome** — that is what a downstream spec turns into acceptance criteria.

Fold the agent's output into the document yourself: keep the narratives and observable outcomes, move anything implementation-flavored into Technical Constraints, and drop scenarios that do not describe an aspect of *this* feature.

### 5. Draft the artifacts collaboratively

| Artifact | Purpose | Format |
|---|---|---|
| Intent Description | What the change achieves, for whom, and why now | Plain language, 1–3 paragraphs |
| Business Goals | Which metrics move, from what baseline to what target, and how success is measured | Table or list, one line per metric |
| Current Behavior | How the system behaves today at the surfaces this touches, with evidence | Prose plus cited sources |
| Scope | What is in, and explicitly what is out | Two bullet lists |
| Use Case Scenarios | The narrative scenarios and their observable outcomes | Per `scenario-story-writer`'s format |
| Technical Constraints | What the solution must live with or respect — not how it is built | Bullet list, each with its reason |

Draft with the human, not at them. Show a section, take the correction, move on.

### 6. Ambiguity Resolution Protocol (hard step — never skip)

Collect ambiguities throughout steps 1–5; resolve them here, in one batch.

1. **Attempt inference** from existing codebase behavior (especially the integration tests), domain conventions, or unambiguous implication.
2. **Classify each one:**
   - `inferable` — a developer working from the codebase and domain alone would reliably land on the same answer. Document the inference and its rationale; proceed.
   - `requires-stakeholder-input` — the decision depends on product intent not evident from context; two reasonable people would choose differently. **Block.**
3. **Batch and ask.** Present every `requires-stakeholder-input` item to the human as a single list. Wait for answers before finalizing. (Headless: adopt documented assumptions instead of waiting, or halt on genuine coin flips — see Headless mode.)

`inferable` is not a convenient default. The test is reliability, not plausibility: would a developer *land on the same answer*, or merely find yours reasonable? If in doubt, ask. Record every classification in the `## Ambiguity Log` — it is the audit trail, and downstream phases carry it into the eventual PR.

### 7. Cross-artifact consistency gate

Hand the drafted document to an independent read-only subagent (`subagent_type: "general-purpose"`, do not pin a model) and have it return a verdict per item with the specific evidence for any failure:

- [ ] Intent is unambiguous — two developers would interpret it the same way.
- [ ] Every business goal has a metric, a cited baseline, a target, and a measurement method.
- [ ] Every scenario describes one aspect of this feature and states an observable outcome.
- [ ] Scope in/out is explicit, and nothing in the scenarios falls outside it.
- [ ] Technical constraints trace to the scenarios or the business goals — no orphans, no disguised implementation decisions.
- [ ] Concepts are named consistently across artifacts, using the product-context domain glossary.
- [ ] No artifact contradicts another, or contradicts current system behavior as documented by the integration tests.
- [ ] Every claim is evidence-backed or explicitly marked `unverified:`.
- [ ] Every gap or ambiguity is logged — `inferable` with rationale, or resolved by the human.

Fix blockers and re-run only the failing items (max 2 iterations; then surface the outstanding blockers to the human and ask how to proceed). Record the verdicts in the document.

**Hard stop: do not finalize until every item passes.**

### 8. Persist and present for approval (hard stop)

Write to the location the user has configured for product docs at the user or project scope. If none is configured, default to `<primary repo>/docs/specs/<TICKET>_<slug>/feature-description.md` — one folder per feature, so a later spec and plan sit alongside it. If the repo already keeps product docs in `docs/prd/`, use that instead.

`<TICKET>` is the tracker id (e.g. `GRSHOP-123`), taken from `--ticket`, from the invocation, or asked for once; when there genuinely is no ticket, use the slug alone. `<slug>` is the slugified feature name. Create the directory if missing. If the file already exists, ask before overwriting (headless: halt).

```markdown
# Feature Description: <Feature Name>

**Ticket**: <GRSHOP-123 | none>
**Created**: <date>
**Status**: draft
**Product area**: <area / journey>
**Repo(s) likely affected**: <best current understanding — informational, not a commitment>

## Intent Description
...

## Business Goals
| Metric | Baseline (source, window) | Target | How we measure |
|---|---|---|---|

## Current Behavior
...

## Scope
**In scope**
- ...

**Out of scope**
- ...

## Use Case Scenarios
...

## Technical Constraints
...

## Assumptions
<!-- Things taken as true without confirmation, and what each one rests on. -->

## Ambiguity Log
| Decision | Classification | Resolved by | Rationale / answer |
|---|---|---|---|
<!-- Resolved by: inference | human | assumed (headless) -->

## Unresolved Ambiguities
<!-- Every decision made WITHOUT a human answer. Interactive runs that resolved
     everything write: "None — all ambiguities resolved with the human." -->
| Decision | Assumption taken | What a human must confirm |
|---|---|---|

## Consistency Gate
<checklist above, with verdicts>

## Evidence
<!-- Every source consulted: Amplitude charts, Datadog queries, test files,
     code paths, docs, tickets. A reader must be able to re-check any claim. -->
```

Print the file path, show the human the Intent, Business Goals, Scope, and Unresolved Ambiguities, and ask them to approve or request changes. **Only on explicit approval** set `**Status**: approved`.

Then stop. Name the natural next step — writing the technical spec, or `/plan` if the team goes straight there — but do not start it. (Headless: leave `**Status**: draft`, print the path, and halt.)

## Running this phase by hand (no skill)

The artifact matters, not the automation. A human doing this manually: read the product-context docs and the integration tests for the affected surface; pull the baseline numbers from Amplitude before agreeing to any target; write the intent, goals, current behavior, scope, and scenarios; list every open question and get a stakeholder to answer it before anyone writes a spec. The discipline that carries the value is refusing to state a number you have not measured, and refusing to resolve a product question by guessing.
