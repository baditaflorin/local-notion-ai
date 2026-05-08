# 0012 - Metrics And Observability

## Status

Accepted

## Context

The app processes private local documents. Observability must not leak content or behavior.

## Decision

Ship no analytics in v1. Observability is limited to local UI status: document count, index status, storage status, build version, and commit.

## Consequences

- No PII or usage telemetry is collected.
- Product usage insight comes from voluntary feedback, stars, issues, and forks.

## Alternatives Considered

- Plausible analytics: privacy-friendly but still unnecessary for v1.
- Custom beacon: rejected because it would create a backend-like concern.
