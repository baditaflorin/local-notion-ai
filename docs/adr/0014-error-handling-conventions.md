# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Users need clear failures for document import, storage, search, and AI workflows.

## Decision

Use typed `Result`-like return values or thrown `Error` objects at module boundaries, normalize them in UI actions, and surface messages through a global toast region. Keep unexpected details out of user-facing copy.

## Consequences

- Domain functions are testable.
- UI messages remain consistent.
- The app can keep running after non-fatal failures.

## Alternatives Considered

- Silent failures: rejected.
- Raw stack traces in UI: rejected.
