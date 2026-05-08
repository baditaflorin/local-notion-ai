# 0002 - Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The app needs document import, local persistence, search, summarization, rewriting, Q&A, offline behavior, and visible project metadata while staying static-hostable.

## Decision

Use a browser-only architecture with these boundaries:

- `features/workspace`: document import, editing, and Yjs-backed local workspace state.
- `features/ai`: extractive summarization, style rewriting, and Q&A over local content.
- `features/search`: local full-text index and scoring.
- `lib/storage`: IndexedDB persistence and export/import utilities.
- `lib/version`: build metadata surfaced in the UI.
- `workers`: deferred heavier processing when needed.

## Consequences

- Domain logic is testable without the DOM.
- UI code stays thin and delegates to feature modules.
- Browser storage is the source of truth for v1.

## Alternatives Considered

- Monolithic app file: simpler initially but harder to test and evolve.
- Server API module boundary: unnecessary for Mode A.

