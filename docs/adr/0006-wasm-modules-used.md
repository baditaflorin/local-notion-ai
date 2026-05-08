# 0006 - WASM Modules Used

## Status

Accepted

## Context

The original concept mentions local LLMs, Tantivy, Pandoc, and sentence-transformers. GitHub Pages cannot set arbitrary COOP/COEP headers, and large WASM modules would harm first load.

## Decision

Do not load WASM on first release. Implement v1 with JavaScript modules and clear extension seams:

- Local search uses MiniSearch-style in-browser indexing.
- Summarization, rewriting, and Q&A use deterministic local NLP heuristics.
- Yjs provides CRDT-ready document state.
- Future WASM adapters for Tantivy/Pandoc/model runtimes must be lazy-loaded behind explicit user actions and documented in a new ADR.

## Consequences

- The app remains fast, offline-friendly, and Pages-compatible.
- v1 does not require COOP/COEP workarounds.
- The "local LLM" path remains a future adapter rather than a hidden server dependency.

## Alternatives Considered

- Transformers.js on first load: rejected because model payloads violate the initial asset budget.
- Pandoc WASM: rejected for v1 due to size and Pages header constraints.
