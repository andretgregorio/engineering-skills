# Monitor PR Skill

Takes **one open pull request** and drives it all the way to **merged**.

```
/monitor-pr <owner/repo> <pr-number> [--merge-method squash|merge|rebase] [--repo-path <path>]
```

## Purpose

`/open-pr` opens a PR and stops. [`pr-monitor`](../../agents/pr-monitor/README.md) takes it to *ready for human review* and, by its own contract, never merges. This skill is the last stretch: it waits for the review, settles what the review asks for, and merges.

## Mergeable has an exact definition

> Every CI check on the PR's current head is **green**, **and** an **approving code review** stands on that same head, **and** every review finding is **implemented or answered**, **and** GitHub reports the PR as mergeable with no conflicts.

All four, on the same commit, at the same moment. A PR that is green but unreviewed is not mergeable; neither is one approved three pushes ago.

**The review always comes** — even when it is one word saying *approved*. So an absent review is never a reason to merge, only a reason to keep waiting. Waiting is the correct behaviour, not a stall.

## What it does

1. **Preflight** — the PR is open, not a draft, and you can actually push and merge. It takes its own worktree, never one someone else is using.
2. **Read the whole state each round** — checks, reviews *with the commit each was submitted against*, review threads, comments, merge state. One GraphQL call carries the review picture, because `gh pr view --json reviews` omits the SHA the gate depends on.
3. **Act** — red check or outstanding finding, it dispatches a `pr-monitor` agent to do the repairs; base moved, it merges the base in; nothing to do, it waits.
4. **Settle every finding** — implemented, or answered with evidence. Never silently left.
5. **Gate on a live approval** — approving review submitted against the current head SHA.
6. **Merge** — the repo's own method, and stop dead if GitHub refuses.

## Who does what

The thing that fixes the code is deliberately not the thing that decides the code is good enough to ship.

| | `/monitor-pr` (this skill) | `pr-monitor` (the agent it dispatches) |
|---|---|---|
| Owns the loop and the stop condition | Yes | No — it has its own, narrower one |
| Root-causes failing checks, pushes fixes | Dispatches it | Yes |
| Applies or answers review findings | Decides the response | Carries it out |
| Waits for the code review | Yes | No — `ready` is where it stops |
| Judges whether an approval is live | Yes | Never |
| Merges | Yes — and only this skill does | Never |

## Every finding is implemented or answered

Two responses, never a third. **Implement it** when the finding is right, or when you cannot make a convincing case that it is wrong — most findings are right, and the diff is the reply. **Answer it** when it genuinely does not hold: what it claims, why it does not hold here, and the evidence — `path:line`, the guard that exists, the test that covers it. *If that paragraph cannot be written convincingly, the finding is right.*

Two things are never answered away: a real finding that needs scope beyond this PR (reported as follow-up, not built), and a human's design objection (theirs to decide).

## The stale-approval rule

An approving review counts **only if it was submitted against the current head SHA**. This is stricter than GitHub, which keeps `reviewDecision: APPROVED` across new pushes unless the repo enables dismiss-stale-reviews — so the skill checks `commit.oid` against `headRefOid` rather than trusting the decision field.

Push fixes after an approval and the gate shuts again: it re-requests review and keeps waiting. The one exception is a **clean merge of the base that left the PR's own diff unchanged** — verified, not assumed.

## Waiting, without waiting forever

The loop runs under the built-in **`/loop` skill in dynamic mode**, self-pacing: roughly a CI run's own duration while a run is in flight, 15–30 minutes while waiting on a reviewer, a long fallback while a dispatched agent works. Never `sleep`.

Nothing moved for three checks → it reports `waiting` once, naming what it waits on and who owes it, then slows down. Nothing moved for two hours → `blocked`. A monitor that waits silently forever is indistinguishable from one that died.

## Boundaries

| It does | It never does |
|---|---|
| Merges once all four conditions hold on one SHA | Approves the PR itself, or counts a review it authored |
| Root-causes a red check and fixes the cause | Skips, disables, quarantines, or deletes a test to get green |
| Reports GitHub's exact refusal and stops | Merges with `--admin`, or bypasses protection or a required check |
| Merges the base in and resolves conflicts | Rebases, amends, or force-pushes a branch it does not own |
| Reports a finding that needs wider scope | Widens the PR to build it |
| States its reasoning once on a disagreement | Argues with a human reviewer |
| Waits for the review that is always coming | Treats an absent review as consent |

Full definition, including the exact `gh` calls and the report format: [`SKILL.md`](SKILL.md).
