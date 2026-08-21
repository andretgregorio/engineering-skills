# Common Design Trade-offs in Technical Investigations

This document catalogs common trade-offs that emerge during technical investigations, helping you recognize patterns and guide user decisions.

## Trade-off Categories

### 1. Domain Design Trade-offs
### 2. Data Model Trade-offs
### 3. API Design Trade-offs
### 4. Performance vs X Trade-offs
### 5. Complexity vs X Trade-offs

---

## 1. Domain Design Trade-offs

### Bounded Context Granularity

#### Coarse-Grained (Fewer, Larger Bounded Contexts)

**Example:** Keep everything in one "Transactions" BC

**Pros:**
- ✅ Simpler to understand (one mental model)
- ✅ Easier to implement (no cross-BC coordination)
- ✅ Fewer integration points
- ✅ Immediate consistency (single transaction boundary)
- ✅ Lower operational complexity

**Cons:**
- ❌ God object risk (BC becomes too large)
- ❌ Team scaling issues (everyone works in same BC)
- ❌ Harder to evolve independently
- ❌ Weaker boundaries (easy to leak concerns)
- ❌ Deployment coupling (must deploy together)

**When to Choose:**
- Early in project lifecycle (YAGNI principle)
- Small team (< 5 people)
- Uncertain about domain boundaries
- Priorities: simplicity, speed of delivery

---

#### Fine-Grained (More, Smaller Bounded Contexts)

**Example:** Separate "Transactions" BC and "Scheduling" BC

**Pros:**
- ✅ Strong separation of concerns
- ✅ Team scaling (teams own separate BCs)
- ✅ Independent evolution (can change one without affecting others)
- ✅ Clear ownership and boundaries
- ✅ Deployment independence

**Cons:**
- ❌ Higher cognitive load (must understand multiple BCs)
- ❌ Integration complexity (cross-BC coordination)
- ❌ Eventual consistency challenges
- ❌ More infrastructure overhead
- ❌ Distributed system problems (network, latency, partial failures)

**When to Choose:**
- Mature product with clear boundaries
- Large team (> 5 people) or multiple teams
- Different parts evolve at different rates
- Priorities: scalability, team independence

---

### Synchronous vs Asynchronous Integration

#### Synchronous (Direct API Calls, Shared Database)

**Example:** Scheduling BC directly calls Transactions BC API

**Pros:**
- ✅ Immediate consistency (data is always up-to-date)
- ✅ Simpler to reason about (request → response)
- ✅ Easier error handling (immediate feedback)
- ✅ Lower operational complexity (no message broker)

**Cons:**
- ❌ Tight coupling (caller waits for callee)
- ❌ Cascading failures (if one BC is down, others fail)
- ❌ Lower availability (SLA = product of all dependencies)
- ❌ Performance bottleneck (synchronous wait)
- ❌ Harder to scale independently

**When to Choose:**
- Strong consistency required (e.g., financial transactions)
- Simple operations with low latency
- Error handling must be immediate
- Priorities: correctness, simplicity

---

#### Asynchronous (Domain Events, Message Queues)

**Example:** Scheduling BC publishes "ScheduleTriggered" event, Transactions BC listens

**Pros:**
- ✅ Loose coupling (caller doesn't wait)
- ✅ Higher availability (services fail independently)
- ✅ Better scalability (can scale consumers independently)
- ✅ Temporal decoupling (producer and consumer don't need to be online simultaneously)
- ✅ Audit trail (events are logged)

**Cons:**
- ❌ Eventual consistency (data may be stale)
- ❌ Complexity (must handle out-of-order events, retries, idempotency)
- ❌ Harder to debug (distributed tracing needed)
- ❌ Infrastructure overhead (message broker, monitoring)
- ❌ Error handling is asynchronous (harder to communicate failures)

**When to Choose:**
- High-volume operations
- Non-critical consistency (e.g., analytics, notifications)
- Need to scale independently
- Priorities: availability, scalability, resilience

---

## 2. Data Model Trade-offs

### Normalization vs Denormalization

#### Normalized (3NF or higher)

**Example:** Separate tables for `transactions`, `categories`, `accounts` with foreign keys

**Pros:**
- ✅ Data integrity (single source of truth)
- ✅ No redundancy (storage efficient)
- ✅ Easy to update (update in one place)
- ✅ Flexible querying (can join in any direction)

**Cons:**
- ❌ Read performance (requires joins)
- ❌ Complex queries (multi-table joins)
- ❌ N+1 query risk (ORM anti-pattern)
- ❌ Harder to cache (must invalidate related entities)

**When to Choose:**
- Write-heavy workloads
- Data consistency is critical
- Storage cost is a concern
- Priorities: correctness, storage efficiency

---

#### Denormalized (Duplicate Data for Reads)

**Example:** Store category name directly in `transactions` table (duplicating from `categories`)

**Pros:**
- ✅ Read performance (no joins needed)
- ✅ Simple queries (single table)
- ✅ Easier to cache (self-contained entities)
- ✅ Resilient to related entity changes (old data unchanged)

**Cons:**
- ❌ Data redundancy (storage cost)
- ❌ Update complexity (must update in multiple places)
- ❌ Risk of inconsistency (data can drift)
- ❌ Harder to maintain (must keep copies in sync)

**When to Choose:**
- Read-heavy workloads (10:1 read:write or higher)
- Performance is critical
- Data rarely changes
- Priorities: read performance, simplicity

---

### Single Table vs Multiple Tables

#### Single Table with JSONB/Polymorphism

**Example:** One `schedules` table with JSONB `recurrence_rule` column

**Pros:**
- ✅ Flexible schema (easy to add new recurrence types)
- ✅ Simple queries (one table to scan)
- ✅ No migrations for schema changes (just JSON structure)
- ✅ Good for prototyping (fast iteration)

**Cons:**
- ❌ Weak type safety (JSONB is unstructured)
- ❌ Harder to query (must parse JSON)
- ❌ No foreign key constraints (can't enforce referential integrity on JSON fields)
- ❌ Index limitations (can index JSONB but less efficient)
- ❌ ORM support varies (not all ORMs handle JSONB well)

**When to Choose:**
- Schema is evolving rapidly
- Many optional fields
- Need flexibility for new types
- Priorities: flexibility, speed of iteration

---

#### Multiple Normalized Tables

**Example:** `schedules`, `recurrence_rules`, `execution_logs` as separate tables

**Pros:**
- ✅ Strong type safety (database enforces schema)
- ✅ Efficient queries (can use indexes)
- ✅ Foreign key constraints (referential integrity)
- ✅ Better ORM support (maps to objects cleanly)
- ✅ Easier to reason about (structured schema)

**Cons:**
- ❌ Rigid schema (requires migrations for changes)
- ❌ More complex queries (joins required)
- ❌ Slower iteration (schema changes are costly)
- ❌ More tables to manage

**When to Choose:**
- Schema is stable
- Type safety is important
- Complex queries with filtering/sorting
- Priorities: correctness, query performance

---

### Eager Loading vs Lazy Loading

#### Eager Loading (Fetch Related Entities Upfront)

**Example:** Fetch transaction with category, account, and tags in one query

**Pros:**
- ✅ No N+1 queries (all data loaded at once)
- ✅ Predictable performance (fixed number of queries)
- ✅ Good for list views (need related data)

**Cons:**
- ❌ Over-fetching (may load unnecessary data)
- ❌ Slower initial query (larger result set)
- ❌ Higher memory usage (more data in memory)

**When to Choose:**
- Know you'll need related data
- List views that display related entities
- Priorities: avoiding N+1, predictable performance

---

#### Lazy Loading (Fetch Related Entities On Demand)

**Example:** Fetch transaction first, then fetch category only if needed

**Pros:**
- ✅ Minimal initial query (only load what's needed)
- ✅ Lower memory usage (lazy load on access)
- ✅ Good for detail views (not all relations needed)

**Cons:**
- ❌ N+1 query risk (easy to trigger accidental queries)
- ❌ Unpredictable performance (hidden queries)
- ❌ Harder to debug (queries happen implicitly)

**When to Choose:**
- Uncertain which relations are needed
- Detail views where only some relations are accessed
- Priorities: memory efficiency, minimal initial load

---

## 3. API Design Trade-offs

### Resource-Oriented vs Action-Oriented

#### Resource-Oriented (RESTful CRUD)

**Example:** `POST /api/v1/schedules`, `PATCH /api/v1/schedules/:id`

**Pros:**
- ✅ Standard REST semantics
- ✅ Easy to understand (maps to CRUD)
- ✅ Cacheable (GET is safe and idempotent)
- ✅ Consistent patterns

**Cons:**
- ❌ Chatty (may need multiple requests for complex operations)
- ❌ Doesn't map well to actions (e.g., "activate", "pause")
- ❌ Can lead to REST anti-patterns (e.g., verbs in URLs)

**When to Choose:**
- Simple CRUD operations
- API consumers expect REST
- Caching is important
- Priorities: standard, simplicity, caching

---

#### Action-Oriented (RPC-style)

**Example:** `POST /api/v1/schedules/:id/activate`, `POST /api/v1/schedules/:id/pause`

**Pros:**
- ✅ Explicit actions (clear intent)
- ✅ Single request for complex operations
- ✅ Maps well to use cases (one endpoint per action)
- ✅ Less chatty (fewer round-trips)

**Cons:**
- ❌ Less RESTful (doesn't follow pure REST)
- ❌ Harder to cache (POST is not safe/idempotent)
- ❌ Can lead to endpoint explosion (one per action)

**When to Choose:**
- Complex actions that don't map to CRUD
- Performance matters (reduce round-trips)
- Client simplicity over REST purity
- Priorities: explicitness, performance

---

### Coarse-Grained vs Fine-Grained Endpoints

#### Coarse-Grained (Fewer, Larger Operations)

**Example:** `POST /api/v1/schedules` accepts full schedule with nested recurrence rules

**Pros:**
- ✅ Fewer API calls (less chatty)
- ✅ Transactional (create schedule + rules atomically)
- ✅ Simpler for clients (one request)
- ✅ Lower latency (fewer round-trips)

**Cons:**
- ❌ Less flexible (must provide all data at once)
- ❌ Harder to reuse (each client may need different combinations)
- ❌ Larger payload (may send unnecessary data)
- ❌ Harder to cache (cache invalidation is coarser)

**When to Choose:**
- Mobile clients (minimize round-trips)
- Transactional operations (must happen atomically)
- Priorities: performance, simplicity for clients

---

#### Fine-Grained (More, Smaller Operations)

**Example:** `POST /api/v1/schedules` creates schedule, then `POST /api/v1/schedules/:id/rules` adds rules

**Pros:**
- ✅ Flexible (compose operations as needed)
- ✅ Reusable (clients can mix and match)
- ✅ Smaller payloads (send only what's needed)
- ✅ Easier to cache (finer-grained invalidation)

**Cons:**
- ❌ Chattier (more API calls)
- ❌ Higher latency (multiple round-trips)
- ❌ Not transactional (must coordinate multiple calls)
- ❌ More complex for clients (must orchestrate)

**When to Choose:**
- Web clients (latency is acceptable)
- Need flexibility (different clients need different combinations)
- Priorities: flexibility, caching

---

### Pagination: Offset vs Cursor

#### Offset-Based Pagination

**Example:** `GET /api/v1/transactions?page=2&limit=20`

**Pros:**
- ✅ Simple to implement (OFFSET/LIMIT in SQL)
- ✅ Easy to jump to arbitrary page (good for UIs with page numbers)
- ✅ Total count is easy to calculate

**Cons:**
- ❌ Performance degrades with deep pagination (OFFSET 10000 is slow)
- ❌ Inconsistent results (if data changes between requests, items can be duplicated or skipped)
- ❌ Not suitable for real-time data

**When to Choose:**
- Small datasets (< 10K records)
- Need to jump to arbitrary pages
- Data changes infrequently
- Priorities: simplicity, UI flexibility

---

#### Cursor-Based Pagination

**Example:** `GET /api/v1/transactions?cursor=abc123&limit=20`

**Pros:**
- ✅ Consistent performance (no OFFSET, uses index)
- ✅ Consistent results (cursor is stable even if data changes)
- ✅ Good for infinite scroll (mobile/web feeds)
- ✅ Suitable for real-time data

**Cons:**
- ❌ Can't jump to arbitrary page (must navigate sequentially)
- ❌ Total count is expensive to calculate
- ❌ More complex to implement (cursor encoding/decoding)

**When to Choose:**
- Large datasets (> 10K records)
- Real-time data (feeds, logs)
- Mobile apps (infinite scroll)
- Priorities: performance, consistency

---

## 4. Performance vs X Trade-offs

### Performance vs Correctness

#### Optimizing for Performance

**Example:** Use eventual consistency, caching, denormalization

**Pros:**
- ✅ Low latency
- ✅ High throughput
- ✅ Scales well

**Cons:**
- ❌ Risk of stale data
- ❌ Risk of inconsistency
- ❌ Harder to reason about correctness

**When to Choose:**
- Non-critical data (e.g., view counts, likes)
- Read-heavy workloads
- Priorities: user experience, scale

---

#### Optimizing for Correctness

**Example:** Use strong consistency, normalized schema, transactions

**Pros:**
- ✅ Data is always correct
- ✅ Easier to reason about
- ✅ Fewer edge cases

**Cons:**
- ❌ Higher latency
- ❌ Lower throughput
- ❌ Harder to scale

**When to Choose:**
- Critical data (e.g., financial transactions, inventory)
- Write-heavy workloads
- Priorities: correctness, trust

---

### Performance vs Maintainability

#### Optimizing for Performance

**Example:** Hand-tuned queries, caching layers, denormalization

**Pros:**
- ✅ Low latency
- ✅ Efficient resource usage

**Cons:**
- ❌ Complex codebase
- ❌ Harder to debug
- ❌ Requires deep expertise

**When to Choose:**
- High-traffic endpoints
- Tight latency SLOs
- Priorities: performance, resource cost

---

#### Optimizing for Maintainability

**Example:** ORM, normalized schema, simple queries

**Pros:**
- ✅ Easy to understand
- ✅ Easy to change
- ✅ Lower developer ramp-up time

**Cons:**
- ❌ May be slower
- ❌ May use more resources

**When to Choose:**
- Low-traffic endpoints
- Rapidly evolving features
- Priorities: development speed, team scaling

---

## 5. Complexity vs X Trade-offs

### Complexity vs Flexibility

#### High Complexity, High Flexibility

**Example:** Pluggable scheduling engine with strategy pattern

**Pros:**
- ✅ Supports many use cases
- ✅ Easy to add new types
- ✅ Extensible architecture

**Cons:**
- ❌ Over-engineering risk
- ❌ Harder to understand
- ❌ Higher maintenance burden

**When to Choose:**
- Many known use cases
- Anticipate frequent changes
- Priorities: extensibility, future-proofing

---

#### Low Complexity, Low Flexibility

**Example:** Hard-coded scheduling rules (daily, weekly, monthly)

**Pros:**
- ✅ Simple to implement
- ✅ Easy to understand
- ✅ Fast to ship

**Cons:**
- ❌ Hard to extend (must modify code for new types)
- ❌ Brittle (changes ripple through codebase)

**When to Choose:**
- Few, well-defined use cases
- Uncertain requirements (YAGNI principle)
- Priorities: speed, simplicity

---

### Complexity vs Performance

#### High Complexity, High Performance

**Example:** Custom caching layer with fine-grained invalidation

**Pros:**
- ✅ Optimal performance
- ✅ Efficient resource usage

**Cons:**
- ❌ Complex to implement
- ❌ Complex to debug
- ❌ Higher risk of bugs

**When to Choose:**
- Performance is critical (SLOs, user experience)
- Have engineering resources to maintain complexity
- Priorities: performance, efficiency

---

#### Low Complexity, Acceptable Performance

**Example:** Simple Redis cache with TTL

**Pros:**
- ✅ Easy to implement
- ✅ Easy to understand
- ✅ Good enough performance

**Cons:**
- ❌ Suboptimal performance (may serve stale data)
- ❌ Less control (TTL is coarse-grained)

**When to Choose:**
- Performance is acceptable (not critical path)
- Prefer simplicity over optimization
- Priorities: maintainability, shipping speed

---

## Decision Framework

When faced with a trade-off, guide the user with these questions:

### 1. Identify the Trade-off
- "This decision has a trade-off between [X] and [Y]."
- "If we optimize for [X], we give up [Y]."

### 2. Understand Priorities
- "Which matters more in this context: [X] or [Y]?"
- "What are the non-negotiable requirements?"
- "What can we accept as 'good enough'?"

### 3. Quantify Impact
- "If we choose [X], latency increases by ~50ms. Is that acceptable?"
- "If we choose [Y], we can handle 10x more traffic. Do we need that?"

### 4. Consider Context
- "Is this a critical path (e.g., checkout) or nice-to-have (e.g., analytics)?"
- "Is this a one-time migration or ongoing burden?"
- "Is the team familiar with this approach, or will it require training?"

### 5. Document the Decision
- "We chose [X] because [rationale]."
- "We rejected [Y] because [specific reasons]."
- "We're willing to accept [trade-offs] for [benefits]."

---

## Summary Table

| Category | Option A | Option B | Key Question |
|----------|----------|----------|--------------|
| **Bounded Contexts** | Coarse (fewer, larger) | Fine (more, smaller) | "Do we prioritize simplicity or team independence?" |
| **Integration** | Synchronous | Asynchronous | "Do we need immediate consistency or high availability?" |
| **Data Model** | Normalized | Denormalized | "Are we optimizing for reads or writes?" |
| **Schema** | Single table (JSONB) | Multiple tables | "Do we prioritize flexibility or type safety?" |
| **Loading** | Eager | Lazy | "Will we always need related data, or sometimes?" |
| **API Style** | Resource-oriented | Action-oriented | "Do clients expect REST or explicit actions?" |
| **API Granularity** | Coarse (fewer, larger) | Fine (more, smaller) | "Do we minimize round-trips or maximize flexibility?" |
| **Pagination** | Offset-based | Cursor-based | "Do we need page numbers or infinite scroll?" |
| **Performance vs Correctness** | Eventual consistency | Strong consistency | "Is this data critical or non-critical?" |
| **Performance vs Maintainability** | Optimized queries | ORM simplicity | "Do we optimize for latency or development speed?" |
| **Complexity vs Flexibility** | Pluggable architecture | Hard-coded | "Are requirements stable or evolving?" |
| **Complexity vs Performance** | Custom optimization | Off-the-shelf | "Is performance critical or 'good enough'?" |

Use this table as a checklist during workshops to ensure all major trade-offs are surfaced and discussed.
