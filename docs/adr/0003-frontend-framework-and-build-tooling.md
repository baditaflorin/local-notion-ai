# 0003 - Frontend Framework And Build Tooling

## Status

Accepted

## Context

The frontend must be TypeScript strict, GitHub Pages compatible, small enough for a static app, and pleasant to maintain.

## Decision

Use Vite, TypeScript strict mode, Preact, Tailwind CSS, Vitest, ESLint, and Prettier.

Preact gives React-style components with a smaller runtime. Vite handles fast development and hashed production assets. Tailwind provides a constrained utility layer without a large component library.

## Consequences

- The app can build to `docs/` for Pages.
- Initial JavaScript remains small because heavier local AI modules are not part of first paint.
- Developers use `make dev`, `make test`, `make lint`, and `make build`.

## Alternatives Considered

- React: familiar, but larger than needed for v1.
- Vanilla TypeScript only: smaller, but UI state would become harder to maintain.
- Svelte: strong option, but Preact better matches the broader ecosystem for this project.
