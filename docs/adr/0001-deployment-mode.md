# 0001 - Deployment Mode

## Status

Accepted

## Context

The product is an offline-first Notion AI alternative for summarization, rewriting, and Q&A over local documents. The default project constraint is GitHub Pages first, with a runtime backend only when browser or build-time execution is insufficient.

## Decision

Use Mode A: Pure GitHub Pages.

The app is a static frontend published from `main` `/docs`. User documents are imported in the browser, persisted to IndexedDB, indexed locally, and processed by browser-side workers and JavaScript modules. No authentication, server state, runtime API, hosted database, or secret-bearing backend is required for v1.

## Consequences

- The public deployment surface is a static GitHub Pages site.
- The app works offline after the service worker has cached the shell.
- Privacy is strong by default because documents never leave the browser.
- Expensive native tools such as Tantivy, Pandoc, and large local LLM runtimes are represented by browser-suitable modules or deferred adapters rather than server services in v1.
- Sections for Go backend, Docker, nginx, Prometheus, and server deployment are intentionally absent.

## Alternatives Considered

- Mode B with pre-built artifacts: rejected because user documents are private and imported locally, so there is no shared dataset to precompute.
- Mode C with Docker backend: rejected because v1 has no cross-device sync, auth, secrets, or runtime mutations that require a server.

