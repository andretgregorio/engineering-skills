# UX TUI Patterns Skill

A **reference skill** — loaded by another skill, never invoked directly. Terminal and CLI interface patterns, for when the surface under refinement is a command-line tool.

```yaml
user-invocable: false
disable-model-invocation: false   # loaded via the Skill tool by /specs, /plan, and /product-analysis
```

## What it provides

| Section | Use |
|---|---|
| CLI argument design | `program subcommand [flags] [arguments]`, short and long flags, the always-present flags, verb/noun subcommand consistency |
| Interactive TUI patterns | Framework architectures and the Elm-architecture model/update/view split; selection patterns |
| Colour and formatting | Conventions, the `--no-color` and not-a-TTY rules, formatting patterns |
| Error message design | A good and a bad example side by side, plus the guidelines that separate them |
| Help text design | `--help` structure and the principles behind it |
| Output design | Human-readable default, machine-parseable alternative, and the output contract you are promising |
| Progress and responsiveness | What to print inside 100ms, and what a long operation owes the user |
| Anti-patterns and review checklist | Discoverability, output, error handling, responsiveness, configuration |

## Where it is used

- [`/specs`](../specs/README.md) step 6 — the pattern choice for a CLI/TUI surface. Every choice cites this skill's "when to use" and names the alternative it beat.
- [`/product-analysis`](../product-analysis/README.md) step 5 — only when a platform constraint changes product scope ("it has to be scriptable in CI").
- [`/plan`](../plan/README.md) step 4 — for the coverage a UI scenario set owes: the review checklist's discoverability, output, error-handling and responsiveness sections are the shape to cover, not text to paste.
