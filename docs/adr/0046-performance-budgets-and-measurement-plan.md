# 0046 - Performance Budgets And Measurement Plan

## Status

Accepted

## Context

Phase 2 substance adds more import-time work and needs a concrete budget.

## Decision

Budgets:

- under 300 ms for small single-file analysis on local fixtures
- visible operation state for longer imports
- deterministic chunk limits to cap runaway work

Measurement:

- fixture suite for correctness
- local benchmark script during release verification
- smoke test for the built Pages app

## Consequences

- Performance regressions become measurable instead of anecdotal.

## Alternatives Considered

- Rely on subjective feel only.
