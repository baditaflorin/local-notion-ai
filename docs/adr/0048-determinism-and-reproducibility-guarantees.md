# 0048 - Determinism And Reproducibility Guarantees

## Status

Accepted

## Context

Phase 2 substance requires identical input to produce identical analysis and AI output.

## Decision

Use deterministic analysis:

- stable document IDs based on normalized content
- stable chunk IDs
- stable ordering in summaries and Q&A tie-breaks
- fixture tests asserting identical repeated analysis

Exports also include app version, commit, and export digest for provenance.

## Consequences

- The app becomes easier to trust, test, and debug.

## Alternatives Considered

- Preserve random IDs and implicit ordering.
