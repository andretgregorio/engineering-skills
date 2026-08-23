# Test Mutation Skill

Mutation testing patterns for verifying **test effectiveness**.

> Code coverage tells you what code your tests execute. Mutation testing tells you whether they would **detect changes** to it. A suite with 100% coverage can still miss 40% of potential bugs.

## Purpose

Answers one question — *"Are my tests actually catching bugs?"* — by introducing small bugs (mutants) into production code and asking whether the tests fail. A mutant the tests do not catch **survived**, and it represents a bug your suite would miss.

This skill is one of the four checks in `/build`'s yellow gate, run after every green. It is also useful on its own against any branch.

## When to use

- Reviewing code changes on a branch.
- Verifying test effectiveness after TDD — right after GREEN.
- Identifying weak tests that appear to have coverage, or finding missing edge cases.
- Validating that a refactor did not weaken the suite.

For *writing* good tests — factories, behavior-driven patterns — load the `testing` skill instead. This one only verifies effectiveness.

## How it works

The systematic branch analysis is four steps: identify the changed code from the diff, generate mental mutants per changed function, ask of each whether a test exercises that path **and would fail** with the mutation applied, then categorize.

| State | Meaning | Action |
|---|---|---|
| Killed | A test failed when the mutant was applied | None — the tests are effective |
| Survived | The tests passed with the mutant active | Add or strengthen a test |
| No Coverage | No test exercises this code | Add a behavior test |
| Timeout | Tests timed out — counted as detected | None |
| Equivalent | The mutant produces identical behavior | None — not a real bug |

Mutation score is `killed / valid`. Below 60% is a weak suite; above 90% is strong, but watch for equivalent mutants.

## What's in the skill

- **Mutation operators** with worked examples: arithmetic, conditional boundaries, equality, logical, boolean literals, block statements, string literals, array declarations, unary, method expressions (`some`/`every`, `filter`/`find`), and optional chaining.
- **Equivalent mutant patterns** and how to handle them, so they are not chased as failures.
- **A branch analysis checklist**, with the red flags that predict surviving mutants and the questions to ask per function.
- **Patterns for strengthening weak tests**: boundary values, both branches of a condition, avoiding identity values, verifying side effects.
- **Stryker integration** (optional), including incremental mode for branches.

## The quick reference

Operators most likely to survive: `>=` vs `>` (boundary untested), `&&` vs `||` (only tested when both are true or both false), `+` vs `-` (only tested with 0), `*` vs `/` (only tested with 1), `some()` vs `every()` (only tested with all matching).

Which is why the test values matter: non-zero for `+`/`-`, greater than 1 for `*` and `/`, arrays with several items, distinct values for comparisons, mixed booleans for logical operators.

**Under `/build`, a surviving mutant is a test defect** — it is never killed by weakening the code under test.

Full definition: [`SKILL.md`](SKILL.md).
