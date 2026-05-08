# 0013 - Testing Strategy

## Status

Accepted

## Context

The app has local logic for import, search, summarization, rewriting, Q&A, storage contracts, and UI smoke paths.

## Decision

Use:

- Vitest unit tests colocated with source for frontend logic modules.
- Playwright smoke test for a built Pages preview.
- `scripts/smoke.sh` to build, serve `docs/`, and run the happy path.
- Make targets as the single entrypoint.

## Consequences

- `make test`, `make build`, and `make smoke` validate the release path locally.
- Tests stay fast enough for pre-push hooks.

## Alternatives Considered

- GitHub Actions: explicitly excluded.
- Browser-only manual QA: insufficient for repeated releases.
