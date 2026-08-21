# Architectural Risk Management (ARM) Methodology

This guide explains how to conduct an Architectural Risk Management workshop following Thoughtworks' methodology.

## Overview

**Architectural Risk Management (ARM)** is a structured approach to align technical decisions with business goals by:
1. Understanding product strategy
2. Mapping business goals to architectural characteristics
3. Prioritizing quality attributes
4. Identifying and mitigating architectural risks

The ARM methodology ensures that architecture decisions are driven by business needs rather than technology preferences.

## The Four Phases of ARM

```
Phase 1: Product/Business Strategy
    ↓
Phase 2: Prioritize Architectural Characteristics
    ↓
Phase 3: Architecture Design
    ↓
Phase 4: Risk Identification (Risk Storming)
```

---

## Phase 1: Product/Business Strategy

**Goal:** Understand the product's strategic direction to inform architectural decisions.

### What to Gather

#### Product Vision
**Question:** "What is the product's vision?"

**Example:**
> "To ensure a fluid payment experience focused on the user experience, generating new revenue streams for the company and increasing order conversion through a global and scalable transactional platform."

**Look for:**
- Long-term aspirations (1-2 years)
- What success looks like
- Competitive positioning

#### Product Mission
**Question:** "What is the product's mission?"

**Example:**
> "To create conditions that allow the Payment Gateway to capture every opportunity, scaling the business faster, maximizing results while valuing clients and protecting the core business."

**Look for:**
- What problem the product solves
- Who it serves
- How it creates value

#### Strategic Goals (Top 5)
**Question:** "Choose the 5 most important strategic goals for the product at this time:"

**Common Strategic Goals:**
- Increase profit
- Improve customer retention
- Improve security
- Improve time to market
- Diversify or create new revenue streams
- Reduce operational costs
- Improve scalability
- Improve developer experience
- Improve compliance (regulatory)
- Improve data quality

**Example:**
For a Payment Gateway, the top 5 might be:
1. Increase profit
2. Improve customer retention
3. Improve security
4. Improve time to market
5. Diversify or create new revenue streams

### How to Facilitate

**With Product Owner/Stakeholder:**
```
1. Schedule 30-60 minute session
2. Start with vision: "Where do you see this product in 2 years?"
3. Clarify mission: "What core problem are you solving?"
4. Present goal options: "Here are 10 common strategic goals. Pick your top 5."
5. Validate understanding: "So your #1 priority is [X] because [Y]. Is that right?"
```

**Documentation:**
Create a summary document:
```markdown
## Product/Business Strategy

**Product Vision:**
[Vision statement]

**Product Mission:**
[Mission statement]

**Top 5 Strategic Goals:**
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]
4. [Goal 4]
5. [Goal 5]

**Why these goals matter:**
- [Goal 1]: [Business context/reasoning]
- [Goal 2]: [Business context/reasoning]
```

---

## Phase 2: Prioritize Architectural Characteristics

**Goal:** Map business goals to technical quality attributes and prioritize them.

### Step 1: Map Goals to Architectural Characteristics

**Process:**
For each strategic goal, identify which architectural characteristics support it.

**Example Mappings:**

| Strategic Goal | Architectural Characteristics |
|----------------|------------------------------|
| **Increase profit** | Cost-efficiency, Performance (faster = more conversions), Scalability |
| **Improve customer retention** | Availability, Reliability, Usability, Performance |
| **Improve security** | Security, Data Integrity, Auditability |
| **Improve time to market** | Deployability, Maintainability, Testability, Simplicity |
| **Diversify revenue streams** | Extensibility, Modularity, Interoperability |
| **Reduce operational costs** | Observability, Maintainability, Automation, Cost-efficiency |
| **Improve scalability** | Scalability, Elasticity, Performance |

### Complete List of Architectural Characteristics

**Performance & Scalability:**
- **Performance** - Response time, throughput, latency
- **Scalability** - Ability to handle growth in users/data/traffic
- **Elasticity** - Ability to scale up/down dynamically

**Reliability & Availability:**
- **Availability** - System uptime, fault tolerance
- **Reliability** - Consistency of operation, mean time between failures
- **Recoverability** - Ability to recover from failures

**Security & Compliance:**
- **Security** - Authentication, authorization, encryption, data protection
- **Privacy** - User data protection, GDPR compliance
- **Auditability** - Ability to trace and log actions
- **Compliance** - Regulatory requirements (PCI-DSS, HIPAA, etc.)

**Maintainability & Evolvability:**
- **Maintainability** - Code quality, ease of fixing bugs
- **Testability** - Ease of testing, test coverage
- **Modularity** - Clear boundaries, low coupling
- **Extensibility** - Ability to add new features
- **Flexibility** - Ability to adapt to changing requirements

**Operational:**
- **Deployability** - Ease of deployment, CI/CD, rollback
- **Observability** - Monitoring, logging, tracing, debugging
- **Manageability** - Ease of operations, configuration
- **Automation** - Ability to automate operations

**Cost:**
- **Cost-efficiency** - Infrastructure costs, licensing costs
- **Resource efficiency** - CPU, memory, storage utilization

**User Experience:**
- **Usability** - User interface quality, accessibility
- **Responsiveness** - UI responsiveness, perceived performance

**Integration:**
- **Interoperability** - Integration with external systems
- **Portability** - Ability to move across environments/platforms

**Data:**
- **Data Integrity** - Consistency, durability, correctness of data
- **Data Quality** - Accuracy, completeness, timeliness

### Step 2: Prioritize Characteristics

**Process:**

1. **Identify top 7** characteristics based on strategic goals
2. **Select top 3 driving characteristics** - These are non-negotiable
3. **Identify implicit characteristics** - Technical necessities (e.g., security is always somewhat important)
4. **Mark deprioritized characteristics** - What's explicitly not a priority right now

**Example for Payment Gateway:**

**Top 3 Driving Characteristics:**
1. **Security** - (from "Improve security" goal) - Non-negotiable for payment data
2. **Scalability** - (from "Increase profit" + "Diversify revenue") - Must handle growth
3. **Availability** - (from "Improve customer retention") - Downtime = lost transactions

**Other Important (4-7):**
4. **Performance** - Fast checkout = better conversion
5. **Observability** - Need to debug payment failures quickly
6. **Deployability** - Support "Improve time to market"
7. **Cost-efficiency** - Support "Increase profit"

**Implicit Characteristics:**
- **Maintainability** - Always needed for any system
- **Testability** - Can't compromise on this
- **Data Integrity** - Critical for financial data

**Deprioritized (for now):**
- **Portability** - Not changing cloud providers soon
- **Usability** - API, not user-facing UI
- **Extensibility** - Focus on core features first

### Step 3: Document Trade-offs

**Critical:** Explicitly state what you're willing to trade off.

**Example Trade-offs:**
- "We favor **Security** over **Performance**. We'll accept slower encryption if it means better protection."
- "We favor **Time to Market** over **Perfect Scalability**. We'll build for 10K users now, scale to 1M users later."
- "We favor **Availability** over **Consistency**. We'll accept eventual consistency if it means no downtime."

### How to Facilitate

**With Technical Leads + Stakeholders:**

```
1. Present mapping: "Based on your strategic goals, here are the characteristics that matter"
2. Prioritize: "If you could only guarantee 3 characteristics, which would they be?"
3. Force trade-offs: "If we have to choose between fast delivery and perfect scalability, which wins?"
4. Validate: "So Security is #1, Scalability is #2, Availability is #3. Correct?"
5. Document acceptance: "We're okay with [X] being lower priority because [Y]"
```

**Documentation:**
```markdown
## Prioritized Architectural Characteristics

**Top 3 Driving Characteristics:**
1. **Security** - [Why critical for business goals]
2. **Scalability** - [Why critical for business goals]
3. **Availability** - [Why critical for business goals]

**Other Important Characteristics (4-7):**
- Performance
- Observability
- Deployability
- Cost-efficiency

**Implicit Characteristics:**
- Maintainability
- Testability
- Data Integrity

**Deprioritized (Not Focus Now):**
- Portability
- Extensibility

**Trade-offs Accepted:**
- Favor Security over Performance
- Favor Time to Market over Perfect Scalability initially
- Favor Availability over Strong Consistency
```

---

## Phase 3: Architecture Design

**Goal:** Design architecture alternatives that optimize for the prioritized characteristics.

### Using Characteristics to Guide Design

**Example:**

If **Security** is #1:
- Choose architecture with strong authentication (e.g., OAuth2 + mTLS)
- Add API gateways with rate limiting
- Encrypt data at rest and in transit
- Implement audit logging

If **Scalability** is #2:
- Choose stateless services (horizontal scaling)
- Use asynchronous processing (queues)
- Implement caching strategies
- Design for eventual consistency

If **Availability** is #3:
- Eliminate single points of failure
- Add circuit breakers
- Design for graceful degradation
- Implement health checks and auto-recovery

### Design Process

1. **Generate 2-3 architectural alternatives**
2. **Evaluate each against top 3 characteristics**
3. **Score alternatives** (High/Medium/Low for each characteristic)
4. **Choose based on characteristic priorities**

**Example Evaluation:**

| Alternative | Security | Scalability | Availability | Notes |
|-------------|----------|-------------|--------------|-------|
| A: Monolith + Cache | Medium | Low | Medium | Simple but doesn't scale |
| B: Microservices + Event Bus | High | High | High | Complex but optimized for all 3 |
| C: Modular Monolith + Queue | High | Medium | High | Balanced approach |

**Result:** Choose B because Security, Scalability, and Availability are all top 3.

---

## Phase 4: Risk Identification

This phase is covered in detail in `risk-storming.md`.

**Summary:**
- Identify risks in the chosen architecture
- Prioritize risks (Probability × Impact)
- Define mitigation strategies
- Map risks to architectural characteristics

---

## Complete ARM Workshop Flow

### Preparation (Before Workshop)
- [ ] Schedule 2-3 hours with stakeholders + technical leads
- [ ] Prepare list of strategic goals
- [ ] Prepare list of architectural characteristics
- [ ] Have whiteboard/Miro for visualization

### Execution (During Workshop)

**Part 1: Business Strategy (30 min)**
1. Facilitate product vision discussion
2. Extract product mission
3. Identify top 5 strategic goals
4. Document and validate

**Part 2: Characteristics Mapping (45 min)**
1. Map goals to characteristics
2. Brainstorm all relevant characteristics
3. Prioritize top 7
4. Force selection of top 3 driving characteristics
5. Identify implicit and deprioritized characteristics
6. Document trade-offs

**Part 3: Architecture Design (60 min)**
1. Generate 2-3 architecture alternatives
2. Evaluate against top 3 characteristics
3. Present trade-offs to stakeholders
4. Choose architecture
5. Document chosen architecture with C4 diagrams

**Part 4: Risk Storming (45 min)**
1. Individual risk identification
2. Converge risks on architecture diagrams
3. Prioritize risks (Probability × Impact)
4. Define mitigation strategies
5. Document risk register

### Post-Workshop
- [ ] Create technical investigation document
- [ ] Share with stakeholders for validation
- [ ] Create ADRs for major decisions
- [ ] Plan follow-up workshops if needed

---

## Tips for Effective ARM Facilitation

### Do's
✅ **Start with business strategy** - Don't jump to technology  
✅ **Force trade-offs** - "You can't have everything. Choose."  
✅ **Document rejections** - Explain why alternatives were not chosen  
✅ **Validate constantly** - "Is this correct? Did I understand you right?"  
✅ **Use visual aids** - Diagrams, tables, matrices  
✅ **Keep it timeboxed** - Don't let discussions drag on  

### Don'ts
❌ **Don't assume characteristics** - Always ask stakeholders  
❌ **Don't skip trade-offs** - They're the most valuable output  
❌ **Don't let technology drive** - Business goals come first  
❌ **Don't accept vague goals** - "Improve quality" → "What does quality mean?"  
❌ **Don't prioritize everything as high** - Force ranking  

---

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Everything is a priority** | No clear direction | Force top 3 selection: "If you could only guarantee 3, which?" |
| **Technology-first thinking** | Architecture not aligned with business | Start with business strategy, map to characteristics |
| **Ignoring trade-offs** | Unrealistic expectations | Explicitly document: "We favor X over Y" |
| **Vague characteristics** | Can't validate architecture | Define measurable targets: "Performance = p95 < 200ms" |
| **No stakeholder buy-in** | Decisions get overturned later | Involve stakeholders in prioritization |
| **Skipping risk identification** | Surprised by failures | Always conduct Risk Storming |

---

## References

- **Thoughtworks ARM Article:** [Architectural Risk Management](https://www.thoughtworks.com/en-br/insights/blog/architecture/architectural-risk-management)
- **Book:** "Fundamentals of Software Architecture" by Mark Richards & Neal Ford
- **Book:** "Technology Strategy Patterns" by Eben Hewitt

---

## Templates

### Business Strategy Template
```markdown
## Product/Business Strategy

**Product Vision:**
[1-2 sentence vision statement]

**Product Mission:**
[1-2 sentence mission statement]

**Top 5 Strategic Goals:**
1. [Goal] - [Why important]
2. [Goal] - [Why important]
3. [Goal] - [Why important]
4. [Goal] - [Why important]
5. [Goal] - [Why important]
```

### Characteristics Prioritization Template
```markdown
## Prioritized Architectural Characteristics

**Top 3 Driving Characteristics:**
1. **[Characteristic]** - [Maps to strategic goal X, critical because Y]
2. **[Characteristic]** - [Maps to strategic goal X, critical because Y]
3. **[Characteristic]** - [Maps to strategic goal X, critical because Y]

**Other Important Characteristics (4-7):**
- [Characteristic 4]
- [Characteristic 5]
- [Characteristic 6]
- [Characteristic 7]

**Implicit Characteristics:**
- [Characteristic] - [Why necessary even if not business-driven]

**Deprioritized (Not Focus Now):**
- [Characteristic] - [Why not a priority]

**Trade-offs Accepted:**
- Favor [X] over [Y] because [strategic goal requires X]
- Accept [limitation] to achieve [benefit]
```
