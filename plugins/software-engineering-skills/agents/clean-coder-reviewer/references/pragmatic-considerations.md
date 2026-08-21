# Pragmatic Considerations for Clean Code Reviews

This file captures deliberate nuances and trade-offs that must override a rigid, mechanical application of clean code rules.

---

## 1. Function Size — The Nuanced View

### What the books say
Robert C. Martin advises that functions should be *small* — originally suggesting functions should rarely exceed 20 lines, and in an ideal world be even shorter. He argues that small functions force good naming and encourage single responsibility.

### The pragmatic reality

**A bigger, well-written function can be cleaner than many small, fragmented ones.**

The *real* goals behind the "small function" rule are:
1. **Single responsibility** — the function does one coherent thing.
2. **Single level of abstraction** — it does not mix high-level orchestration with low-level detail.
3. **Comprehensibility** — a reader can understand it without jumping around.

When a function is mechanically split into many tiny pieces purely to reduce line count, the result is often *worse*:
- The reader must ping between files or scroll through dozens of private helpers to follow the logic.
- Fragments lose their narrative context — each piece is too small to be meaningful on its own.
- Naming becomes forced and artificial ("doStep1", "processPartA").
- The cognitive load of navigating the call graph can exceed the load of reading a slightly longer, cohesive function.

### Decision heuristic for the reviewer

Ask the following questions, **not** "is this function more than N lines?"

| Question | If YES → concern | If NO → likely fine |
|----------|-----------------|---------------------|
| Does it mix multiple levels of abstraction? (e.g., business rule + SQL + formatting in the same block) | High priority finding | ✓ |
| Does it do more than one distinct, nameable thing? | Flag SRP violation | ✓ |
| Would extracting a sub-function have a natural, self-explanatory name? | Suggest extraction | ✓ |
| Would extraction *require* passing many parameters back and forth? | Extraction adds complexity | Leave it |
| Can you read it top-to-bottom and understand it without switching files? | ✓ | Flag if not |
| Does it contain deep nesting (4+ levels) that hides control flow? | Flag for simplification | ✓ |

### Threshold guidance (language-aware)

These are *soft* thresholds, not hard rules. Context and cohesion always win.

| Scenario | Threshold before raising concern |
|----------|----------------------------------|
| Pure orchestration / workflow (calls other functions) | 40–60 lines is reasonable |
| Business rule or calculation (dense logic) | 30–50 lines is often fine |
| Switch/match/dispatch with many cases | 50–80 lines can be fine; extract cases only when they gain clarity |
| Parsing / serialisation (inherently linear) | 40–70 lines; judge by readability, not count |
| Single-level, cohesive algorithm | No fixed limit; judge by comprehension |
| Mixed abstraction levels | Flag regardless of size |
| Deeply nested blocks (4+ levels) | Flag regardless of size |

### Anti-patterns to flag regardless of function size
- Functions that require extensive comments to explain their sections — if you need section headers inside a function, it is doing multiple things.
- Functions whose name no longer accurately describes what they do due to accumulated responsibilities.
- Functions with more than 3–4 parameters (regardless of length) — parameter overload hints at design issues.

---

## 2. Comments — When They Are Genuinely Valuable

The "no comments" principle is often misunderstood. Comments are not inherently bad; *redundant*, *misleading*, or *compensatory* comments are bad.

**Comments that should always be praised:**
- Explaining a non-obvious business rule: `// VAT is applied before discounts per EU directive 2006/112`.
- Documenting a deliberate trade-off: `// Intentionally O(n²) — n ≤ 10 in practice, clarity wins over optimisation`.
- Warning about a footgun: `// Do not cache this — the underlying session is not thread-safe`.
- Public API documentation (JSDoc, Javadoc, Python docstrings) on exported interfaces.

**Do not flag comments that:**
- Explain *why*, not *what*.
- Capture business domain knowledge a future reader would not otherwise have.
- Reference the external standard, ticket, or RFC that mandated a specific behaviour.

---

## 3. Test Code vs. Production Code Standards

Test code lives in a different trade-off space:
- **Longer arrange sections are acceptable** if they make the test's scenario crystal clear.
- **Some duplication in tests is acceptable** when DRY abstractions would reduce test readability.
- **Test helper/builder patterns** are encouraged — but they must be clear about what they are building.
- **Magic numbers in tests are acceptable** when they are the literal values under test (e.g., `assertEquals(42, result)` where 42 is the expected output of a calculation).

Flag in test code:
- Tests that assert multiple unrelated things.
- Test names that don't describe the scenario and expected outcome.
- Copy-pasted setup code that is clearly the same scenario with minor variation (introduce a parameterised test).
- Tests that test implementation details instead of behaviour.

---

## 4. Consistency Beats Perfection

If the codebase has an established pattern — even one that is not the "cleanest" possible — introducing a different approach in isolation creates *inconsistency*, which is itself a clean code violation.

**When reviewing:**
- Note the existing conventions first.
- Flag a pattern as a clean code issue only if it consistently impairs readability or maintenance.
- Suggest refactoring the *whole* pattern (not just one instance) if the violation is widespread, and note that fixing one occurrence in isolation would be misleading.

---

## 5. The Pragmatic Programmer Principles (Hunt & Thomas)

These complement Clean Code and provide additional review lenses:

| Principle | Reviewer Application |
|-----------|---------------------|
| **DRY** — Don't Repeat Yourself | Flag duplicated logic; distinguish from *similar* code that has different business meaning |
| **Orthogonality** | Flag tight coupling between unrelated concerns — a change to one should not require changes to others |
| **Reversibility** | Flag irreversible design decisions made too early; encourage abstractions at integration points |
| **Tracer Bullets** | Not a review concern; an implementation strategy |
| **Broken Windows** | Low quality in one area propagates. Note when a file or module is clearly in worse shape than the rest |
| **YAGNI (You Aren't Gonna Need It)** | Flag speculative generality — abstractions, parameters, or modes that serve no current use case |
| **Tell, Don't Ask** | Flag code that queries an object's state to decide what to do with it — that logic belongs in the object |
| **Shy Code (Law of Demeter)** | Flag train wrecks and deep property traversal chains |
| **Named Constants Over Magic Numbers** | Flag hard-coded values that carry business meaning |
| **Fail Fast** | Flag code that defers error detection — validate inputs early |

---

## 6. Severity Assignment Guide

Use this when rating findings in the review report.

| Severity | Description | Examples |
|----------|-------------|---------|
| **Critical** | Impairs maintainability, correctness, or safety. Must be addressed before merge. | SRP violation causing tight coupling; swallowed exception hiding real errors; misleading function name; Demeter violation leaking internals; untested business-critical path |
| **Warning** | Reduces clarity or introduces technical debt. Should be addressed soon. | Inconsistent naming; function mixing two abstraction levels; magic number in business logic; redundant or misleading comment; duplicated logic block |
| **Suggestion** | A quality improvement that is not urgent. Nice to have. | Renaming for slightly better clarity; extracting a sub-function that has a natural name; adding a clarifying comment; removing a TODO that was already done |

Never assign Critical to pure style preferences (spacing, bracket placement) unless the project has a linter that enforces it and the code violates that linter.
