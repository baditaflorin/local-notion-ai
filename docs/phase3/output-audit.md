# Phase 3 Output Pathway Audit

Status key: green = works end-to-end; yellow = partial; red = missing/broken; gray = deliberately out of scope.

## Before Implementation

| Output pathway          | Status | Evidence                                                                                      | User impact                                                  |
| ----------------------- | ------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| JSON workspace export   | green  | Header export downloads an `ExportBundle` v2 with app version, commit, digest, and documents. | Canonical state can leave the app.                           |
| JSON restore round-trip | green  | `parseExportBundle` accepts v1/v2 and reanalyzes documents.                                   | Existing exports are useful.                                 |
| CSV export              | red    | No CSV exporter or control exists.                                                            | Users cannot take document-level analysis into spreadsheets. |
| Copy AI result          | red    | No copy button exists beside generated summary/rewrite/Q&A.                                   | Users must select and copy manually.                         |
| Copy workspace/report   | red    | No structured text report copy exists.                                                        | Harder to paste summaries elsewhere.                         |
| Shareable URL           | red    | No hash state or share link encoder exists.                                                   | Small workspaces cannot be shared as static URLs.            |
| Downloadable state file | green  | JSON export is the state file.                                                                | Works, but docs need to say so.                              |
| Print/PDF view          | red    | No print action or print-safe output exists.                                                  | Users cannot produce a predictable client handoff.           |
| Screenshot/export image | gray   | Not a core Notion AI replacement output.                                                      | Keep out of scope.                                           |
| Embed code/API/curl     | gray   | Mode A has no runtime API.                                                                    | Must stay out of scope unless architecture changes.          |

## After Target

| Output pathway          | Target status | Completion criteria                                                                                   |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| JSON workspace export   | green         | Existing control remains and import can round-trip.                                                   |
| JSON restore round-trip | green         | Covered by fixture/unit tests.                                                                        |
| CSV export              | green         | Documents export to deterministic CSV with kind, confidence, word count, warnings, and source digest. |
| Copy AI result          | green         | AI output can be copied with visible success/failure feedback.                                        |
| Copy workspace/report   | green         | Current AI/report text is copyable; no hidden manual selection required.                              |
| Shareable URL           | green         | Small workspace state link is copied; oversized state gives an actionable error.                      |
| Downloadable state file | green         | README documents JSON as canonical state.                                                             |
| Print/PDF view          | green         | Print action opens/prints a deterministic report for the current AI result.                           |
| Screenshot/export image | gray          | Out of scope in ADR 0062.                                                                             |
| Embed code/API/curl     | gray          | Out of scope in ADR 0062 for Mode A.                                                                  |
