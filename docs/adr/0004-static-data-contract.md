# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A does not ship server-generated data. The static site only needs build metadata and optional sample documents.

## Decision

Use a tiny static metadata contract:

- `version.json` in the Pages root.
- Fields: `version`, `commit`, `repositoryUrl`, `paypalUrl`, `builtAt`.
- The UI also receives the same values from Vite environment constants.

User documents are not static data. They live in IndexedDB and can be exported as JSON by the user.

## Consequences

- Pages can show version and commit without a runtime API.
- No release-hosted data artifacts are needed.
- Schema changes are rare and covered by tests.

## Alternatives Considered

- Commit user data artifacts: rejected because documents are private.
- Release-hosted SQLite/Parquet: unnecessary for v1.

