# Observability Engineering

Reference knowledge for agents and skills that design, review, or implement monitoring and
observability for software systems.

## What is observability engineering?

Observability is a property of a software system, in the same family as reliability or
performance. It is one of the attributes that make up a system's **dependability** — a
concept borrowed from systems engineering, where dependability is expressed on a spectrum
from low to high, and so is each of its component attributes (availability, reliability,
safety, maintainability, observability, ...).

Concretely: **observability is the ability to understand or debug any given system state**
— including states nobody anticipated when the system was built. This is what separates it
from plain monitoring, which only answers questions decided in advance (dashboards, fixed
alerts). Observability is what lets you ask a *new* question about *unknown* behavior
without shipping new code first.

A useful mental model: **observability and controllability are duals.** A system you cannot
observe is, in a precise mathematical sense, a system you cannot control — you cannot
reliably steer, scale, throttle, or repair what you cannot see the internal state of. Every
control action (rollback, failover, autoscaling, feature-flag kill switch) is only as good
as the observation that triggers it. When designing observability, the working question is
always "what decision does this signal drive?", not "what data can we collect?".

## Measuring observability

Availability can be measured as a number — 99.999% uptime. Observability cannot be reduced
to a single number the same way; it is fundamentally a **qualitative** measurement. Instead
of a metric, define it as a set of questions the team should be able to answer about the
system at any time. If the answer is "no" or "it depends who you ask," that is an
observability gap, independent of whether any dashboard exists.

### The three basic questions

1. **Fault detection** — Do you know an issue is occurring *before* your customers report
   it? (If your first signal of an incident is a support ticket, detection has failed,
   regardless of how much data you collect.)
2. **Triage** — When a critical dependency fails, do you know exactly where to look? (Can
   you narrow "something is wrong" down to a service, a component, or a dependency within
   minutes, without guessing?)
3. **Root cause** — Once you've found the source, can you figure out what caused it? (Can
   you go from "this service is failing" to "this deploy changed this code path, and here's
   the exact input that triggers it"?)

These three map roughly onto the moments of an incident: **detect → triage → explain.** A
mature observability posture answers all three; a system that only satisfies detection
(you get paged) but not triage or root cause (nobody knows where to look, or why) still
produces long incidents with lots of noise.

A fourth question worth adding explicitly when reviewing a system:

4. **Prevention / trend detection** — Can you see a system degrading *before* it crosses an
   alerting threshold? (Slow-burn regressions — a memory leak, a growing queue, a creeping
   error rate — are often invisible to threshold alerts but visible to anyone looking at a
   trend.)

## The observability pillars (signals)

No single signal type answers all the questions above; good observability combines them.

* **Metrics** — numeric, aggregated, cheap to store over long time ranges. Best for trends,
  thresholds, and dashboards. Weakest for explaining *why* — a metric tells you *that*
  latency spiked, rarely *which request* or *why*.
* **Logs** — discrete, timestamped events, often free-text or structured. Best for detail
  and narrative ("what exactly happened, in order"). Weakest for aggregation at scale unless
  structured and indexed well.
* **Traces** — the path of a single request across services/components, with timing per
  hop. Best for triage in distributed systems — they show *where* in a call graph time was
  spent or a failure occurred.
* **Errors / Exceptions** — captured failures, ideally with stack traces and context. Best
  for root cause once the failing component is known. See below.
* **Profiling data** — CPU/memory/allocation profiles, usually sampled continuously in
  production. Best for root-causing resource usage that metrics can only show the symptom
  of ("CPU is at 90%" vs. "this function's allocations are the reason").
* **Product analytics** — business/user-behavior events (funnels, feature usage). Not
  strictly a reliability signal, but part of observability in the broad sense: it answers
  "is the system doing what the business needs," not just "is it up."
* **Security events** — auth failures, permission denials, anomalous access patterns. Often
  routed to a separate pipeline (SIEM) but conceptually the same discipline: telling you
  about a system state (an intrusion attempt, a privilege escalation) that ordinary
  reliability monitoring won't surface.

A common failure mode is treating these as interchangeable or trying to get everything from
one pillar (e.g., grepping logs for what a trace or a metric would answer far more cheaply).
Match the signal to the question: metrics for "how much/how often", traces for "where",
logs/errors for "what exactly and with what data", profiling for "why is this resource-
heavy".

### Correlation across pillars

The pillars are far more valuable connected than isolated. The practical mechanism is
**consistent context propagation**: a trace ID (and span ID) generated at the edge of the
system and threaded through every log line, every span, and — where the tool supports it —
attached as metric exemplars. This is what lets someone jump from "this metric spiked" to
"here are the exact traces in that window" to "here are the log lines and stack traces for
one of them" without re-deriving context by hand (e.g., matching timestamps across systems).
When designing new instrumentation, propagating a trace/request ID is close to a
prerequisite for good triage, not an optional nicety.

OpenTelemetry (OTel) is the current vendor-neutral standard for this: one SDK/API surface
and wire protocol (OTLP) for metrics, logs, and traces, with automatic context propagation
between them. Prefer instrumenting against OTel APIs over a vendor-specific SDK where
practical, since it keeps the backend (Datadog, Grafana stack, Honeycomb, New Relic, etc.)
swappable without re-instrumenting the codebase.

## APM (Application Performance Monitoring)

APM is the set of data — mostly metrics and traces — focused on the performance and health
of requests/operations flowing through a system. Typical questions it should answer:

* What is the **latency** of an operation? Usually expressed as percentiles (p50, p90, p95,
  p99), not an average — averages hide the tail, and the tail is what users and SLOs
  actually feel. Alert and report on p95/p99, not mean latency, unless you have a specific
  reason to want the mean (e.g., cost/throughput modeling).
* What is the **status code / outcome** of an operation (success, client error, server
  error, timeout)?
* Can you **group by status code** to see whether errors are concentrated (e.g., all 5xx
  from one endpoint or one dependency) or diffuse?
* Can you **group by operation/resource** (endpoint, RPC method, queue, job type) to isolate
  which operation is the one degrading, rather than an undifferentiated "the API is slow"?
* What is the **throughput** (requests/sec, jobs/sec)? Needed to interpret every other
  number — a latency spike at 10x normal traffic tells a different story than one at normal
  traffic.
* Can you **isolate which portion of the operation** is taking too long — e.g., a specific
  downstream call or database query, versus in-process compute? This is what distributed
  tracing with span-level breakdown is for.
* Can you **isolate a specific code path** causing CPU or memory spikes? This is where
  profiling data complements APM traces — a trace shows *that* a span was slow, a profile
  shows *what code* was actually running during it.

## Custom metrics

Most monitoring tools let you emit metrics for whatever you choose to measure, beyond what
instrumentation gives you automatically. These are what let observability serve product and
business questions, not just infrastructure health — new alerts and monitors on product
success criteria such as a conversion funnel step or the volume of checkouts in a
marketplace.

Typical questions custom metrics answer:

* How many user sessions actually complete a specific action (e.g., create a resource,
  finish onboarding)?
* What is the conversion rate through a specific funnel step?
* Is a background job's success rate or backlog size within expectations?

**Cardinality is the central risk.** Every unique combination of metric name + label values
becomes its own time series. A counter labeled by `user_id`, raw URL path (with IDs
embedded), or any other high-cardinality/unbounded field can silently turn one metric into
millions of series, which is where monitoring bills — and sometimes the monitoring
backend's own performance — blow up. Practical rules of thumb:

* Label by bounded, low-cardinality dimensions: status code, route *template* (not raw
  path), region, tier, operation name — not user ID, request ID, raw path, or free-text.
* If you need per-user or per-entity granularity, that belongs in logs or traces (which are
  priced and indexed differently), not in a metric label.
* When adding a new label to an existing metric, ask "how many distinct values can this
  take, now and in a year?" before shipping it.

## Errors and Exceptions

This pillar is about the system's ability to capture and expose failures — both errors
handled by application code (e.g., a caught exception logged and possibly retried) and
unhandled ones (crashes, unhandled promise rejections, panics).

Questions this should let you answer:

* Can you see **what errors are happening** in the running system, aggregated by type/
  message, without depending on someone anecdotally noticing them?
* Can you **trace when an error was first introduced** — which deploy/release/commit
  correlates with its first occurrence? (This is what turns "we have errors" into "this
  error started at 14:32 with deploy `abc123`".)
* Can you get a **stack trace** down to the exact file, function, and line where the error
  was thrown, not just a generic message?
* Can you **isolate the user and data/parameters** present when the error occurred —
  request payload, user/tenant ID, feature flags active, environment — so the failure can
  be reproduced or its blast radius (how many users/tenants affected) measured?

Practical implications for instrumentation:

* Errors should be captured with structured context attached (user/tenant ID, request ID,
  relevant input), not just a bare message — the message alone rarely lets you reproduce
  the issue.
* Group/fingerprint errors by type + location, not by raw message string, so that one root
  cause with variable data (e.g., a different failing ID each time) doesn't appear as
  thousands of distinct "unique" errors.
* Treat unhandled exceptions/crashes as a first-class detection signal — a rising unhandled
  exception rate is often the earliest fault-detection signal available, ahead of latency or
  error-rate metrics.
* Redact or avoid capturing sensitive data (PII, secrets, credentials) in error context; the
  same richness that makes errors useful for debugging makes them a common source of
  accidental data exposure if unfiltered.

## Turning signals into action: SLIs, SLOs, and alerting

Collecting signals is necessary but not sufficient — observability earns its keep when it
drives decisions (paging someone, blocking a deploy, triggering an autoscale). The standard
framework (from Google's SRE practice) for connecting metrics to action:

* **SLI (Service Level Indicator)** — a specific metric that reflects user-perceived health,
  e.g., "proportion of requests served in <300ms" or "proportion of requests returning a
  non-5xx status."
* **SLO (Service Level Objective)** — a target for an SLI over a window, e.g., "99.9% of
  requests succeed over a rolling 30 days." The SLO is a decision, not a measurement — it
  should reflect what users actually need, not what the system currently achieves.
* **Error budget** — the allowed amount of "failure" implied by the SLO (0.1% in the
  example above). Once the budget is spent, that's a signal to prioritize reliability work
  over new features — a mechanism for turning an observability signal into a concrete
  process decision, not just a dashboard.

Alerting guidance that follows from this:

* **Alert on symptoms (SLIs), not causes.** Page on "users are experiencing errors/latency,"
  not on every internal cause that *might* lead there (e.g., don't page on CPU% directly;
  page on the latency/error SLI, and use CPU as a diagnostic signal once paged).
* **Every page should be actionable.** If an alert fires and the response is always "ignore
  it, that's normal," the threshold or the alert itself is wrong — fix the alert, don't
  train the on-call to ignore pages (that erodes trust in every other alert too).
* **Use burn-rate alerting for SLOs** — alert faster when the error budget is being consumed
  quickly (a sharp incident) and slower/lower-urgency when it's a slow leak, rather than one
  static threshold for both.
* **Prefer a few high-quality alerts over many noisy ones.** Alert fatigue is itself an
  observability failure — it degrades fault detection just as much as missing
  instrumentation does.

## Structured logging and instrumentation conventions

Cross-cutting practices worth applying regardless of which pillar or vendor is in use:

* **Log in structured form (JSON or key-value), not free text**, so logs are queryable and
  aggregable, not just greppable. A log line's fields should be as stable and intentional as
  an API's.
* **Every log line, span, and error in a request's path should carry the same correlation
  ID(s)** (trace ID, request ID) — this is what makes the pillars connect (see
  "Correlation across pillars" above).
* **Log levels should map to action, not verbosity for its own sake**: `ERROR` = needs
  human attention, `WARN` = degraded but self-recovering, `INFO` = notable business/state
  events, `DEBUG` = development-time detail, normally off in production.
* **Sampling is a cost/fidelity trade-off, not a compromise to avoid.** At high volume, 100%
  trace capture is often neither affordable nor necessary — sample, but sample *intelligently*
  (e.g., always keep errors and slow outliers at 100%, sample steady-state success traffic
  down).
* **Dashboards should answer the three basic questions**, not just display "what data we
  have." A dashboard built by asking "what can we plot?" tends toward noise; one built by
  asking "how would we detect/triage/root-cause an incident here?" tends toward signal.
* **Treat observability as part of the feature, not an afterthought bolted on after an
  incident.** Instrumentation added *after* the first production surprise is instrumentation
  that only covers the last incident, not the next one.

## Common anti-patterns

* **Monitoring without a question in mind** — collecting a metric/log/trace because it's
  easy to emit, without a scenario in which someone would look at it.
* **Averages instead of percentiles** for latency — hides the tail that SLOs and users care
  about.
* **Unbounded-cardinality labels** on metrics (see Custom metrics above) — the most common
  cause of runaway observability cost.
* **Logging without correlation IDs** — turns every incident into manual timestamp-matching
  across systems.
* **Alerting on causes instead of symptoms** — pages fire for internal conditions that don't
  always translate to user impact, training responders to ignore pages.
* **No error budget / no SLOs** — "reliability" becomes a vague aspiration instead of a
  number the team can trade off against feature velocity in a principled way.
* **Capturing sensitive data in logs/errors** — PII, secrets, or credentials leaking into a
  system meant to be broadly queryable and often longer-retained than the primary datastore.
