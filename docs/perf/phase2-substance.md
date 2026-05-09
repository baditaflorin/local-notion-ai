# Phase 2 Substance Performance Notes

Measured with:

`npx vite-node scripts/benchmark-fixtures.ts`

Current fixture benchmark:

- median: `0.33 ms`
- p95: `4.84 ms`
- worst: `4.84 ms`

Interpretation:

- The current deterministic analysis heuristics are well within the under-300 ms target for the committed fixture set.
- The heaviest fixture in this set is `article-page.html`.
- This benchmark measures analysis only, not full browser rendering or multi-file import overhead.
