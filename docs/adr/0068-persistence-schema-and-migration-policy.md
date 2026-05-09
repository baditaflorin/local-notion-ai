# 0068 - Persistence Schema and Migration Policy

## Status

Accepted

## Context

Persisted settings and hash state must survive malformed or older data without crashing the app.

## Decision

- Settings use schema version 1 with zod validation and defaults.
- Unknown or invalid settings fall back to defaults and can be overwritten on the next save.
- JSON workspace export remains schema version 2.
- Share hash state uses schema version 1 and is validated before importing.
- Breaking changes require a versioned parser with explicit migration or actionable rejection.

## Consequences

Bad localStorage or malformed share links cannot take down the app.

## Alternatives Considered

- Store raw preference booleans without a schema. Rejected because it creates silent drift.
