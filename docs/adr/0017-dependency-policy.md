# 0017 - Dependency Policy

## Status

Accepted

## Context

The project should use production-ready libraries and avoid custom implementations where a battle-tested package exists.

## Decision

Accept small, mature dependencies for core concerns:

- Vite, TypeScript, Preact, Tailwind CSS for frontend.
- Yjs for CRDT-ready workspace state.
- Zod for import and metadata validation.
- MiniSearch for local full-text search.
- Vitest and Playwright for tests.

Keep model/WASM dependencies lazy and explicitly justified before adding them.

## Consequences

- The v1 bundle remains practical for Pages.
- Dependency drift is controlled by `package-lock.json` and `npm audit`.

## Alternatives Considered

- Hand-written search and validation: rejected where maintained libraries are available.
- Large LLM packages at startup: rejected by the asset budget.

