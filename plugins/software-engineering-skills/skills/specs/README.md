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

Not for: the implementation plan (that is `/plan`), test implementations, or committed code. Spikes are encouraged and documented — their code is always discarded.

## What it produces

`spec.md`, written alongside `feature-description.md` in the same `<TICKET>_<slug>/` directory.

| Artifact | Purpose |
|---|---|
| Intent | What the change achieves and why — 1–3 paragraphs |
| Technical Notes | Components, interfaces, dependencies, constraints — each citing its evidence |
| Spikes | `Spike: <question> → <result> (<where it ran>)`, code discarded |
| Error Handling | Per failure mode: trigger, user impact, system behavior |
| Monitoring | Per metric: what it answers, source, exists or needs implementation |
| Acceptance Criteria | Observable, pass/fail, implementable as a test but not written as one |
| Ambiguity Log · Unresolved Ambiguities · Rejected Alternatives | Decisions and the reasoning that usually gets lost |

**Gherkin is deliberately not here.** `/plan` authors the scenarios, one set per slice. This document's job is to make that authoring unambiguous.

## The rules that carry the value

- **One vertical slice at a time.** Step 2 is a hard stop. With a story map, a spec resolves exactly **one rib** — one task under one backbone activity. Without one, signals like "spans more than one user activity", "parts would ship separately", or "its name joins two capabilities with *and*" mean the request holds more than one functionality: stop and propose `/user-story-mapping-workshop`.
- **Verified, not assumed.** Never state that a library, API, query, or framework behaves a certain way from memory. The spike protocol — timeboxed to about an hour, in a scratch branch, result recorded, code thrown away — is how a technical note earns its place.
- **Escalate genuinely architectural questions.** If the notes require weighing different designs, or the risks are architectural rather than local, stop and propose `/arm-workshop`; its document then becomes the source, cited by path.
- **Error handling from real signal** — open Sentry issues, Datadog error rates, the timeout behavior of your dependencies — not from imagination. Every user-visible failure gets a criterion or an explicit accepted-risk line. Silence is not a decision.
- **At least one monitoring row is the rollout guardrail**, with its threshold and who watches it.
- **Two hard stops:** the ten-item consistency gate run by an independent read-only subagent, and human approval.

## Headless mode

A degraded mode: assumptions logged as `assumed (headless)`, coin flips halt, status stays `draft`, no silent overwrite. Spikes still run and still never reach the base branch.

## Next

`/plan`. The skill names it and stops.

Full definition: [`SKILL.md`](SKILL.md). Running the phase by hand is described at the end of it.
