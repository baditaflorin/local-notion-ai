# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Browser console noise should be minimal, especially in production.

## Decision

Production builds avoid routine console logging. Errors are surfaced to users through visible UI states and a global toast. Development-only diagnostics may use `console.debug` behind Vite development mode.

## Consequences

- Users see actionable errors in the interface.
- Production console output should stay quiet unless an unexpected browser error occurs.

## Alternatives Considered

- Client log shipping: rejected because it adds analytics-like behavior and privacy concerns.

