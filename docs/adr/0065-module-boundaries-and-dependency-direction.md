# 0065 - Module Boundaries and Dependency Direction

## Status

Accepted

## Context

The app is a static Preact application. The healthiest dependency direction is UI orchestration to feature helpers to shared primitives, with no feature helper importing UI.

## Decision

Dependency direction:

- `src/App.tsx` may import feature, lib, and shared modules.
- Feature modules may import `src/lib/*` and `src/shared/*`.
- Lib modules may import shared types only when needed and must not import UI.
- Shared types must not import app code.

New Phase 3 helpers follow this direction.

## Consequences

The code remains easy to test without rendering Preact for every behavior.

## Alternatives Considered

- Introduce a formal layered lint plugin. Deferred until the repo grows enough to justify extra configuration.
