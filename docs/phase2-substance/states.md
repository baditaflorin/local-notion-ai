# State Taxonomy

## App States

- `loading-workspace`
  Reads IndexedDB and reanalyzes stored documents.
- `loaded-empty`
  No documents exist yet. User can import or load samples.
- `loaded-some`
  At least one document exists and the selected document is editable.
- `operation-import`
  One or more files are being imported and analyzed.
- `operation-restore`
  A bundle is being restored.
- `operation-run-ai`
  Summary, rewrite, or Q&A is running locally.
- `error-recoverable`
  An import or restore failed, but the current workspace is intact.
- `debug-visible`
  Internal signals, chunk counts, and inference hints are shown.

## Exit Guarantees

- `loading-workspace` exits to `loaded-empty`, `loaded-some`, or `error-recoverable`.
- `operation-import` exits to `loaded-some` or `error-recoverable`, and can be cancelled.
- `operation-restore` exits to `loaded-some` or `error-recoverable`.
- `operation-run-ai` exits to `loaded-some` with a result object.
- `error-recoverable` always leaves at least one next step visible to the user.
