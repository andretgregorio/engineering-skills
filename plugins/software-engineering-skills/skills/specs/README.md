# Specs Skill

Phase 2 of the Spec Driven Development workflow. Produces the **specification for one feature** — intent, technical notes, error handling, monitoring, acceptance criteria — before any implementation begins.

```
/specs "<feature name or path to feature-description.md>" [--ticket <ID>] [--headless]
```

## Purpose

Its readers are the engineer who will plan and build the feature, and the reviewer who will later ask whether what shipped is what was agreed.

Its value is **resolving ambiguity with a human before build starts** — not synthesizing edge cases. Aim for close to a one-pager.

## When to use

Starting any new feature or behavior change. Do not write code until the artifacts pass the consistency gate.

Not for: the implementation plan (that is `/plan`), test implementations, committed code, or finished visual design — the UI section prototypes at low fidelity and stops. Spikes are encouraged and documented — their code is always discarded.

## What it produces

`spec.md`, written alongside `feature-description.md` in the same `<TICKET>_<slug>/` directory. A UI feature with more than two surfaces also gets `ui-prototype.md` beside it, referenced from the spec header and approved with it.

| Artifact | Purpose |
|---|---|
| Intent | What the change achieves and why — 1–3 paragraphs |
| Technical Notes | Components, interfaces, dependencies, constraints — each citing its evidence |
| Spikes | `Spike: <question> → <result> (<where it ran>)`, code discarded |
| Error Handling | Per failure mode: trigger, user impact, system behavior |
| Monitoring | Per metric: what it answers, source, exists or needs implementation |
| UI/UX Specification | On a UI feature: surfaces and their states, pattern choices with what they beat, a low-fidelity prototype, and an integration check |
| Acceptance Criteria | Observable, pass/fail, implementable as a test but not written as one |
| Ambiguity Log · Unresolved Ambiguities · Rejected Alternatives | Decisions and the reasoning that usually gets lost |

**Gherkin is deliberately not here.** `/plan` authors the scenarios, one set per slice. This document's job is to make that authoring unambiguous.

## The rules that carry the value

- **One vertical slice at a time.** Step 2 is a hard stop. With a story map, a spec resolves exactly **one rib** — one task under one backbone activity. Without one, signals like "spans more than one user activity", "parts would ship separately", or "its name joins two capabilities with *and*" mean the request holds more than one functionality: stop and propose `/user-story-mapping-workshop`.
- **Verified, not assumed.** Never state that a library, API, query, or framework behaves a certain way from memory. The spike protocol — timeboxed to about an hour, in a scratch branch, result recorded, code thrown away — is how a technical note earns its place.
- **Escalate genuinely architectural questions.** If the notes require weighing different designs, or the risks are architectural rather than local, stop and propose `/arm-workshop`; its document then becomes the source, cited by path.
- **Error handling from real signal** — open Sentry issues, Datadog error rates, the timeout behavior of your dependencies — not from imagination. Every user-visible failure gets a criterion or an explicit accepted-risk line. Silence is not a decision.
- **At least one monitoring row is the rollout guardrail**, with its threshold and who watches it.
- **Two hard stops:** the consistency gate run by an independent read-only subagent, and human approval.

## UI features

When the feature has a surface, step 6 says what that surface *is* — concretely enough that `/plan` can write scenarios against it and a reviewer can tell whether what shipped is what was agreed. It starts from `feature-description.md`'s journey and arc and refines them; it never redraws them silently.

| Skill loaded | For |
|---|---|
| [`ux-principles`](../ux-principles/README.md) | The review checklist and WCAG 2.2 AA floor the acceptance criteria are written from |
| [`ux-web-patterns`](../ux-web-patterns/README.md) **or** [`ux-tui-patterns`](../ux-tui-patterns/README.md) | The pattern choice, by platform — both when it ships to both |
| [`ux-emotional-patterns`](../ux-emotional-patterns/README.md) | Empty, first-run and error states, and the copy tone at each |
| [`design-methodology`](../design-methodology/README.md) | **Phases 3–4 only** — progressive-fidelity prototyping and the integration check |

What the step insists on:

- **Reuse before inventing.** Cite the existing design system, component library, or screen by path. A component that does not exist yet is a technical note, not a drawing — and a claim about what a library component supports is a spike, not a memory.
- **Every surface declares its states** — populated, empty (first-run and zero-results are different), loading, error. Every user-visible failure mode gets a named UI treatment or an explicit not-handled line.
- **Every pattern names the loser.** The alternative it beat goes to Rejected Alternatives.
- **Accessibility criteria carry numbers** — contrast ratio, target size, focus visibility, feedback within 100ms. "Accessible" is not a criterion.
- **Still no Gherkin.** `ux-web-patterns` ships a Gherkin AC template; it belongs to `/plan`, not here.

## Headless mode

A degraded mode: assumptions logged as `assumed (headless)`, coin flips halt, status stays `draft`, no silent overwrite. Spikes still run and still never reach the base branch.

## Next

`/plan`. The skill names it and stops.

Full definition: [`SKILL.md`](SKILL.md). Running the phase by hand is described at the end of it.
