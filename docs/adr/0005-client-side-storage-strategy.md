# 0005 - Client Side Storage Strategy

## Status

Accepted

## Context

The app needs durable local user documents and workspace state without a server.

## Decision

Use IndexedDB for durable persistence, with Yjs as the in-memory workspace model. Store encoded Yjs updates in IndexedDB and expose JSON export/import for portability. Use localStorage only for small UI preferences.

## Consequences

- Documents remain local to the browser profile.
- Yjs keeps the workspace model CRDT-ready without requiring a sync server in v1.
- Browser storage clearing removes local data, so export/import is important.

## Alternatives Considered

- OPFS: useful for larger binary stores but less necessary for text v1.
- localStorage: too small and synchronous for document bodies.
- Runtime database: rejected by Mode A.

