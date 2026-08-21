# Report Templates

## Executive Summary (`code-smell-detector-summary.md`)

```markdown
# Code Quality Summary

## Critical Issues
**[X] High-severity issues found - Immediate attention required**

### Top 3 Problems
1. **[Issue Type]** - [Brief description] - **[Priority: High/Medium/Low]**
2. **[Issue Type]** - [Brief description] - **[Priority: High/Medium/Low]**
3. **[Issue Type]** - [Brief description] - **[Priority: High/Medium/Low]**

## Overall Assessment
- **Project Size**: [X files, Y languages]
- **Code Quality Grade**: [A-F] (A: 0-5 issues; B: 6-15; C: 16-30; D: 31-50; F: 50+ or 10+ high)
- **Total Issues**: [High: X | Medium: Y | Low: Z]
- **Technical Debt**: [High/Medium/Low]
- **Maintenance Risk**: [High/Medium/Low]
- **Development Velocity Impact**: [High/Medium/Low]

## Quick Wins
- [Issue 1]: [Priority] - [Business benefit]
- [Issue 2]: [Priority] - [Business benefit]

## Major Refactoring Needed
- **[Component]**: [Priority] - [Why it matters]

## Recommended Action Plan
### Phase 1 (Immediate)
- Fix critical bugs and security issues
- Address quick wins with high impact

### Phase 2 (Short-term)
- Resolve architectural problems
- Implement missing design patterns

### Phase 3 (Long-term)
- Major refactoring initiatives

## Key Takeaways
- [Main insight 1]
- [Main insight 2]

---
*Detailed technical analysis available in `code-smell-detector-report.md`*
```

## Detailed Technical Report (`code-smell-detector-report.md`)

```markdown
# Code Smell Detection Report

## Executive Summary
- Project overview and analysis scope
- Total issues by severity
- Key architectural concerns

## Project Analysis
- Languages and frameworks detected
- Project structure and size
- Key files analyzed

## High Severity Issues (Architectural Impact)
### SOLID Principle Violations
### GRASP Principle Violations
### Critical Code Smells

## Medium Severity Issues (Design Problems)

## Low Severity Issues (Readability/Maintenance)

## Detailed Findings
### [File Path] - [Issue Count] issues
- **[Smell Name]** (Line X): Description and impact
- **[Principle Violation]** (Line Y): Explanation

## Impact Assessment
- **Total Issues Found**: [X]
- High Severity: [X] | Medium: [X] | Low: [X]
- SOLID Violations: [X] | GRASP Violations: [X]

## Recommendations and Refactoring Roadmap
- Prioritized action plan with implementation order
- Prevention strategies

## Appendix
- Complete list of analyzed files
- Excluded files and reasons
```

## Grading Scale

| Grade | Total Issues | High Severity |
|-------|-------------|--------------|
| A | 0–5 | 0 |
| B | 6–15 | 0–1 |
| C | 16–30 | 2–5 |
| D | 31–50 | 6–10 |
| F | 50+ | 10+ |
