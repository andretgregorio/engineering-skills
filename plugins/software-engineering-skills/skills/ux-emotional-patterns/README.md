# UX Emotional Patterns Skill

A **reference skill** — loaded by another skill, never invoked directly. Patterns for interfaces that feel good to use: what to build first, and what "delight" actually costs.

```yaml
user-invocable: false
disable-model-invocation: false   # loaded via the Skill tool by /product-analysis and /specs
```

## What it provides

| Section | Use |
|---|---|
| Walter's hierarchy of user needs | Functional → reliable → usable → pleasurable, and why polish on a confusing interface makes it worse |
| Surface vs deep delight | Why "suggests the likely next action" outranks "the save button has a satisfying animation" |
| Empty states | First-run, zero-results and error empty states, each with a call to action — and the blank-page anti-pattern |
| Onboarding and first-run | Progressive onboarding by platform (web, desktop, CLI) against the mandatory-walkthrough anti-pattern |
| Tone of voice | A tone per context — error, success, empty, destructive, loading — and when personality helps versus annoys |
| Microinteractions | The high-value ones, the ones to skip, and the trigger/feedback/purpose pattern for specifying them |
| Emotional arc integration | A journey-phase-to-target-emotion table, with the design lever for each |

## Where it is used

- [`/product-analysis`](../product-analysis/README.md) step 5 — the arc table drives the emotional arc. Empty states and the first-run experience are treated as **product decisions**, not polish deferred to later.
- [`/specs`](../specs/README.md) step 6 — the empty, first-run and error states each surface must declare, and the copy tone at each.
