---
name: specs
description: Collaborative workflow for producing the specification artifacts (intent, technical notes, error handling, monitoring, acceptance criteria) that describe one feature and its goals before any implementation begins. Its value is resolving ambiguity with a human before build starts — not synthesizing edge cases. Use when starting any new feature or behavior change — do not write code until the artifacts pass the consistency gate. BDD/Gherkin scenarios are authored later, per slice, in /plan.
role: orchestrator
user-invocable: true
argument-hint: "<feature name or path to feature-description.md> [--ticket <ID>] [--headless]"
---

# Specs

You are producing a document with specifications for a software product. The specification should embrace one feature only. The generated document will be a description of the intent, the acceptance criteria, technical notes, error handling, monitoring, and a documentation of the assumptions and ambiguities.

Its readers are the engineer who will plan and build the feature, and the reviewer who will later ask whether what shipped is what was agreed.

## What this skill does not produce

- **Implementation plan:** The implementation plan that will guide the commits will be produced in the following document, not this one.
- **Implemented tests:** Although the acceptance criteria should be written as implementable tests, the test implementation will be created afterwards.
- **Committed code:** This skill never commits production code into the base branch. Every code eventually written by this skill can be documented as a "spike" document, but never committed as source code.

## Rules

- **Evidence-backed or explicitly unverified.** Every decision should be based on evidence. Technical notes — such as code changes, etc — should be verified with a quick spike before assuming the idea works, and with analytics data such as Data Dog, Amplitude, New Relic, Sentry, CloudWatch, or whatever monitoring tools are available. When you cannot get evidence, write the claim as `unverified:` and say what would confirm it. Never launder a guess into a fact.
- **One vertical slice at a time:** If the request holds a specification with more than one functionality, stop and propose the user to run the "user-story-mapping-workshop" first. See step 2.
- **The consistency gate is a hard stop.** Do not finalize the document until every gate item passes.
- **Human approval is a hard stop.** This skill ends by presenting the document. It never auto-continues into planning or implementation.
- **Preserve human language.** The human owns the intent; you improve precision. Max 2 critique-refine iterations per artifact — if it does not stabilize, say so and ask how to proceed.
- **Be succinct:** Always prefer straightforward language, trying to be more concise and writing fewer paragraphs of text. Focus on what is important. This should be close to a one-pager as much as possible.
- **Document decisions, not just outcomes.** When the human rejects a suggestion, record what was rejected and why. That reasoning is the part that gets lost.
- **Ambiguity is surfaced, not absorbed.** Any decision two reasonable people would make differently goes to the human. See step 6.

## Artifacts

| Artifact | Purpose | Format |
| --- | --- | --- |
| Intent | What the change achieves and why | Plain language, 1–3 paragraphs |
| Technical notes | Where the change fits and what constraints apply | Structured notes: components, interfaces, dependencies, constraints |
| Error handling | Anticipates possible failures and how the system can survive them | Structured notes: description, user impact, mitigation |
| Monitoring | Describes what should be monitored during rollout | Structured notes: metric name, description, needs implementation |
| Acceptance criteria | Observable outcomes and quality thresholds that define "done" | Measurable criteria with pass/fail conditions |

Observable behavior is captured as Gherkin in `/plan`, one scenario set per slice. This document's job is to make that authoring unambiguous, not to pre-write it.

## Headless mode

The run is **headless** when `--headless` is passed or there is provably no human in the loop (CI/automation). This skill is fundamentally a clarification exercise, so headless is a degraded mode, not an equivalent one.

- **Never wait for an answer, never fake one.** For each `requires-stakeholder-input` item, adopt the most defensible assumption, record it in the Ambiguity Log as `assumed (headless)`, and list it under `## Unresolved Ambiguities`.
- **Genuine coin flips halt.** When two options are equally defensible and the choice materially changes the feature, stop and report rather than picking.
- **The approval gate is never auto-approved.** Write the document with `**Status**: draft`, print the path, and halt.
- **Never silently overwrite** an existing `spec.md` — halt instead.
- Spikes still run, and still never reach the base branch.

## Steps

### 1. Load context and confirm the input

Two upstream documents decide what this spec is allowed to cover. Read them first, then fill in the rest yourself before asking the human anything the code could answer.

**`feature-description.md` — the product input.** Written by `/describe-feature`: business goals with baselines, current behavior, scope, use-case scenarios, technical constraints. Do not re-derive it and do not contradict it; carry its `## Unresolved Ambiguities` into step 6. If it does not exist and the product intent, success metric, or scope boundary is unclear, say so and offer `/describe-feature` before continuing — if the intent is genuinely clear without it, proceed and record where the intent came from.

**`story-map.md` — the slice boundary.** Written by `/user-story-mapping-workshop`, together with `prioritization.md`. **When a story map exists, this spec resolves exactly one rib** — one task under one backbone activity — not an activity, not a release slice, not the map. So:

- Identify the rib by name, and its activity. If the invocation names a feature rather than a rib, map it to a rib and confirm with the human before drafting.
- If the request spans several ribs, take the highest-priority one — walking-skeleton ribs first, then `prioritization.md`'s order — and say which ribs you are leaving for later documents.
- Record the rib and activity in the spec header. It is what the consistency gate and `/plan` check scope against.
- Read the rib's outcome link in `prioritization.md`: the target outcome KPI is the strongest candidate for the monitoring guardrail in step 5.

Then the rest:

- Read the code the change touches — routes, models, contracts — and the integration/E2E tests covering that surface. Executable tests are the most reliable statement of current behavior.
- Check memory for prior context on this area: `~/.claude/projects/<project-slug>/memory/`, starting from `MEMORY.md`.
- Read the linked ticket and any referenced docs.
- Only then ask the human, and ask about intent and priorities — not about things the codebase already answers.

### 2. Scope check — one functionality (hard stop)

A specification covers **one functionality**: a single observable capability that ships and is validated on its own. Decomposition into commits belongs to `/plan`; decomposition into slices belongs to the story map.

**With a story map:** the test is the rib from step 1. One rib, one document. A draft that has grown to cover a sibling rib, or a whole activity, has failed this gate — cut it back and note the ribs that need their own spec.

**Without a story map**, these signals say the request holds more than one functionality:

- It spans more than one user activity end-to-end (in story-map terms, more than one backbone column).
- Parts of it would ship, or be turned on, separately.
- Its name joins two capabilities with "and".
- More than ~5 components are affected, or specifying it clearly exceeds a short conversation.

If any fires: **stop**, name the functionalities you see, and propose `/user-story-mapping-workshop`. Come back with a map, and spec the walking-skeleton ribs first. Do not silently pick one yourself, and do not spec them all in one file.

### 3. Draft the intent

One to three paragraphs, plain language: what the change achieves, for whom, and why now. Draft with the human, not at them — show it, take the correction, move on.

Preserve their words; you improve precision, not voice. Where the intent has a boundary that a reader could get wrong, state it in one line ("this covers X; Y stays as it is today").

### 4. Write the technical notes — verified, not assumed

Structured notes, not prose: components touched, interfaces and contracts, dependencies, constraints. What the solution must fit into — not the order of the work.

**Every note carries its evidence.** A file path, a test, a measured number, a dashboard query, or a spike. Never state that a library, API, query, or framework behaves a certain way from memory.

**The spike protocol.** When a note asserts something the existing code does not already prove, verify it before writing it down:

1. Timebox it (about an hour). Run it in a scratch branch or worktree, never on the base branch.
2. Record the outcome in the document as `Spike: <question> → <result> (<where it ran, what you ran>)`.
3. Throw the code away. A spike's value is the answer, not the diff — nothing it produced is committed as source code.
4. If the box runs out, write the claim as `unverified:` with what would confirm it, and let step 6 decide whether it blocks.

**Escalate instead of guessing.** If the notes require weighing genuinely different designs, or the risks are architectural rather than local, stop and propose `/arm-workshop`. Its technical-investigation document then becomes this section's source, cited by path — do not re-litigate it here.

Out of scope for this section: task ordering, file-by-file diffs, and anything that reads as an implementation plan.

### 5. Error handling and monitoring

**Error handling.** One row per failure mode that the feature can actually reach. Derive them from real signal — open Sentry issues on the surfaces you touch, Datadog error rates, the timeout and retry behavior of the dependencies in your notes — not from imagination.

| Failure mode | Trigger | User impact | System behavior / mitigation |

Every failure with a user-visible impact must either get an acceptance criterion in step 7, or an explicit line saying the risk is accepted and unhandled. Silence is not a decision.

**Monitoring.** What tells us this feature is healthy during rollout, and what tells us to roll it back.

| Metric | What it answers | Source | Exists / needs implementation |

- Name the tool and the query or chart, not just the concept.
- At least one row is a **rollout guardrail**: the signal that says stop, with its threshold and who watches it.
- A metric marked *needs implementation* is also a technical note — emitting it is part of the work, and `/plan` must see it.

### 6. Ambiguity Resolution Protocol (hard step — never skip)

Collect ambiguities throughout steps 1–5; resolve them here, in one batch, **before** the acceptance criteria are written.

1. **Attempt inference** from existing codebase behavior (especially the integration tests), domain conventions, the product description, or unambiguous implication.
2. **Classify each one:**
   - `inferable` — a developer working from the codebase and domain alone would reliably land on the same answer. Document the inference and its rationale; proceed.
   - `requires-stakeholder-input` — the decision depends on product or business intent not evident from context; two reasonable people would choose differently. **Block.**
3. **Batch and ask.** Present every `requires-stakeholder-input` item to the human as a single list — *"Before writing acceptance criteria, I need N decisions the spec leaves open: …"*. Wait for answers before finalizing. (Headless: adopt documented assumptions instead of waiting, or halt on genuine coin flips.)

`inferable` is not a convenient default. The test is reliability, not plausibility: would a developer *land on the same answer*, or merely find yours reasonable? If in doubt, ask. Record every classification in the `## Ambiguity Log` — it is the audit trail, and downstream phases carry it into the eventual PR.

### 7. Write the acceptance criteria

Observable outcomes with pass/fail conditions. Each one must be implementable as a test — and must not be written as one: no Gherkin, no framework, no test names. `/plan` authors the scenarios, per slice, from these.

- Every behavior in the intent maps to at least one criterion.
- Every user-visible failure mode from step 5 maps to a criterion, or is logged as accepted.
- Every quality threshold names a number, a unit, and where it is measured (`p95 < 400ms on the Datadog APM endpoint dashboard`, not "fast").
- Criteria describe what is visible at the boundary — to a user or a calling client — never internal state, and never a class or function name.

### 8. Cross-artifact consistency gate

Hand the drafted document to an independent read-only subagent (`subagent_type: "general-purpose"`, do not pin a model) and have it return a verdict per item, with the specific evidence for any failure:

- [ ] Intent is unambiguous — two developers would interpret it the same way.
- [ ] The document specifies exactly one functionality — the single named rib when a story map exists, otherwise the step 2 signals re-checked against the finished draft.
- [ ] Every behavior or goal in the intent maps to at least one acceptance criterion.
- [ ] Every acceptance criterion is observable, has a pass/fail condition, and states no implementation detail.
- [ ] Every technical note is evidence-backed — path, test, measurement, spike, or `/arm-workshop` document — or explicitly marked `unverified:`.
- [ ] Every user-visible failure mode has defined behavior plus a criterion, or an explicit accepted-risk line.
- [ ] Monitoring includes a rollout guardrail with a source and a threshold; metrics needing implementation are reflected in the technical notes.
- [ ] Concepts are named consistently across artifacts and with `feature-description.md` and the domain glossary.
- [ ] No artifact contradicts another, or contradicts current system behavior as documented by the integration tests.
- [ ] Every gap or ambiguity is logged — `inferable` with rationale, or resolved by the human.

Fix blockers and re-run only the failing items (max 2 iterations; then surface the outstanding blockers to the human and ask how to proceed). Record the verdicts in the document.

**Hard stop: do not finalize until every item passes.**

### 9. Persist and present for approval (hard stop)

Write to the location the user has configured for specs at the user or project scope. If none is configured, write **alongside the product description** — `<TICKET>_<slug>/spec.md` in the same folder as `feature-description.md` — so the description, the spec, and the later plan sit together. With no upstream document, default to `<primary repo>/docs/specs/<TICKET>_<slug>/spec.md`.

`<TICKET>` is the tracker id, taken from `--ticket`, from the invocation, or asked for once; when there genuinely is no ticket, use the slug alone. `<slug>` is the slugified feature name. Create the directory if missing. If the file already exists, ask before overwriting (headless: halt).

```markdown
# Spec: <Feature Name>

**Ticket**: <ABC-123 | none>
**Created**: <date>
**Status**: draft
**Feature description**: `feature-description.md` (sibling in this directory) | none
**Story map**: `story-map.md` — activity "<Activity>", rib "<Rib>" | none
**Components affected**: <best current understanding>

## Intent
...

## Technical Notes
<!-- Components, interfaces, dependencies, constraints. Each note cites its evidence. -->

### Spikes
<!-- Spike: <question> → <result> (<where it ran>). Code discarded, never committed. -->

## Error Handling
| Failure mode | Trigger | User impact | System behavior / mitigation |
|---|---|---|---|

## Monitoring
| Metric | What it answers | Source | Exists / needs implementation |
|---|---|---|---|
<!-- At least one row is the rollout guardrail, with its threshold. -->

## Acceptance Criteria
<!-- Observable, pass/fail, implementable as a test but not written as one. -->

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

## Rejected Alternatives
<!-- What was proposed, what was decided instead, and why. The reasoning is the part that gets lost. -->

## Consistency Gate
<checklist above, with verdicts>

## Evidence
<!-- Every source consulted: file paths, tests, dashboards and queries, tickets, docs,
     spike results. A reader must be able to re-check any claim. -->
```

Print the file path, show the human the Intent, Acceptance Criteria, and Unresolved Ambiguities, and ask them to approve or request changes. **Only on explicit approval** set `**Status**: approved`.

Then stop. Name `/plan` as the natural next step, but do not start it. (Headless: leave `**Status**: draft`, print the path, and halt.)

## Running this phase by hand (no skill)

The artifact matters, not the automation. A human doing this manually: read the product description and the integration tests for the surface being changed; write the intent in a paragraph the stakeholder would recognise; prove the risky technical assumption with a throwaway spike instead of asserting it; list the ways it can fail and decide, for each, what the user sees; name the one metric that would make you roll it back; write the criteria as outcomes someone else could check; and take every question you cannot answer from the code to the person who owns the intent, before anyone plans the work. The discipline that carries the value is refusing to state a technical fact you have not verified, and refusing to resolve a product question by guessing.
