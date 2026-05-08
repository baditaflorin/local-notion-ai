# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode A has no server deployment. The topology must make the GitHub Pages boundary explicit.

## Decision

Deploy only the static `docs/` directory through GitHub Pages. Users access the app at:

https://baditaflorin.github.io/local-notion-ai/

All private data and AI processing stay in the browser.

## Consequences

- No Docker, nginx, TLS certificates, host ports, or server backups are needed.
- Availability depends on GitHub Pages and the user's browser storage.

## Alternatives Considered

- Pages frontend plus Docker backend: rejected by ADR 0001.
