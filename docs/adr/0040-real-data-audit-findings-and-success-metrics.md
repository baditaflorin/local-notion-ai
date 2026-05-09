# 0040 - Real Data Audit Findings And Success Metrics

## Status

Accepted

## Context

The v1 app worked on curated demo text but not on messy user data. Phase 2 substance needed a concrete grading rubric.

## Decision

Use ten committed real-data fixtures spanning Markdown, HTML, CSV, transcript, email, invoice text, policy text, broken export, large note dump, and encoding-weird text.

Success metrics:

- At least seven fixtures should require no manual cleanup.
- All ten fixtures must avoid crashes and silent wrongness.
- Analysis must be deterministic.
- Each user-facing inference must carry confidence.

## Consequences

- The fixture suite blocks regressions.
- The product is judged by real user-shaped inputs rather than synthetic demos.

## Alternatives Considered

- Rely on ad hoc manual QA.
- Use only synthetic edge cases.
