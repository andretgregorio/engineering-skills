# Technical Investigation Document Structure

This template defines the structure for technical investigation documents created by the workshop.

## Full Template

```markdown
---
sidebar_position: [number]
title: Technical Investigation - [Feature Name]
---

# Technical Investigation: [Feature Name]

**Date:** [YYYY-MM-DD]  
**Participants:** [List of specialists invoked + user]  
**Status:** [Draft | Under Review | Approved | Superseded]

## Executive Summary

### Problem Statement
[1 paragraph describing the problem being solved]

### Chosen Solution
[1 paragraph describing the high-level approach selected]

### Key Decisions
- **Decision 1:** [Brief decision + rationale]
- **Decision 2:** [Brief decision + rationale]
- **Decision N:** [Brief decision + rationale]

---

## 1. Problem Context

### Problem Description
[Detailed problem statement from Problem Analyst]

### Stakeholders
| Stakeholder | Interest | Impact |
|-------------|----------|--------|
| End Users | [concern] | High/Medium/Low |
| Development Team | [concern] | High/Medium/Low |
| Operations | [concern] | High/Medium/Low |

### Requirements

#### Functional Requirements
- REQ-1: [requirement]
- REQ-2: [requirement]

#### Non-Functional Requirements
| Quality Attribute | Target | Priority |
|------------------|--------|----------|
| Performance | < 200ms p95 latency | P0 |
| Scalability | 10K req/sec | P1 |
| Availability | 99.9% uptime | P0 |

### Constraints
- **Technical:** [e.g., Must integrate with existing Payment BC]
- **Business:** [e.g., Must support legacy data format]
- **Timeline:** [e.g., Q2 2026 delivery target]
- **Resource:** [e.g., No new infrastructure budget]

### Assumptions
- ASSUMPTION-1: [What we're assuming to be true]
- ASSUMPTION-2: [What we're assuming to be true]

### Open Questions
- [ ] Question 1?
- [ ] Question 2?

---

## 2. Solution Alternatives Explored

### 2.1 Domain Design Alternatives

#### Alternative A: [Name]
**Description:** [How this approach structures the domain]

**Bounded Contexts:**
- Context 1: [responsibility]
- Context 2: [responsibility]

**Pros:**
- ✅ Pro 1
- ✅ Pro 2

**Cons:**
- ❌ Con 1
- ❌ Con 2

**Rejection Reason:**
[Specific reason this was not chosen]

---

#### Alternative B: [Name]
**Description:** [How this approach structures the domain]

**Bounded Contexts:**
- Context 1: [responsibility]
- Context 2: [responsibility]

**Pros:**
- ✅ Pro 1
- ✅ Pro 2

**Cons:**
- ❌ Con 1
- ❌ Con 2

**Selected:** ✅ **CHOSEN ALTERNATIVE**

**Selection Rationale:**
[Why this alternative was chosen over others]

---

### 2.2 Data Model Alternatives

#### Alternative A: [Name]
**Description:** [How this approach models data]

**Schema Changes:**
```sql
-- New tables or modifications
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY,
  ...
);
```

**Pros:**
- ✅ Pro 1
- ✅ Pro 2

**Cons:**
- ❌ Con 1
- ❌ Con 2

**Rejection Reason:**
[Specific reason this was not chosen]

---

#### Alternative B: [Name]
**Description:** [How this approach models data]

**Schema Changes:**
```sql
-- New tables or modifications
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY,
  ...
);
```

**Pros:**
- ✅ Pro 1
- ✅ Pro 2

**Cons:**
- ❌ Con 1
- ❌ Con 2

**Selected:** ✅ **CHOSEN ALTERNATIVE**

**Selection Rationale:**
[Why this alternative was chosen over others]

---

### 2.3 API Design Alternatives

#### Alternative A: [Name]
**Description:** [How this approach designs the API]

**Endpoints:**
```http
POST /api/v1/[resource]
GET /api/v1/[resource]/:id
PATCH /api/v1/[resource]/:id
DELETE /api/v1/[resource]/:id
```

**Example Request/Response:**
```json
// POST /api/v1/[resource]
Request:
{
  "field1": "value1",
  "field2": "value2"
}

Response (201 Created):
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  "createdAt": "2026-03-25T10:00:00Z"
}
```

**Pros:**
- ✅ Pro 1
- ✅ Pro 2

**Cons:**
- ❌ Con 1
- ❌ Con 2

**Rejection Reason:**
[Specific reason this was not chosen]

---

#### Alternative B: [Name]
**Description:** [How this approach designs the API]

**Endpoints:**
```http
POST /api/v1/[resource]
GET /api/v1/[resource]/:id
```

**Example Request/Response:**
```json
// POST /api/v1/[resource]
Request:
{
  "field1": "value1",
  "field2": "value2"
}

Response (201 Created):
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  "createdAt": "2026-03-25T10:00:00Z"
}
```

**Pros:**
- ✅ Pro 1
- ✅ Pro 2

**Cons:**
- ❌ Con 1
- ❌ Con 2

**Selected:** ✅ **CHOSEN ALTERNATIVE**

**Selection Rationale:**
[Why this alternative was chosen over others]

---

## 3. Chosen Solution Architecture

### 3.1 Domain Design

#### Bounded Contexts
| Bounded Context | Responsibility | Relationships |
|----------------|----------------|---------------|
| [Context Name] | [What it owns] | Customer-Supplier with [Other BC] |
| [Context Name] | [What it owns] | ACL with [External System] |

#### Aggregates
**Aggregate: [Name]**
- **Root Entity:** [EntityName]
- **Entities:** [Entity1, Entity2]
- **Value Objects:** [VO1, VO2]
- **Invariants:**
  - Invariant 1: [rule that must be maintained]
  - Invariant 2: [rule that must be maintained]

#### Domain Events
| Event | Triggered By | Consumed By |
|-------|--------------|-------------|
| [EventName] | [Aggregate.Action] | [OtherBC, ExternalSystem] |

#### Integration Patterns
- **Synchronous:** [Which operations require immediate consistency]
- **Asynchronous:** [Which operations can be eventual consistency]

---

### 3.2 Data Model

#### Entity Design

**Entity: [EntityName]**
```typescript
interface [EntityName] {
  id: string;
  field1: string;
  field2: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- `[EntityName]` 1:N `[RelatedEntity]`
- `[EntityName]` N:M `[OtherEntity]` (via join table `[join_table_name]`)

#### Schema Changes

```sql
-- New table
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field1 VARCHAR(255) NOT NULL,
  field2 INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT [constraint_name] CHECK ([condition]),
  FOREIGN KEY (field_id) REFERENCES other_table(id)
);

-- Index strategy
CREATE INDEX idx_[table]_[field] ON [table_name] ([field]);
CREATE INDEX idx_[table]_[composite] ON [table_name] ([field1], [field2]);
```

#### Migration Strategy
- **Breaking Change:** ❌ No / ✅ Yes
- **Rollback Plan:** [How to revert if needed]
- **Data Migration:** [How to migrate existing data]

#### Indexing Strategy
| Index | Columns | Purpose | Impact |
|-------|---------|---------|--------|
| `idx_name` | `[col1, col2]` | Optimize query X | +5% write latency, -80% read latency |

#### Caching Strategy
- **What to cache:** [Entities/queries to cache]
- **TTL:** [How long to cache]
- **Invalidation:** [When to invalidate]

---

### 3.3 API Contracts

#### Endpoint Specifications

**POST /api/v1/[resource]**
- **Description:** Creates a new [resource]
- **Auth:** Required (SessionAuthGuard)
- **Rate Limit:** 100 req/min per user
- **Idempotency:** Supports `Idempotency-Key` header

**Request:**
```json
{
  "field1": "string (required, max 255)",
  "field2": "number (optional, default 0)"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "field1": "string",
  "field2": "number",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "field1",
      "message": "field1 is required"
    }
  ]
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "Resource already exists"
}
```

**GET /api/v1/[resource]**
- **Description:** Lists all [resources] for current user
- **Auth:** Required (SessionAuthGuard)
- **Pagination:** Cursor-based

**Request (Query Params):**
```
?limit=20 (default 20, max 100)
&cursor=base64_encoded_cursor
&filter[field]=value
&sort=-createdAt (- for desc, + for asc)
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "field1": "string",
      "field2": "number"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "nextCursor": "base64_encoded_cursor",
    "prevCursor": "base64_encoded_cursor"
  }
}
```

**GET /api/v1/[resource]/:id**
- **Description:** Gets a single [resource] by ID
- **Auth:** Required (SessionAuthGuard)
- **Caching:** ETag support

**Response (200 OK):**
```json
{
  "id": "uuid",
  "field1": "string",
  "field2": "number",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

**Response (304 Not Modified):**
If `If-None-Match` header matches ETag.

**PATCH /api/v1/[resource]/:id**
- **Description:** Partially updates a [resource]
- **Auth:** Required (SessionAuthGuard)

**Request:**
```json
{
  "field1": "new value (optional)",
  "field2": 42 (optional)
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "field1": "new value",
  "field2": 42,
  "updatedAt": "ISO 8601"
}
```

**DELETE /api/v1/[resource]/:id**
- **Description:** Deletes a [resource]
- **Auth:** Required (SessionAuthGuard)

**Response (204 No Content):**
Empty body.

---

### 3.4 Cross-Cutting Concerns

#### Authentication & Authorization
- **Authentication:** Session-based (SessionAuthGuard)
- **Authorization:**
  - Role-based: `[Admin, User, Guest]`
  - Resource-level: Users can only access their own resources
- **Implementation:** NestJS Guards + decorators

#### Observability

**Metrics:**
| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `[feature]_requests_total` | Counter | `method, status` | Track request volume |
| `[feature]_latency_seconds` | Histogram | `method` | Track performance |
| `[feature]_errors_total` | Counter | `error_type` | Track error rates |

**Logs:**
- `INFO`: [Feature] created [resource] id=[uuid]
- `WARN`: [Feature] validation failed for user=[id]
- `ERROR`: [Feature] failed to [action]: [error]

**Traces:**
- Trace all external calls (database, API, queue)
- Include user context (user_id, session_id)

**SLIs/SLOs:**
| Indicator | Target | Measurement |
|-----------|--------|-------------|
| Availability | 99.9% | Uptime checks |
| Latency | p95 < 200ms | Histogram |
| Error Rate | < 0.1% | Error counter |

#### Error Handling

**Domain Errors → HTTP Status Codes:**
| Domain Error | HTTP Status | Example |
|--------------|-------------|---------|
| `ResourceNotFoundError` | 404 Not Found | Resource doesn't exist |
| `ValidationError` | 400 Bad Request | Invalid input |
| `ConflictError` | 409 Conflict | Duplicate resource |
| `UnauthorizedError` | 401 Unauthorized | Missing/invalid auth |
| `ForbiddenError` | 403 Forbidden | Insufficient permissions |
| `UnexpectedError` | 500 Internal Server Error | Unknown error |

**Retry Strategy:**
- **Idempotent operations:** Retry up to 3x with exponential backoff
- **Non-idempotent operations:** No automatic retry (use Idempotency-Key)

#### Testing Strategy

**Test Levels:**
| Level | Focus | Tools | Coverage Target |
|-------|-------|-------|-----------------|
| Unit | Business logic, domain rules | Vitest | > 90% |
| Integration | Repository, use cases, controllers | Vitest + Testcontainers | > 80% |
| E2E | Full user flows | Playwright + Cucumber | Critical paths |

**Critical Test Scenarios:**
- Happy path: [scenario]
- Edge case: [scenario]
- Error case: [scenario]
- Performance: [scenario under load]

#### Performance

**Targets:**
- **Latency:** p50 < 50ms, p95 < 200ms, p99 < 500ms
- **Throughput:** 10K requests/sec
- **Database queries:** < 10 queries per request (N+1 prevention)

**Optimizations:**
- **Caching:** [What to cache]
- **Indexing:** [What to index]
- **Query optimization:** [Specific optimizations]
- **Connection pooling:** [Pool size, timeout]

#### Security

**Threat Model:**
| Threat | Mitigation |
|--------|------------|
| SQL Injection | TypeORM parameterized queries |
| XSS | Input sanitization, CSP headers |
| CSRF | SameSite cookies, CSRF tokens |
| Data exposure | Row-level security, field filtering |

**Sensitive Data:**
- **PII:** [How to protect: encryption, masking]
- **Secrets:** [How to store: vault, env vars]

---

## 4. Technical Decisions

| ID | Decision | Rationale | Trade-offs |
|----|----------|-----------|------------|
| TD-1 | [Decision made] | [Why we chose this] | [What we gave up] |
| TD-2 | [Decision made] | [Why we chose this] | [What we gave up] |

### Related ADRs

**Existing ADRs Referenced:**
- [ADR-XXXX: Title](link) - [How it applies]

**New ADRs to Create:**
- [ ] ADR: [Decision that needs formal ADR]
- [ ] ADR: [Decision that needs formal ADR]

---

## 5. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| [Risk description] | High/Med/Low | High/Med/Low | [How to mitigate] | [Team/Person] |

**Key Assumptions to Validate:**
- [ ] Assumption 1: [How to validate]
- [ ] Assumption 2: [How to validate]

---

## 6. Next Steps

### Implementation Order
1. **Phase 1:** [What to build first]
   - Reason: [Why this order]
2. **Phase 2:** [What to build next]
   - Reason: [Why this order]

### Prerequisites
- [ ] ADR creation: [Which ADRs]
- [ ] Infrastructure setup: [What needs provisioning]
- [ ] API design review: [With whom]

### Blockers
- [ ] Blocker 1: [What's blocking + how to unblock]
- [ ] Blocker 2: [What's blocking + how to unblock]

### Follow-Up Workshops
- [ ] Deep dive on [specific technical area]
- [ ] Performance testing workshop
- [ ] Security review session

### Recommended Next Skill Invocation

**If ready for detailed design:**
```bash
/design-doc [path-to-this-investigation]
```

**If ready to break down into stories:**
```bash
/task-planning [path-to-this-investigation]
```

---

## Appendix

### References
- [Related Design Doc](link)
- [Related ADR](link)
- [External Documentation](link)

### Glossary
- **Term 1:** Definition
- **Term 2:** Definition

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2026-03-25 | Initial investigation | Workshop Team |
```

## Section-by-Section Guidance

### Executive Summary
- **Length:** 3-5 paragraphs max
- **Audience:** Stakeholders who need high-level overview
- **Key Decisions:** Max 5 most important decisions

### Problem Context
- **Copy from Problem Analyst output**
- **Add user validation notes**
- **Quality attributes are CRITICAL** - these drive solution choices

### Solution Alternatives
- **Minimum 2 alternatives per major decision point**
- **Rejection reasons must be specific** - not "we chose Y so we rejected X"
- **Use tables and code blocks** for clarity

### Chosen Solution
- **This is the meat of the document**
- **Be as detailed as needed** - this feeds into design doc or user stories
- **Code examples are good** - show actual schema, API contracts

### Technical Decisions
- **Document WHY, not just WHAT**
- **Trade-offs are essential** - what did you give up?

### Risks
- **Be honest about unknowns**
- **Mitigation shows you've thought it through**

### Next Steps
- **Make it actionable**
- **Clear ownership and dependencies**
