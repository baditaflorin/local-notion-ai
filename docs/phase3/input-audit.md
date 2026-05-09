# Phase 3 Input Pathway Audit

Status key: green = works end-to-end on real user data; yellow = works partially or has caveats; red = visible or claimed path is missing/broken; gray = deliberately out of scope for this static app.

## Before Implementation

| Input pathway            | Status | Evidence                                                                                                       | User impact                                                                |
| ------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| File upload              | green  | Header Import button accepts `.txt`, `.md`, `.csv`, `.json`, `.html`, `.eml` and imports multiple files.       | Primary path works.                                                        |
| Multi-file import        | yellow | `documentsFromFiles` loops over files, but one bad file rejects the whole batch.                               | A single empty or PDF file blocks otherwise valid work.                    |
| Mobile file picker       | yellow | Native file input should open iOS/Android Files, but no mobile-specific audit or copy explains the limitation. | Mobile users can pick files, but the app gives little recovery guidance.   |
| Drag and drop            | red    | No `drop`/`dragover` handlers exist in `src/App.tsx`.                                                          | Desktop users try dropping files and nothing intentional happens.          |
| Paste plain text/HTML    | red    | No paste box or clipboard import control exists.                                                               | Users must create a file before using copied content.                      |
| Clipboard read           | red    | No `navigator.clipboard.readText` path exists.                                                                 | Browser-permission flow is absent.                                         |
| URL input                | red    | No URL field exists.                                                                                           | Users cannot bring a page URL and learn whether static Pages can fetch it. |
| Image paste/import       | gray   | OCR is outside Mode A v1/v2/v3 scope and would imply a heavier engine.                                         | Must remain explicitly unsupported.                                        |
| Folder import            | gray   | Browser folder upload is not documented or required for the core Notion AI replacement path.                   | Multi-file import covers the practical static use case.                    |
| Sample/demo loader       | green  | Empty workspace shows Load samples.                                                                            | Good first-run path, but it is too prominent compared with real inputs.    |
| Exported state restore   | green  | Restore export parses schema v1/v2 JSON.                                                                       | Existing work can be reloaded.                                             |
| Deep link/imported state | red    | No hash/query state decoder exists.                                                                            | Small shared workspaces cannot be opened from a URL.                       |
| Autosave restore         | green  | Yjs update persists to IndexedDB and reloads via `WorkspaceStore.load`.                                        | Existing local state returns after reload.                                 |

## After Target

| Input pathway            | Target status | Completion criteria                                                                                      |
| ------------------------ | ------------- | -------------------------------------------------------------------------------------------------------- |
| File upload              | green         | Keeps current behavior and retains actionable errors.                                                    |
| Multi-file import        | green         | Partial success imports valid files and reports per-file failures.                                       |
| Mobile file picker       | green         | Native file input remains the path; docs name tested static limitations.                                 |
| Drag and drop            | green         | Dropped files and dropped text import through the same analyzer.                                         |
| Paste plain text/HTML    | green         | Paste box creates a document without requiring a saved file.                                             |
| Clipboard read           | green         | Clipboard button imports text when permission allows and gives a fallback when denied.                   |
| URL input                | green         | CORS-enabled text/HTML URLs import; blocked URLs explain why and tell users to paste rendered text/HTML. |
| Image paste/import       | gray          | Explicitly out of scope in ADR 0061 and README limitations.                                              |
| Folder import            | gray          | Explicitly out of scope in ADR 0061 and README limitations.                                              |
| Sample/demo loader       | green         | Demo remains available without being the only obvious entry point.                                       |
| Exported state restore   | green         | Restore remains schema-validated.                                                                        |
| Deep link/imported state | green         | Small workspaces can load from a hash state link.                                                        |
| Autosave restore         | green         | Clear-state control remains the escape hatch.                                                            |
