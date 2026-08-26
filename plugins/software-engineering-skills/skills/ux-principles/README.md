# UX Principles Skill

A **reference skill** — loaded by another skill, never invoked directly. Evidence-based UX fundamentals for evaluating a design, writing UX acceptance criteria, and reviewing a wireframe or mockup.

```yaml
user-invocable: false
disable-model-invocation: false   # loaded via the Skill tool by /product-analysis and /specs
```

## What it provides

| Section | Use |
|---|---|
| Nielsen's 10 usability heuristics | One product-owner action per heuristic, plus a 10-question evaluation scored 0–4. Fix 3s and 4s before launch |
| Don Norman's six principles | Affordances, signifiers, mapping, feedback, constraints, conceptual models — and how to apply each in requirements |
| Cognitive load laws | Fitts (target size and distance), Hick (5–7 choices), Miller (chunks of 3–5) |
| Progressive disclosure | The core rule, the two success factors, and the two-level design limit |
| Accessibility essentials | WCAG 2.2 AA under POUR, plus the concrete product-owner minimums |
| UX review checklist | Feedback, navigation, cognitive load, accessibility, consistency |

## Where it is used

- [`/product-analysis`](../product-analysis/README.md) step 5 — always, on any feature with a user-facing surface.
- [`/specs`](../specs/README.md) step 6 — always. Its checklist and the WCAG minimums are what step 8's acceptance criteria are written from, which is why those criteria have to carry numbers: 4.5:1 contrast, 24×24 CSS pixel targets, feedback within 100ms.
