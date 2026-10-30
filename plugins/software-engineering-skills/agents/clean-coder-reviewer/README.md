# Clean Coder Reviewer Agent

A senior clean code reviewer agent that analyses code for readability, maintainability, and expressiveness using Robert C. Martin's *Clean Code* principles, the SOLID principles, and pragmatic trade-offs from *The Pragmatic Programmer* — and checks, on every review, that the code speaks the domain's language rather than the machine's.

## Purpose

The agent reviews code and produces a structured `clean-code-review.md` report categorised by severity — Critical, Warning, and Suggestion — with before/after code examples for every finding, and a Domain Language section on every report.

## When to Use

- Before opening a PR, to catch clean code issues early.
- During code reviews, as a second opinion on design quality.
- When onboarding to a new codebase, to quickly surface its quality patterns.
- After a refactoring session, to validate that the refactored code is genuinely cleaner.

## What It Reviews

| Area | Principles Applied |
|------|--------------------|
| **Domain Language** (always) | Names say what things mean to the business, in the spec's and product's vocabulary — not what the code mechanically does |
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

## Key Design Decision — Domain Language

Every review checks that the code is written in the domain's product and business language. It is never skipped, whatever the size of the scope, and the report always carries a Domain Language section — with no findings, it is the evidence that the check ran.

- **Vocabulary first.** Before judging a name, the agent collects the domain's own words — from `domain-model.md` when the [`domain-modeler`](../domain-modeler/README.md) has written one, then the spec and plan for the change, the domain glossary, the product's UI copy and messages, and the established domain model — and notes where those sources disagree.
- **Meaning, not mechanics.** `dropUnpaidEnrollments(enrollments)`, not `processRows(rows)`; `hasTermClosed()`, not `checkDate()`; a test named for the business scenario, not the HTTP status it returns.
- **Technical language only where the job is technical.** Adapters, infrastructure, and generic utilities may name their mechanism, but the subject keeps its domain name: `EnrollmentRepository`, not `DataRepository`.
- **Questions, not guesses.** Conflicting terms between sources, and concepts the code needs that the domain has not named yet, go to the domain owner as questions — the agent never picks or invents the official term.

This deliberately inverts *Clean Code*'s preference for solution-domain names.

## Knowledge Base

| File | Contents |
|------|----------|
| `references/clean-code-principles.md` | Complete catalogue of clean code principles across 12 areas |
| `references/domain-language.md` | The domain-language rule: establishing the vocabulary, what to check, technical-language signals, where technical language is legitimate, renames, severity |
| `references/pragmatic-considerations.md` | Pragmatic trade-offs: function size guide, comment nuance, test code standards, severity assignment |
| `references/review-report-template.md` | Exact output format for `clean-code-review.md` |

## Output

The agent produces a single file:

- **`clean-code-review.md`** — the Domain Language section (vocabulary sources, terms mapped to code, questions for the domain owner, verdict), structured findings with file/line references, before/after examples, a "What Was Done Well" section, and recommended next steps.

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
