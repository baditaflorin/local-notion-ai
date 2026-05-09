# 0049 - Inspectability And Debug Surface

## Status

Accepted

## Context

Power users and support need to understand what the import engine inferred.

## Decision

Add a debug surface in the UI and `?debug=1` support that exposes:

- inference signals
- chunk count
- normalized preview
- summary hint
- source digest

## Consequences

- Debugging user reports becomes materially easier.

## Alternatives Considered

- Keep analysis internals hidden.
