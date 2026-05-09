# 0064 - DRY Consolidation Map

## Status

Accepted

## Context

Adding CSV, report, share, and settings behavior would duplicate Blob downloads, URL encoding, and persisted JSON validation if implemented directly in `App.tsx`.

## Decision

Phase 3 will add single-purpose helper modules:

- `src/lib/download/download.ts` owns Blob download helpers.
- `src/features/workspace/exportFormats.ts` owns CSV/report serialization.
- `src/features/share/shareState.ts` owns hash state encoding/decoding and limits.
- `src/lib/settings/settingsStore.ts` owns persisted settings schema and defaults.

## Consequences

`App.tsx` still orchestrates the UI, but serialization, settings, and share concerns have one source of truth and dedicated tests.

## Alternatives Considered

- Full component decomposition. Deferred because Phase 3 is about completeness, and a large visual refactor would add risk without directly improving user flow.
