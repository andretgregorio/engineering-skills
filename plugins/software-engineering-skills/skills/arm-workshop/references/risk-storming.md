# Risk Storming Workshop Guide

This guide explains how to conduct a Risk Storming session to identify and mitigate architectural risks collaboratively.

## Overview

**Risk Storming** is a visual and collaborative risk identification technique that helps teams identify architectural fragilities before they become production issues.

**Key Benefits:**
- Leverages collective experience of the team
- Identifies risks others might miss
- Prioritizes risks objectively (Probability × Impact)
- Creates visual risk maps on architecture diagrams
- Generates actionable mitigation strategies

**Based on:** [riskstorming.com](https://riskstorming.com/)

---

## The Risk Storming Process

There are **4 steps** in a Risk Storming session:

```
Step 1: Draw Architecture Diagrams
    ↓
Step 2: Identify Risks Individually (Silent)
    ↓
Step 3: Converge Risks on Diagrams
    ↓
Step 4: Review and Summarize Risks
```

**Duration:** 30-60 minutes depending on architecture complexity

---

## Step 1: Draw Architecture Diagrams

**Goal:** Create visual representations of the architecture at different levels of abstraction.

### What to Draw

Use **C4 Model** diagrams (recommended):
- **System Context diagram** - Shows how the system fits in the overall environment
- **Container diagram** - Shows applications, databases, message queues (most useful for Risk Storming)
- **Component diagram** - Shows internal structure of containers (for focused sessions)

**Other diagram types:**
- Data flow diagrams
- Deployment diagrams
- Sequence diagrams

### Why Multiple Levels?

Different levels of detail expose different risks:
- **System Context** - Integration risks, external dependencies
- **Container** - Architectural risks, single points of failure, scalability issues
- **Component** - Implementation risks, coupling issues

### Example: Payment Gateway Container Diagram

```
┌─────────────────────────────────────────────┐
│         Payment Gateway System              │
│                                             │
│  ┌──────────┐    ┌──────────┐             │
│  │   Web    │───▶│   API    │             │
│  │   App    │    │  Server  │             │
│  └──────────┘    └─────┬────┘             │
│                        │                    │
│                   ┌────▼─────┐             │
│                   │PostgreSQL│             │
│                   │ Database │             │
│                   └──────────┘             │
│                                             │
└─────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ Third-Party  │
    │ Payment API  │
    └──────────────┘
```

### Preparation

**Materials needed:**
- Large whiteboard or flip chart paper
- Markers (multiple colors if possible)
- Sticky notes in 3 colors:
  - **Pink/Red** - High priority risks
  - **Yellow** - Medium priority risks
  - **Green** - Low priority risks
- Participants (ideally 3-8 people)

**Draw diagrams before the session:**
- Use large, clear diagrams
- Label all components clearly
- Show communication paths
- Include external dependencies

---

## Step 2: Identify Risks Individually (Silent)

**Goal:** Each participant identifies risks from their perspective without group bias.

### Process

1. **Timebox:** 10-15 minutes
2. **Silent work:** No talking, no collaboration
3. **Individual assessment:** Each person works independently
4. **Write on sticky notes:** One risk per sticky note

### What to Look For

#### Availability Risks
- **Single points of failure** - One component failure = total system failure
- **External system unavailability** - Third-party API goes down
- **Cascading failures** - Failure in one component triggers failures in others
- **No redundancy** - No backup/failover mechanism

**Examples:**
- "Database is single point of failure (P: 2, I: 3, Score: 6)"
- "Third-party payment API has no fallback (P: 3, I: 3, Score: 9)"

#### Performance Risks
- **Slow components** - Inefficient algorithms, heavy processing
- **N+1 query problems** - Database queries in loops
- **Network latency** - Too many network hops
- **Blocking operations** - Synchronous calls to slow services
- **Resource exhaustion** - Memory leaks, unbounded queues

**Examples:**
- "API calls payment gateway synchronously, blocks thread (P: 3, I: 2, Score: 6)"
- "No caching, every request hits database (P: 3, I: 2, Score: 6)"

#### Scalability Risks
- **Components don't scale horizontally** - Stateful services
- **Database bottlenecks** - Single database can't handle load
- **Connection pool exhaustion** - Too few connections for load
- **Unbounded growth** - Queues, tables, files grow without limits

**Examples:**
- "Web app stores session in memory, can't scale horizontally (P: 2, I: 3, Score: 6)"
- "Transactions table will have 100M rows, queries will slow down (P: 3, I: 2, Score: 6)"

#### Security Risks
- **Authentication bypasses** - Missing auth checks
- **Authorization flaws** - Users access data they shouldn't
- **Data exposure** - Sensitive data in logs, errors, or unencrypted
- **Injection attacks** - SQL injection, XSS, etc.
- **CSRF vulnerabilities** - Cross-site request forgery

**Examples:**
- "API doesn't validate user owns the resource they're accessing (P: 2, I: 3, Score: 6)"
- "Payment details logged in plaintext (P: 2, I: 3, Score: 6)"

#### Data Integrity Risks
- **Data corruption** - Race conditions, concurrent updates
- **Lost updates** - Optimistic locking issues
- **Inconsistent state** - Distributed transactions fail partially
- **No validation** - Bad data enters the system

**Examples:**
- "Concurrent account updates can cause lost balance updates (P: 2, I: 3, Score: 6)"
- "No validation on transaction amount, negative values possible (P: 2, I: 2, Score: 4)"

#### Operational Risks
- **Difficult debugging** - No logs, traces, or metrics
- **Hard to deploy** - Manual steps, no automation
- **No rollback strategy** - Can't undo bad deployments
- **No monitoring** - Can't detect failures
- **Complex configuration** - Easy to misconfigure

**Examples:**
- "No distributed tracing, can't debug cross-service issues (P: 3, I: 2, Score: 6)"
- "Database migration has no rollback, breaking change (P: 2, I: 3, Score: 6)"

#### Technology Risks
- **Unproven technology** - New framework/library with unknown issues
- **Framework limitations** - Technology doesn't support requirements
- **Library bugs** - Known issues in dependencies
- **Version compatibility** - Different component versions incompatible

**Examples:**
- "New queue library (BullMQ) has no production experience on team (P: 2, I: 2, Score: 4)"
- "TypeORM doesn't support this advanced PostgreSQL feature (P: 2, I: 2, Score: 4)"

#### Team Risks
- **Skill gaps** - Team doesn't know the technology
- **Knowledge silos** - Only one person understands this part
- **Unfamiliar patterns** - New architecture pattern for the team

**Examples:**
- "Only one developer knows React Router SSR (P: 3, I: 2, Score: 6)"
- "Team has never built event-driven architecture (P: 3, I: 2, Score: 6)"

#### Integration Risks
- **API contract changes** - Third-party breaks compatibility
- **Versioning issues** - Different API versions incompatible
- **Rate limiting** - External service throttles our requests
- **Data format changes** - External system changes data structure

**Examples:**
- "Pluggy API could change response format without notice (P: 2, I: 2, Score: 4)"
- "Payment gateway rate limits us at 100 req/sec (P: 2, I: 2, Score: 4)"

#### Migration Risks
- **Breaking changes** - Migration breaks existing functionality
- **Downtime required** - Can't do zero-downtime migration
- **Data loss** - Migration script has bugs
- **Rollback complexity** - Hard to undo migration

**Examples:**
- "Adding non-null column requires downtime (P: 2, I: 2, Score: 4)"
- "Migration script hasn't been tested on production data volume (P: 2, I: 3, Score: 6)"

### How to Assess Risk Priority

Each risk is assessed on two dimensions:

#### Probability (1-3)
- **Low (1):** Unlikely to happen; rare edge case
- **Medium (2):** Could happen; not uncommon
- **High (3):** Likely to happen; very real possibility

#### Impact (1-3)
- **Low (1):** Minor inconvenience; short-term discomfort; easy fix
- **Medium (2):** Moderate impact; some rework; temporary outage; user-facing issue
- **High (3):** Severe impact; project failure; data loss; major outage; legal issues; reputation damage

#### Priority Score = Probability × Impact

| Score | Priority | Color | Action |
|-------|----------|-------|--------|
| **6-9** | High | 🔴 Red/Pink | Must address before launch |
| **3-4** | Medium | 🟡 Yellow | Should address or accept with mitigation |
| **1-2** | Low | 🟢 Green | Monitor or accept |

### Sticky Note Format

Each sticky note should have:
```
[Brief risk description]

P: [1-3]
I: [1-3]
Score: [1-9]
```

**Example:**
```
Database is single point of failure

P: 2
I: 3
Score: 6
```

---

## Step 3: Converge Risks on Diagrams

**Goal:** Visualize where risks are concentrated in the architecture.

### Process

1. **One at a time:** Each participant places their sticky notes on the diagrams
2. **Near the source:** Place sticky note close to the component/area with the risk
3. **Group similar risks:** If multiple people identified the same risk, cluster the notes
4. **No discussion yet:** Just place the notes, explain if needed, but don't debate

### What You'll See

**Clustering patterns:**
- **Hot spots:** Areas with many sticky notes = high-risk areas
- **Divergence:** Same area with different risk priorities = need discussion
- **Unique risks:** Only one person identified = might be valuable insight or over-concern
- **External dependencies:** Often accumulate risks

**Example:**
```
┌────────────────────────────────────────┐
│      Payment Gateway System            │
│                                        │
│  ┌──────────┐    ┌──────────┐        │
│  │   Web    │───▶│   API    │  ⚠️⚠️  │
│  │   App    │    │  Server  │  ⚠️⚠️  │ (Many risks here)
│  └──────────┘    └─────┬────┘  ⚠️⚠️  │
│                        │              │
│       ⚠️          ┌────▼─────┐  ⚠️⚠️⚠️│
│                   │PostgreSQL│  ⚠️⚠️⚠️│ (High-risk area)
│                   │ Database │  ⚠️⚠️⚠️│
│                   └──────────┘        │
│                                        │
└────────────────────────────────────────┘
           │
           ▼  ⚠️⚠️⚠️⚠️
    ┌──────────────┐  ⚠️⚠️⚠️⚠️ (External dependency risks)
    │ Third-Party  │  ⚠️⚠️⚠️⚠️
    │ Payment API  │
    └──────────────┘
```

### Visual Patterns to Notice

- **Red cluster** = Critical risk area, needs immediate attention
- **Mixed colors** = Disagreement on priority, needs discussion
- **Isolated red** = Either real high-risk or over-concern
- **Empty areas** = Either low-risk or under-analyzed

---

## Step 4: Review and Summarize Risks

**Goal:** Validate risks, resolve disagreements, and create actionable risk register.

### Process

**Part A: Identify Patterns (5 min)**
1. Point out clusters: "Lots of risks around the database"
2. Highlight hot spots: "The third-party API has the most high-priority risks"
3. Note unique risks: "Only Sarah identified this cache invalidation risk"

**Part B: Review High-Priority Risks (15 min)**
For each **red/pink sticky note (score 6-9)**:
1. **Read the risk**
2. **Ask if others agree** on probability and impact
3. **Discuss if disagreement** - why different assessments?
4. **Validate with user/stakeholder** - is this risk acceptable?
5. **Record consensus priority**

**Part C: Review Disagreements (10 min)**
If multiple people identified the same risk but with different priorities:
- Person A: "Database failure (P:3, I:3, Score:9)"
- Person B: "Database failure (P:2, I:3, Score:6)"

**Discuss:**
- Why different probability? ("Person A has seen it fail before in prod")
- Why different impact? ("Person B assumes we have backups")
- **Converge:** Agree on final score or document both perspectives

**Part D: Review Unique Risks (5 min)**
Risks identified by only one person:
- **Could be valuable insight** - "Only the DBA saw this migration risk"
- **Could be over-concern** - "That's a valid point but very unlikely"

**Validate:** Is this a real risk or can we dismiss it?

**Part E: Prioritize Remaining Risks (5 min)**
- Group by priority: High (6-9), Medium (3-4), Low (1-2)
- Count each category
- Decide which to address now vs later

### Output: Risk Register

Create a structured list of all risks by component:

```markdown
## Risk Register

### High Priority Risks (Score 6-9) - 5 risks

#### PostgreSQL Database

##### Risk 1: Database is a single point of failure
- **Description:** If PostgreSQL goes down, entire system is unavailable
- **Probability:** 2 (Unlikely but possible)
- **Impact:** 3 (Complete system outage)
- **Score:** 6
- **Identified by:** 3 people

##### Risk 2: Transactions table will have 100M rows, queries slow down
- **Description:** No partitioning strategy, table will grow unbounded
- **Probability:** 3 (Certain to happen with growth)
- **Impact:** 2 (Degraded performance, not total failure)
- **Score:** 6
- **Identified by:** 2 people

#### Third-Party Payment API

##### Risk 3: Payment API has no fallback if unavailable
- **Description:** Synchronous call to payment API; if it's down, transactions fail
- **Probability:** 3 (APIs go down regularly)
- **Impact:** 3 (Can't process payments = lost revenue)
- **Score:** 9
- **Identified by:** 4 people

##### Risk 4: Payment API could change contract without notice
- **Description:** Third-party API has no SLA, could break compatibility
- **Probability:** 2 (Has happened before with other providers)
- **Impact:** 3 (All payment processing breaks)
- **Score:** 6
- **Identified by:** 1 person

#### API Server

##### Risk 5: No distributed tracing, can't debug cross-service issues
- **Description:** When payment fails, can't trace through web → API → payment gateway
- **Probability:** 3 (Will definitely need this for debugging)
- **Impact:** 2 (Slows down debugging, doesn't break system)
- **Score:** 6
- **Identified by:** 2 people

### Medium Priority Risks (Score 3-4) - 8 risks
[Continue with medium risks...]

### Low Priority Risks (Score 1-2) - 3 risks
[Continue with low risks...]
```

---

## Step 5: Define Mitigation Strategies

**Goal:** For each high and medium priority risk, create an actionable mitigation plan.

### Mitigation Strategy Types

#### Prevention (Eliminate the Risk)
Change architecture to remove the risk entirely.

**Example:**
- **Risk:** Database is single point of failure
- **Prevention:** Add PostgreSQL read replicas + failover

#### Detection (Catch the Risk Early)
Add monitoring/alerting to detect when risk materializes.

**Example:**
- **Risk:** Third-party API unavailable
- **Detection:** Add health check monitoring + alert when API is down

#### Recovery (Handle the Risk When It Happens)
Add mechanisms to recover gracefully from the risk.

**Example:**
- **Risk:** Third-party API unavailable
- **Recovery:** Add circuit breaker + fallback to queued processing

#### Acceptance (Acknowledge and Accept)
Document why the risk is acceptable and not mitigated.

**Example:**
- **Risk:** Team lacks experience with React Router SSR
- **Acceptance:** Accept learning curve; value of SSR outweighs risk. Plan for training.

### Mitigation Template

For each high/medium risk:

```markdown
##### Risk: [Risk name]
- **Type:** [Availability / Performance / Security / etc.]
- **Priority Score:** [1-9]
- **Mitigation Strategy:** [Prevention / Detection / Recovery / Acceptance]

**Actions:**
1. [Specific action 1]
2. [Specific action 2]
3. [Specific action 3]

**Timing:**
- [Before MVP / Phase 2 / Ongoing]

**Owner:**
- [Team or person responsible]

**Success Criteria:**
- [How to know mitigation worked]
```

### Example Mitigation Strategies

#### Example 1: High-Priority Risk

```markdown
##### Risk: Third-party Payment API unavailable (Score: 9)
- **Type:** Availability
- **Priority Score:** 9 (P:3, I:3)
- **Mitigation Strategy:** Detection + Recovery

**Actions:**
1. **Detection:** Add health check monitoring on payment API (poll every 30s)
2. **Detection:** Alert on-call engineer when API is down for > 1 min
3. **Recovery:** Implement circuit breaker pattern (fail fast after 3 consecutive failures)
4. **Recovery:** Add fallback: queue failed payments for retry when API recovers
5. **Recovery:** Show user-friendly message: "Payment processing delayed, will retry"

**Timing:**
- Detection monitoring: Before MVP
- Circuit breaker: Before MVP
- Queue fallback: Phase 2 (acceptable to fail fast initially)

**Owner:**
- Backend team + DevOps for monitoring

**Success Criteria:**
- When payment API goes down, system degrades gracefully (no crashes)
- Users notified of delay instead of seeing error
- Payments process automatically when API recovers
```

#### Example 2: Medium-Priority Risk

```markdown
##### Risk: Transactions table grows to 100M rows, queries slow (Score: 6)
- **Type:** Performance / Scalability
- **Priority Score:** 6 (P:3, I:2)
- **Mitigation Strategy:** Prevention

**Actions:**
1. **Prevention:** Partition transactions table by month (PostgreSQL native partitioning)
2. **Prevention:** Archive transactions older than 2 years to cold storage
3. **Prevention:** Add composite indexes on common query patterns (user_id + created_at)
4. **Detection:** Monitor query performance, alert if p95 > 500ms

**Timing:**
- Partitioning: Phase 2 (before hitting 10M rows)
- Archiving: Phase 3 (not urgent initially)
- Indexes: Before MVP

**Owner:**
- Database specialist + Backend team

**Success Criteria:**
- Queries remain fast (< 200ms p95) even with 100M rows
- Partitioning adds minimal complexity to queries
```

#### Example 3: Risk Acceptance

```markdown
##### Risk: Team lacks React Router SSR experience (Score: 6)
- **Type:** Team / Knowledge
- **Priority Score:** 6 (P:3, I:2)
- **Mitigation Strategy:** Acceptance + Training

**Reasoning for Acceptance:**
- SSR is critical for SEO and performance (aligns with business goals)
- React Router v7 is stable, good documentation available
- Learning curve is acceptable trade-off for long-term benefits

**Actions:**
1. **Training:** 2-day workshop on React Router SSR for team
2. **Mentorship:** Pair junior devs with senior dev who has SSR experience
3. **Documentation:** Create internal guide for common SSR patterns
4. **Code review:** Require SSR-experienced dev to review all SSR code initially

**Timing:**
- Training: Week 1 of project
- Mentorship: Ongoing
- Documentation: Build as we go

**Owner:**
- Tech lead for training coordination
- Senior dev for mentorship

**Success Criteria:**
- All team members can independently build SSR pages by month 2
- Internal documentation covers 80% of common patterns
```

---

## Risk Storming Best Practices

### Do's
✅ **Silent individual work first** - Prevents groupthink  
✅ **Use visual diagrams** - Makes risks concrete  
✅ **Include diverse perspectives** - Developers, ops, security, QA  
✅ **Focus on high-priority risks** - Don't spend time on low-impact risks  
✅ **Define specific mitigations** - "Add monitoring" is too vague  
✅ **Assign owners** - Each mitigation needs a responsible person  
✅ **Validate with stakeholders** - Get buy-in on risk acceptance  

### Don'ts
❌ **Don't debate during silent phase** - Keep it individual  
❌ **Don't dismiss unique risks** - One person might see something others missed  
❌ **Don't accept all risks** - High-priority risks need mitigation  
❌ **Don't create vague mitigations** - "Improve monitoring" → "Add Prometheus metric X with alert Y"  
❌ **Don't skip timing** - "When will this be addressed?" matters  
❌ **Don't forget to document** - Risk register must be written down  

---

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Groupthink** | Everyone identifies same risks | Enforce silent individual work |
| **Optimism bias** | "That won't happen to us" | Challenge assumptions with data |
| **Anchoring** | First person's risk dominates | Review unique risks explicitly |
| **Analysis paralysis** | Too much time on low-priority risks | Timebox, focus on high-priority |
| **Vague mitigations** | "We'll monitor it" without specifics | Require concrete actions |
| **No follow-through** | Risks identified but not addressed | Assign owners and track in backlog |

---

## Integration with ARM Methodology

Risk Storming is **Phase 4** of Architectural Risk Management:

1. **After choosing architecture** in Phase 3, conduct Risk Storming
2. **Map risks to architectural characteristics** from Phase 2
3. **Validate mitigations don't compromise top characteristics**

**Example:**
- **Risk:** Database single point of failure (Availability risk)
- **Mitigation:** Add read replicas
- **Check:** Does this affect Security (top characteristic #1)? No. Good to proceed.

---

## Tools and Materials

### Physical Workshop
- **Whiteboards/Flip charts** - For diagrams
- **Sticky notes** - 3 colors (red, yellow, green)
- **Markers** - For diagrams and writing
- **Timer** - To enforce timeboxes

### Virtual Workshop
- **Miro/Mural** - Collaborative whiteboard
- **FigJam** - For diagrams + sticky notes
- **Zoom/Meet** - Video call
- **Google Doc** - For risk register

### Template: Miro Board Structure
```
+─────────────────────────────────────────+
│  Risk Storming: [Feature Name]         │
│  Date: [YYYY-MM-DD]                     │
│  Participants: [Names]                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────┐          │
│  │  C4 Container Diagram   │          │
│  │  [Paste diagram here]   │          │
│  │                          │          │
│  └─────────────────────────┘          │
│                                         │
├─────────────────────────────────────────┤
│  High Priority Risks (🔴)              │
│  [Red sticky notes area]                │
│                                         │
├─────────────────────────────────────────┤
│  Medium Priority Risks (🟡)            │
│  [Yellow sticky notes area]             │
│                                         │
├─────────────────────────────────────────┤
│  Low Priority Risks (🟢)               │
│  [Green sticky notes area]              │
│                                         │
└─────────────────────────────────────────┘
```

---

## References

- **Risk Storming Website:** [riskstorming.com](https://riskstorming.com/)
- **Book:** "Fundamentals of Software Architecture" by Mark Richards & Neal Ford (Chapter on Architecture Risks)
- **C4 Model:** [c4model.com](https://c4model.com/) - For creating architecture diagrams

---

## Complete Risk Storming Checklist

### Before Workshop
- [ ] Create C4 Container diagram (or other architecture diagrams)
- [ ] Identify participants (3-8 people, diverse roles)
- [ ] Prepare materials (whiteboard, sticky notes, markers)
- [ ] Timebox session (30-60 minutes)
- [ ] Share diagrams with participants ahead of time

### During Workshop
- [ ] **Step 1:** Present architecture diagrams (5 min)
- [ ] **Step 2:** Silent individual risk identification (10-15 min)
- [ ] **Step 3:** Converge risks on diagrams (5 min)
- [ ] **Step 4:** Review and validate risks (15-20 min)
  - [ ] Review high-priority risks
  - [ ] Resolve disagreements
  - [ ] Validate unique risks
  - [ ] Count risks by priority
- [ ] **Step 5:** Define mitigation strategies for high-priority risks (15-20 min)

### After Workshop
- [ ] Create risk register document
- [ ] Assign owners to each mitigation
- [ ] Add mitigations to project backlog
- [ ] Share risk register with stakeholders
- [ ] Schedule follow-up to track mitigation progress
- [ ] Update technical investigation document with risks
