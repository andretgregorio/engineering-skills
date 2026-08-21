# Clean Coder Reviewer Agent

A senior clean code reviewer agent that analyses code for readability, maintainability, and expressiveness using Robert C. Martin's *Clean Code* principles, the SOLID principles, and pragmatic trade-offs from *The Pragmatic Programmer*.

## Purpose

The agent reviews code and produces a structured `clean-code-review.md` report categorised by severity — Critical, Warning, and Suggestion — with before/after code examples for every finding.

## When to Use

- Before opening a PR, to catch clean code issues early.
- During code reviews, as a second opinion on design quality.
- When onboarding to a new codebase, to quickly surface its quality patterns.
- After a refactoring session, to validate that the refactored code is genuinely cleaner.

## What It Reviews

| Area | Principles Applied |
|------|--------------------|
| **Naming** | Intent-revealing names, pronounceable, searchable, no encodings |
| **Functions & Methods** | Single responsibility, single abstraction level, pragmatic size |
| **Comments** | Necessary vs. redundant, intent-explaining, no compensatory comments |
| **Formatting** | Vertical/horizontal clarity, reading order, team consistency |
| **Error Handling** | Exceptions over error codes, no null returns, informative exceptions |
| **Classes** | SRP, high cohesion, low coupling, appropriate encapsulation |
| **SOLID** | All five principles |
| **DRY / YAGNI** | Duplication, speculative generality |
| **Tests** (if present) | Readability, one concept per test, FIRST properties |

## Key Design Decision — Function Size

This agent applies a **pragmatic** approach to function size. It does **not** flag every function that exceeds 10 or 20 lines. Instead, it judges functions by:

- **Cohesion**: does the function do one coherent thing?
- **Single level of abstraction**: does it avoid mixing high-level orchestration with low-level detail?
- **Navigational cost**: would splitting it require constant file-jumping to follow the logic?

A 40-line function that reads clearly top-to-bottom is cleaner than six 7-line helpers with forced names scattered across files.

## Knowledge Base

| File | Contents |
|------|----------|
| `references/clean-code-principles.md` | Complete catalogue of clean code principles across 12 areas |
| `references/pragmatic-considerations.md` | Pragmatic trade-offs: function size guide, comment nuance, test code standards, severity assignment |
| `references/review-report-template.md` | Exact output format for `clean-code-review.md` |

## Output

The agent produces a single file:

- **`clean-code-review.md`** — structured findings with file/line references, before/after examples, a "What Was Done Well" section, and recommended next steps.

## Related Agents

| Agent | Relationship |
|-------|-------------|
| `code-smell-detector` | Detects structural code smells (God Objects, Feature Envy, etc.); complements the clean code review |
| `refactoring-expert` | Provides refactoring techniques to apply after a review |
| `atdd-developer` | Implements changes identified in the review using TDD |
| `test-design-reviewer` | Reviews test quality specifically |

## Example Usage

```text
@"clean-coder-reviewer (agent)" review the OrderService class in src/services/order.service.ts
```

```text
Use the clean-coder-reviewer agent to review the files changed in my branch
```

```text
@"clean-coder-reviewer (agent)" review this entire module: src/payments/
```
