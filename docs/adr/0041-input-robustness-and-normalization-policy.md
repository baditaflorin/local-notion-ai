# 0041 - Input Robustness And Normalization Policy

## Status

Accepted

## Context

Imported files arrive with encoding artifacts, boilerplate, quoted history, and inconsistent structure.

## Decision

Normalize at import boundaries:

- Remove BOM, zero-width characters, NBSP, and curly punctuation artifacts.
- Normalize line endings to LF.
- Strip HTML boilerplate and tags into readable text.
- Convert CSV into deterministic row-oriented text.
- Down-weight quoted email history.
- Reanalyze legacy bundles on load and restore.

## Consequences

- Analysis becomes more stable and more honest.
- The app can disclose normalization warnings when it changed the source shape.

## Alternatives Considered

- Preserve raw text only and force manual cleanup.
