# Design Methodology Skill (Apple LeanUX++)

A **reference skill** — loaded by another skill, never invoked directly. It carries the four-phase design workflow, the journey schema, the emotional arc patterns, and the CLI UX principles the refining skills work from.

```yaml
user-invocable: false
disable-model-invocation: false   # loaded via the Skill tool by /product-analysis and /specs
```

## The four phases, and who runs which

| Phase | Question | Loaded by |
|---|---|---|
| 1. Journey Mapping | "What complete journey is the user trying to accomplish?" | [`/product-analysis`](../product-analysis/README.md) step 5 |
| 2. Emotional Design | "How should the user FEEL at each step?" | `/product-analysis` step 5 |
| 3. Prototyping | "What does each step look like?" | [`/specs`](../specs/README.md) step 6 |
| 4. Integration Check | "Do all pieces connect properly?" | `/specs` step 6 |

The split is deliberate. The journey and the arc are **product intent** and belong upstream, where a stakeholder still owns them. The prototype and the integration check are **specification** and belong where the acceptance criteria get written.

## What it provides

- The phase workflow, with the technique and output of each.
- A journey schema (steps, TUI mockups, shared artifacts, emotional entry/exit states, integration checkpoints).
- Named emotional arc patterns — confidence building, discovery joy, problem relief — and the transition rules between them.
- Apple's design principles applied: form follows feeling, concentrated focus, material honesty, hidden quality.
- CLI UX patterns from clig.dev: command structure, feedback, progressive disclosure, help design.

## Two things not to carry over

- **Its output paths.** The skill's `docs/feature/{feature-id}/discuss/` locations and per-phase day counts are from its origin. The refining skills write to `docs/specs/<TICKET>_<slug>/` — the calling skill's persist step wins.
- **Its per-step Gherkin.** The journey schema includes Gherkin, but the refining documents deliberately contain none — `/plan` authors scenarios per slice. Treat the schema as a checklist of what to think about, not the deliverable format.
