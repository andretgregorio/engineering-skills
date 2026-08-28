# Spike Conformance Judge Agent

An independent, read-only judge that answers one question: **did this spike answer what was actually asked, and prove it?**

It is the gate [`/spike-investigation`](../../skills/spike-investigation/README.md) runs between the report being written and the throwaway worktrees being destroyed.

## Purpose

A spike's outcome is a claim written by the agent that spent two hours wanting it to be true. That agent is the reader least able to notice that the question quietly got easier at minute forty.

**The characteristic spike failure is not a wrong answer — it is a right answer to a substituted question.** The constraint gets dropped, the second repository gets assumed, the probe gets pointed at the scaffolding. This agent reads the user's original request cold, writes down what answering it would require *before* opening the report, and then re-runs the probe itself rather than trusting the pasted output.

## Why it runs before cleanup

Its strongest check is reproduction, and that only exists while the worktrees do. Judging after the environment is torn down reduces every reproduction verdict to `unverifiable` — and it removes the chance to repair a gap cheaply, while the spike is still standing.

## The eight dimensions

| # | Dimension | The failure it catches |
|---|---|---|
| 1 | Goal fidelity | The constraint in the user's own words was dropped, narrowed, or reinterpreted; the behavior proven is adjacent to the one asked about |
| 2 | Something actually ran | No baseline run, or a baseline that failed because the app was down rather than because the behavior was absent |
| 3 | The probe observes the system | The probe asserts on a value the spike itself hardcoded, or would pass with the spike's core change reverted |
| 4 | Reproduction | The judge re-ran the probe and got something else — an unreproducible proof is not a proof |
| 5 | Repository coverage | One side proven, the other assumed, without the outcome being called `inconclusive` |
| 6 | Outcome honesty | Caveats buried in prose under a `proven` header; `inconclusive` dressed up as `proven with caveats`; a faked seam missing from *what this spike did not prove* |
| 7 | Decision usefulness | An effort estimate asserted rather than derived from the diff; generic risks; unknowns with no resolution named |
| 8 | Containment | Something pushed, a shared resource mutated, a secret in the report or the patch |

Verdicts are `meets` / `falls short` / `unverifiable` per dimension, overall the worst of them. When a dimension is arguably met and arguably not, it returns `falls short`: **a false pass is the expensive error**, because it sends someone to plan and estimate a feature on a proof that was never real.

## Boundaries

- **Never continues the spike.** A gap is reported, not filled — the moment it starts making things work, there is no judge left.
- **Never reviews the spike's code quality.** Spike code is meant to be ugly. Its only code question is whether the probe proves what it claims.
- **Never proposes the fix or the next spike.** What to do about a gap is the human's call.
- **Never writes.** `Read`, `Grep`, `Glob`, and read-only `Bash` — where Bash exists precisely so it can boot the app and run the probe.

## Input and output

**In** — the user's original request *verbatim*, the framed question, the report, the probe script, the captured runs, the diff per repo, and the still-intact worktrees.

**Out** — the reported outcome against the outcome the evidence supports, a verdict per dimension with quoted expectation and re-checkable evidence, the reproduction result, per-repository coverage, every over-claiming sentence quoted, a containment check, and an explicit list of what it could not check.

## Beyond /spike-investigation

Anywhere a spike report is about to become the basis for a decision — auditing an old report before planning on it, or checking a spike someone else ran. Without the worktrees it can only judge on paper, and it says so in its first line.
