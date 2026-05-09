# Phase 3 Completeness Plan

Ranking is by real-user impact on the end-to-end workflow, not implementation novelty.

## Picklist

| Rank | Catalog item  | Work                                                                         | Success check                                                       |
| ---- | ------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1    | A1, A7        | Add paste-box import for plain text and copied HTML.                         | User can paste text and immediately get a document.                 |
| 2    | A6            | Add clipboard-read import with permission-aware fallback.                    | Denied clipboard access points to the paste box.                    |
| 3    | A1            | Add drag/drop file and text import.                                          | Dropped files/text route through the same analyzer.                 |
| 4    | A4            | Make multi-file import partial-success.                                      | One bad file no longer blocks valid files.                          |
| 5    | A2            | Keep format detection centralized on import.                                 | Imported files/paste/URL all get kind/confidence from one analyzer. |
| 6    | A3            | Add static-safe URL import with CORS guidance.                               | CORS-enabled URL imports; blocked URL explains paste fallback.      |
| 7    | A8, I38       | Preserve and expose autosave recovery plus start-fresh behavior.             | Reload keeps data; clear resets data and AI state.                  |
| 8    | B10           | Add copy-to-clipboard for AI output.                                         | Visible copied/error toast.                                         |
| 9    | B9, B14       | Add deterministic CSV export for document analysis.                          | CSV imports cleanly in spreadsheets and has stable ordering.        |
| 10   | B11, I41      | Keep JSON export as canonical state and test round-trip.                     | Exported JSON restore recreates documents.                          |
| 11   | B12           | Add small shareable hash URL.                                                | Link opens/restores state; oversized state gives actionable error.  |
| 12   | B13           | Add print-friendly AI report.                                                | Print command contains title, output, confidence, citations.        |
| 13   | C15           | Triage half-baked features in ADR 0063.                                      | Kept/hidden/deleted decisions are written before changes.           |
| 14   | C16           | Finish debug surface persistence.                                            | Setting survives reload and affects debug default.                  |
| 15   | C18, I38      | Add minimal settings panel with only working settings.                       | Every setting changes behavior and persists.                        |
| 16   | C19, J42, J45 | Align README claims and limitations.                                         | README feature checklist is truthful.                               |
| 17   | D20, D21      | Extract generic download helpers.                                            | JSON/CSV/report downloads use one helper.                           |
| 18   | D23, H36      | Add shared zod schemas for settings/share/test fixture boundaries.           | External persisted/hash/test JSON is validated.                     |
| 19   | E24           | Move share/settings/export logic out of `App.tsx`.                           | New helpers own those concerns.                                     |
| 20   | G31           | Apply one user-facing error convention to new paths.                         | Every new failure has what/why/now what.                            |
| 21   | G33           | Normalize naming for input/output handlers.                                  | Handler names describe the user action and output.                  |
| 22   | H35           | Remove unsafe casts outside boundary code.                                   | Search and fixture tests avoid unchecked `as` casts.                |
| 23   | H37           | Parse numbers/dates/booleans explicitly in new exports/settings.             | No silent coercion in new boundaries.                               |
| 24   | I39           | Add settings schema migration/defaulting.                                    | Bad old settings fall back without crashing.                        |
| 25   | I40           | Clear-state operation stays explicit and resets share/debug transient state. | User has a reliable escape hatch.                                   |
| 26   | I41           | Add export/import/share deterministic tests.                                 | Round-trip and share decode are covered.                            |
| 27   | J43           | Re-run README quickstart locally.                                            | Fresh commands pass.                                                |
| 28   | K46           | Run stranger test in a fresh browser context with real fixture data.         | Top confusion points documented.                                    |
| 29   | K47           | Fix top three stranger-test issues.                                          | Postmortem lists addressed issues.                                  |

## Implementation Order

1. ADR batch 0060-0071.
2. Helper modules: settings, export formats, share state, download, type-safe boundaries.
3. Input completeness in `src/App.tsx` and workspace import boundary.
4. Output completeness in `src/App.tsx`.
5. Settings and half-baked feature completion.
6. Tests and audit grid updates.
7. README/docs alignment.
8. Stranger test, postmortem, version bump, release.
