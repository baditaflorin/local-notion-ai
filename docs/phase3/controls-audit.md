# Phase 3 Controls Audit

Status key: green = handler does what the label says on real data; yellow = handler exists with caveats; red = missing/stub; gray = intentionally absent or out of scope.

## Before Implementation

| Control                                 | Status | Handler/status                      | Finding                                                                           |
| --------------------------------------- | ------ | ----------------------------------- | --------------------------------------------------------------------------------- |
| Import                                  | green  | `handleTextImport`                  | Imports supported files. Batch failure handling is too brittle.                   |
| Restore export                          | green  | `handleBundleImport`                | Restores validated JSON exports.                                                  |
| Export workspace                        | green  | `exportWorkspace`                   | Downloads canonical JSON state.                                                   |
| Toggle debug surface                    | yellow | `setShowDebug`                      | Works for the session and via `?debug=1`, but does not persist.                   |
| Star on GitHub                          | green  | Anchor to `buildInfo.repositoryUrl` | Satisfies repository discovery.                                                   |
| PayPal                                  | green  | Anchor to PayPal.me                 | Satisfies support link.                                                           |
| Search local docs                       | green  | `LocalSearchIndex.search`           | Works, but one fallback cast in the search module should be removed.              |
| Workspace rows                          | green  | `setActiveDocument`                 | Selects documents.                                                                |
| Load samples                            | green  | `loadSamples`                       | Loads deterministic samples.                                                      |
| Edit title/content                      | green  | `updateDocument`                    | Persists through Yjs/IndexedDB.                                                   |
| Remove document                         | green  | `removeDocument`                    | Removes selected record.                                                          |
| AI mode tabs                            | green  | `setAiMode`                         | Summary/rewrite/Q&A switch correctly.                                             |
| Rewrite style select                    | green  | `setRewriteStyle`                   | Feeds deterministic rewrite.                                                      |
| Question textarea                       | green  | `setQuestion`                       | Feeds Q&A.                                                                        |
| Run locally                             | green  | `runAi`                             | Runs local deterministic NLP.                                                     |
| Clear local data                        | green  | `clearWorkspace`                    | Clears Yjs update and visible state.                                              |
| Cancel import                           | yellow | `cancelOperation`                   | Aborts between files; still needs partial-result accounting.                      |
| Settings                                | red    | No settings page/control exists.    | Phase 3 requires persisted settings if settings are present; here there are none. |
| Paste/URL/share/copy/CSV/print controls | red    | No controls exist.                  | Missing output/input completeness paths.                                          |

## After Target

| Control                       | Target status | Completion criteria                                               |
| ----------------------------- | ------------- | ----------------------------------------------------------------- |
| Import                        | green         | Partial success and per-file failures are visible.                |
| Restore export                | green         | No regression.                                                    |
| Export workspace              | green         | No regression.                                                    |
| Toggle debug surface          | green         | Persists when the user opts into debug by default.                |
| Search local docs             | green         | Type-safe fallback without unsafe casts.                          |
| Cancel import                 | green         | Aborts remaining files and preserves already imported good files. |
| Settings                      | green         | Every setting persists and changes behavior.                      |
| Paste/clipboard/URL/drag-drop | green         | Each imports through the real analyzer.                           |
| Share/copy/CSV/print          | green         | Each produces a real artifact or actionable failure.              |
