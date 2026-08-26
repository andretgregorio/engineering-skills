# UX Web Patterns Skill

A **reference skill** — loaded by another skill, never invoked directly. Web interface patterns, for when the surface under refinement runs in a browser.

```yaml
user-invocable: false
disable-model-invocation: false   # loaded via the Skill tool by /specs, /plan, and /product-analysis
```

## What it provides

| Section | Use |
|---|---|
| Navigation patterns | A when-to-use / when-to-avoid table per pattern, against the three questions navigation must answer |
| Form design | Layout, reward-early-punish-late validation, what an error message must contain, progressive forms |
| Data display | Table, list, card and pagination-vs-infinite-scroll choices |
| Responsive design | Mobile-first, breakpoint starting points, key techniques |
| Component and motion patterns | When motion helps and when it distracts |
| Design system guidance | Existing versus custom, and design tokens |
| Anti-patterns | Each paired with the alternative to use instead |

## Where it is used

- [`/specs`](../specs/README.md) step 6 — the pattern choice for a web surface. Every choice cites this skill's "when to use" and names the alternative it beat, e.g. *"side navigation (many sections, admin-shaped); top nav rejected — 14 sections exceeds the 5–7 limit"*.
- [`/product-analysis`](../product-analysis/README.md) step 5 — only when a platform constraint changes product scope ("it has to work one-handed on mobile").
- [`/plan`](../plan/README.md) step 4 — for the coverage a UI scenario set owes, read off the acceptance-criteria template below.

## One section not to use as-is

The skill closes with an **acceptance-criteria template written in Gherkin**. `/specs` deliberately contains no Gherkin — its acceptance criteria are observable outcomes, and [`/plan`](../plan/README.md) authors the scenarios per slice.

So the template has exactly one reader: `/plan`'s step 4, and only for the **shape** it implies — happy path, error state, empty state, keyboard accessibility. Its Gherkin is never pasted into a document, and it may not introduce a behavior the spec did not specify. In `/specs`, let the same coverage shape the criteria and nothing more.
