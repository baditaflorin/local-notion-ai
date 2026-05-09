# 0069 - Type-Safety Policy at Boundaries

## Status

Accepted

## Context

Phase 3 audits found unchecked casts in test fixture parsing, search fallback code, and select value handling.

## Decision

- External JSON is parsed as `unknown` and validated with zod.
- DOM/select values are narrowed through helper predicates when they represent domain enums.
- Boundary casts may exist only when attaching structured metadata to browser/native objects or in tightly isolated interop code.
- Search/export/share/settings helpers avoid unsafe domain casts.

## Consequences

TypeScript errors should describe real boundary uncertainty instead of being silenced with casts.

## Alternatives Considered

- Accept casts in tests. Rejected because tests are the real-data grading harness and should validate their own expectations.
