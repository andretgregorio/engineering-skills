# Product Analysis Skill

Phase 1 of the Spec Driven Development workflow. Produces a **product description** of a feature — what it should do for the user, why the business wants it, and what is true about the system today — before any technical spec exists.

```
/product-analysis "<feature description>" [--ticket <ID>] [--headless]
```

## Purpose

Its readers are a product stakeholder who must recognise their intent in it, and an engineer who must be able to write a spec from it **without a second discovery round**. It is the input a spec is later written from; it is not the spec.

## When to use

- A customer-facing behavior has been requested, but the product intent, success metrics, or scope still need clarification.
- Someone says "describe this feature" or "what are we actually building".

Not for: designing the solution, breaking down work, or writing tests. If you find yourself writing "we'll add a table" or "the endpoint should accept", you have left this skill's scope — describe the observable behavior instead and record the constraint that pushed you there.

## What it produces

`feature-description.md`, written to the configured product-docs location or defaulting to `<repo>/docs/specs/<TICKET>_<slug>/` — one folder per feature, so the later spec and plan sit alongside it.

| Section | Content |
|---|---|
| Intent Description | What the change achieves, for whom, and why now |
| Business Goals | Per metric: baseline (with source and window), target, how success is measured |
| Current Behavior | How the system behaves today at the affected surfaces, with cited evidence |
| Scope | In and explicitly out |
| Use Case Scenarios | Narrative scenarios with observable outcomes, via `scenario-story-writer` |
| Technical Constraints | What the solution must live with — each with its reason |
| Assumptions · Ambiguity Log · Unresolved Ambiguities | The audit trail of what was decided and by whom |
| Consistency Gate · Evidence | Verdicts, and every source a reader can re-check |

## The rules that carry the value

- **Describe behavior, never implementation.**
- **Evidence-backed or explicitly unverified.** Every claim about current behavior or current numbers cites its source — an Amplitude chart, a Datadog query, a code path, an integration test. What cannot be evidenced is written `unverified:` with what would confirm it. A target without a baseline is unmeasurable.
- **Ambiguity is surfaced, not absorbed.** Step 6 classifies every open decision as `inferable` (a developer would *reliably land on the same answer*, not merely find yours reasonable) or `requires-stakeholder-input`, which blocks.
- **Two hard stops:** the cross-artifact consistency gate — run by an independent read-only subagent — and human approval. The skill ends by presenting the document and never auto-continues into planning.

## Headless mode

`--headless`, `ENGINE_FLOW_AUTO_APPROVE=1`, or provably no human in the loop. A degraded mode, not an equivalent one: assumptions are adopted and logged as `assumed (headless)`, genuine coin flips halt, the document stays `**Status**: draft`, and an existing file is never silently overwritten.

## Next

`/specs`. The skill names it and stops.

Full definition: [`SKILL.md`](SKILL.md). Running the phase by hand is described at the end of it.
