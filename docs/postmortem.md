# Postmortem

## What Was Built

`local-notion-ai` v0.1.0 is a pure GitHub Pages app for importing local documents, storing them in IndexedDB through a Yjs workspace model, searching them locally, and running deterministic local summarize, rewrite, and Q&A workflows.

Live site:

https://baditaflorin.github.io/local-notion-ai/

Repository:

https://github.com/baditaflorin/local-notion-ai

## Was Mode A Correct?

Yes. Mode A was the right v1 choice. The app has no auth, no shared writes, no runtime secrets, and no cross-device sync requirement. All meaningful work can happen in the browser, and GitHub Pages is enough for deployment.

The original local LLM/Tantivy/Pandoc/sentence-transformers direction still makes sense as an extension path, but shipping those heavy adapters in v1 would have made the first load worse and complicated Pages headers. The v1 implementation keeps the adapter boundary clean without pretending there is a hidden server.

## What Worked

- GitHub Pages was enabled from the first commit and served from `main` `/docs`.
- The frontend builds to a small initial bundle, around 56 KB gzipped JavaScript.
- The app exposes the GitHub repository, PayPal support link, version, and commit in the UI.
- Unit tests and Playwright smoke tests cover the core local path.

## What Did Not Work

- The first smoke test assertion looked for the raw filename `import-note`, while the UI intentionally normalizes titles to `import note`.
- The local machine ran out of disk space during a Vite temp-file write; clearing npm cache resolved it.

## Surprises

- The build stayed comfortably under the initial JavaScript budget even with Yjs, MiniSearch, Zod, Preact, and icons.
- The static Pages preview server was useful enough to avoid a heavier preview dependency.

## Accepted Tech Debt

- Summarization, rewriting, and Q&A are deterministic local heuristics, not a true local LLM yet.
- Pandoc/Tantivy/sentence-transformer adapters are documented extension points rather than shipped WASM modules.
- IndexedDB persistence is local-browser only; there is no device sync.

## Next Improvements

1. Add an optional lazy-loaded embeddings adapter for semantic search.
2. Add Markdown/HTML parsing improvements and richer document chunking.
3. Add an OPFS-backed large-workspace mode for bigger document sets.

## Time Spent Vs Estimate

Estimated: 4-6 hours for a complete static v1 scaffold with docs, tests, and publishing.

Actual: about 2 hours in this implementation pass, with the scope kept intentionally tight around a shippable Mode A v1.
