# 0066 - Error Handling Convention

## Status

Accepted

## Context

Phase 2 established actionable import errors. Phase 3 adds more browser-boundary failures: clipboard permissions, CORS fetches, oversized share links, invalid hash state, and partial batch import.

## Decision

User-facing errors follow:

- What failed.
- Why it failed in domain/browser terms.
- What the user can do next.

New boundary helpers return structured results where possible and throw only at boundaries that already use `describeImportError`.

## Consequences

New toast messages must avoid raw exception text. Recoverable failures preserve user work and report partial success.

## Alternatives Considered

- Throw generic `Error` from every helper. Rejected because it loses the next-step guidance Phase 2 established.
