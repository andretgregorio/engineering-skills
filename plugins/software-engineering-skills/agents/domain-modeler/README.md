# Domain Modeler Agent

Defines a feature's domain model and its ubiquitous language from the product documents —
feature descriptions, specs, plans, design docs, story maps — so the implementation names
things the way the business does. It reads the documents and the model already in the code,
and returns `domain-model.md`: every term with its definition, its kind, the **exact code name**
the implementation must use, the synonyms to avoid, and the questions only the domain owner can
answer.

Runs on `opus`, read-only. It returns its model as text; the caller — normally
[`/plan`](../../skills/plan/README.md) — persists it beside the spec.

## Purpose

Every name in a plan becomes a name in the code, and a name that has been persisted or
published is expensive to change. The cheapest place to fix a word is the document, before
anyone types it. This agent exists to fix the words once, from the business's own documents,
so that the plan, the code, the tests, and the review all speak one language — and so that two
words for one thing, or one word for two things, become a question for the domain owner rather
than a column.

## Modes

| Mode | Input | Returns |
|---|---|---|
| **Model** (default) | Feature description, spec, plan, design docs, story map; the repository; an earlier `domain-model.md` to extend | `domain-model.md` |
| **Review** | Code — files, a directory, a diff, a branch — and a domain model | Findings: language drift, business logic in the wrong layer, anemic entities, abstraction leaks, aggregate and context boundary violations, implicit concepts, missing value objects |

## What `domain-model.md` contains

| Section | Content |
|---|---|
| Ubiquitous Language | Term · definition · kind · code name · avoid · status (`agreed` / `proposed` / `provisional`) · source |
| Aggregates and Invariants | Each aggregate, its root, the rules it protects — traced to the spec's acceptance criteria and error rows |
| Lifecycles | One row per transition: from, to, the command that triggers it, the event it emits |
| Domain Events · Policies and Rules | What happens, what it carries; each rule's owner and code name |
| Bounded Contexts | When the feature meets another context it owns, reads from, or publishes to |
| Existing Model in the Code | What is already there, with `path:line`, and whether it matches the language |
| One-Way Doors | The words of persisted and published names — tables, columns, stored enum values, published events, API fields, message keys |
| Language Issues in the Documents | Synonyms, homonyms, vague or technical or undefined terms, drift |
| Questions for the Domain Owner | Each with a proposed answer, the names it blocks, and `Gate: yes / no` |
| Questions for Engineering | Scope calls, such as renaming a drifting code-only class inside this feature |
| Spec Gaps | Behavior the documents disagree on or never state — `/plan` routes these like unresolved spec ambiguities |
| To Verify in the Code | Concepts referenced but not found, and assumptions about code it could not read |

## Decide the structure, propose the words

| Situation | Response |
|---|---|
| Entity or value object, aggregate boundary, which aggregate owns a rule | Decides, records the alternative that lost |
| A term the documents and the code agree on, or one stray word against a clear majority | Adopts it; the stray word goes under Avoid |
| Strong sources genuinely disagree on a term | Proposes one, marks it `proposed`, asks — never settles it silently |
| A concept nobody named | A `provisional` name from the documents' own phrasing, and a question |
| A persisted or published name | Decides its words and lists it as a one-way door; how it is stored is `data-modeler`'s call |
| Existing code uses a different word | Code-only name: recommends renaming it in this feature. Persisted name: keeps it, recommends follow-up. The team decides |
| A gap in behavior, not in words | Lists it as a Spec Gap — not its to model around |
| A new bounded context | Escalates to the human and the `architect` |

## Boundaries

| It does | It never does |
|---|---|
| Read the documents and the code's existing model | Edit code or documents |
| Map every term to one code name in the project's casing | Translate a domain term into a technical one |
| Extend an existing `domain-model.md` | Fork a second model of the same concepts |
| Put language conflicts to the domain owner with a proposal | Pick the business's word for it |
| Model what the documents need | Add speculative aggregates |
| Review code for model structure and drift | Re-do name-level clean-code review (`clean-coder-reviewer`) or general smells (`code-smell-detector`) |

## Knowledge base

[`knowledge-base/domain-modeling.md`](../../knowledge-base/domain-modeling.md), read in full on
every run.

## Related

| Item | Relationship |
|---|---|
| [`/plan`](../../skills/plan/README.md) | Dispatches this agent before naming anything, persists `domain-model.md`, and gates on its blocking questions |
| [`clean-coder-reviewer`](../clean-coder-reviewer/README.md) | Judges every name in a diff against `domain-model.md` |
| [`tdd-developer`](../tdd-developer/README.md) | Names things with `domain-model.md`'s code names |
| [`data-modeler`](../data-modeler/README.md) | Designs the schema; its tables and columns take this model's names |
| [`architect`](../architect/README.md) | Owns bounded-context decisions this agent escalates |

## Example usage

```text
Use the domain-modeler agent to define the vocabulary for docs/specs/REG-41_late-payment-drop/spec.md
```

```text
@"domain-modeler (agent)" the design doc says learner and the story map says student — which goes in the code?
```

```text
@"domain-modeler (agent)" review src/enrollment against docs/specs/REG-41_late-payment-drop/domain-model.md
```
