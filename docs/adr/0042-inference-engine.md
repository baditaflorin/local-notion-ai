# 0042 - Inference Engine

## Status

Accepted

## Context

The app needs a useful first guess immediately after import.

## Decision

Add a deterministic inference engine that classifies imported content as one of:

- `markdown`
- `html`
- `csv`
- `transcript`
- `email`
- `invoice`
- `legal`
- `json`
- `code`
- `note`

The engine also emits fields, warnings, chunks, summary hints, and debug signals.

## Consequences

- Import, search, summary, rewrite, and Q&A use the same normalized analysis contract.
- The user can inspect what the app inferred.

## Alternatives Considered

- Heuristics in each feature separately.
