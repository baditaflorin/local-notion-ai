# Phase 3 Postmortem

## Audit Grids

| Audit           | Before                                                                         | After                                   |
| --------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| Input pathways  | 5 green, 2 yellow, 4 red, 2 gray                                               | 11 green, 0 yellow, 0 red, 2 gray       |
| Output pathways | 3 green, 5 red, 2 gray                                                         | 8 green, 0 yellow, 0 red, 2 gray        |
| Controls        | Most core controls green, 2 yellow, missing settings and output/input controls | 9 green control groups, 0 yellow, 0 red |

## Half-Baked Feature Triage

| Feature                  | Outcome                        | Rationale                                                                                 |
| ------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------- |
| Debug surface            | Finished                       | Existing toggle stayed; setting now controls debug by default.                            |
| Broad import accept-list | Finished                       | Partial multi-file import, paste, clipboard, drop, URL, and share-state import are wired. |
| Workspace export         | Finished                       | JSON stayed canonical; CSV/share/copy/print were added as scoped exits.                   |
| URL input expectation    | Finished honestly              | CORS-readable URLs work; blocked URLs explain the paste fallback.                         |
| Settings                 | Finished minimally             | Three settings exist, persist, and change behavior.                                       |
| OCR/image import         | Hidden/documented out of scope | Too large for Mode A v3 completeness.                                                     |
| Folder import            | Hidden/documented out of scope | Multi-file input covers the practical static workflow.                                    |

## Codebase Health

| Metric                          | Before                                                         | After                                                                                   |
| ------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Source TODO/FIXME/XXX/HACK      | 0                                                              | 0                                                                                       |
| `any` and `@ts-ignore`          | 0                                                              | 0                                                                                       |
| Unsafe casts outside boundaries | 2                                                              | 0 known                                                                                 |
| Real-data fixtures              | 10 passing                                                     | 10 passing                                                                              |
| Unit tests                      | 18 tests                                                       | 24 tests                                                                                |
| E2E smoke paths                 | sample, file import, Q&A                                       | sample, file import, paste import, Q&A, CSV download                                    |
| DRY/SOLID                       | Blob/export/settings/share logic would have lived in `App.tsx` | Download, export formats, settings, share state, labels, and workspace panels split out |

Remaining accepted debt: `src/App.tsx` is still large because it coordinates browser events and application state. The presentational workspace panels and helper logic are split out, but deeper handler decomposition should be Phase 4.

## Stranger Test

Fresh browser context against the built Pages site succeeded:

- Version visible.
- Real CSV fixture pasted and imported.
- Local summary produced.
- CSV downloaded.
- Share link copied.
- Settings opened.
- Local data cleared.

Top issue found: duplicated toast text in the live region and visible toast. Fixed by hiding the visible toast from assistive tech.

## Documentation Alignment

README now lists verified input and output paths, tested paths, and Mode A limitations. Claims about OCR, account sync, APIs, folder import, and server-side proxying are explicitly not made.

## What Surprised Me

The core analysis engine was already good enough after Phase 2; the app felt incomplete mostly because users could not enter or exit through ordinary browser workflows. Paste import and CSV export changed the product feel more than another algorithm tweak would have.

## Still-Open Completeness Gaps

1. `src/App.tsx` should be split into controller hooks and smaller panels.
2. Drag/drop should get explicit browser test coverage.
3. URL import could preflight content type and give more specific CORS/status messages.
4. Share links could display their size before copy for large workspaces.
5. Settings could get migration tests for a future v2 settings schema.

## Honest Take

Could a stranger now use this app for their own real work, end-to-end, with zero help? For text-like local documents, yes: they can bring data in, run useful local AI, export or share results, and recover state. For PDFs, images, CORS-blocked pages, folders, cross-device sync, or account workflows, no, and the README now says so plainly. It feels like a usable static local workspace now, not just a toy demo, but it is still intentionally a browser-only tool.
