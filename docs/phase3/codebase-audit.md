# Phase 3 Codebase Health Audit

This document records measurements before Phase 3 implementation. It is intentionally descriptive; fixes happen in later commits.

## DRY Violations

| Area                 | Files                                         | Finding                                                                                                            |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Download helpers     | `src/lib/download/download.ts`, `src/App.tsx` | Only JSON download exists; future CSV/report downloads would duplicate Blob/link code unless extracted.            |
| Toast construction   | `src/App.tsx`                                 | Single local helper is fine; no cross-file duplication yet.                                                        |
| Import error shaping | `src/features/workspace/importDocuments.ts`   | Boundary error details are centralized. No duplicate error taxonomy found.                                         |
| Confidence labels    | `src/App.tsx`                                 | `labelForConfidence` and badge styling are repeated inline in a few UI branches; acceptable but should not spread. |

## SOLID / Module Boundaries

| Area                                        | Finding                                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                               | Large module mixes input controls, output controls, settings-like debug state, AI execution, and document editor rendering. It has more than one reason to change.                    |
| `src/features/workspace/importDocuments.ts` | Handles creation, file import, sample creation, export parsing, and error description. Still coherent as workspace import boundary, but batch import should be separated or isolated. |
| `src/features/search/searchEngine.ts`       | Contains one fallback cast to `DocumentRecord` solely to reuse `searchBody`; this is a type-safety smell.                                                                             |

## Dead Code

No abandoned source files or commented-out production blocks were found. Existing exports are referenced by tests or app code.

## TODO / FIXME / XXX / HACK

Source count: 0.

The only matches are fixture content (`console.log("analytics")` inside a real HTML fixture) and docs text that mentions placeholder examples.

## Type Safety Holes

| Location                                    | Finding                                             | Target                                                    |
| ------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| `tests/realdata/fixtures.test.ts`           | Casts parsed JSON as `FixtureExpectation`.          | Replace with a zod schema.                                |
| `src/features/search/searchEngine.ts`       | Casts a fallback object as `DocumentRecord`.        | Use a string fallback helper instead.                     |
| `src/features/workspace/importDocuments.ts` | Casts structured `ImportError` onto `Error.detail`. | Acceptable boundary pattern, but should remain localized. |
| `src/App.tsx`                               | Casts select value to `RewriteStyle`.               | Validate/narrow through a helper.                         |

## Inconsistent Patterns

- File import gives detailed domain errors, while missing pathways have no user-facing error because they do not exist.
- Settings are implicit (`?debug=1`) instead of a persisted settings model.
- Export is canonical JSON only; CSV/share/print would currently require new one-off helpers.

## Test Coverage Holes

- No tests for partial multi-file import.
- No tests for deterministic CSV export because it does not exist.
- No tests for settings persistence because settings do not exist.
- No tests for hash share-state encoding/decoding because share links do not exist.
- E2E smoke covers happy path only; it does not exercise paste, drag/drop, CSV, copy, share, or settings.
