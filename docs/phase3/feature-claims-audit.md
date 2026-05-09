# Phase 3 Feature Claims Audit

## Sources Reviewed

- `README.md`
- `docs/architecture.md`
- `docs/adr/*.md`
- In-app labels in `src/App.tsx`

## Before Implementation

| Claim                                                | Source                  | Status            | Reality check                                                                            |
| ---------------------------------------------------- | ----------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| Offline-first Notion AI alternative                  | README                  | shipped partially | Summarize/rewrite/Q&A are local and offline, but input/output completeness is thin.      |
| Summarizing, rewriting, and querying local workspace | README/package          | shipped fully     | Deterministic local NLP paths exist and are covered by Phase 2 fixture tests.            |
| Documents are kept in browser storage                | README                  | shipped fully     | IndexedDB + Yjs update store exists.                                                     |
| No runtime backend                                   | README/ADRs             | shipped fully     | Mode A static Pages only.                                                                |
| Version and commit are visible                       | User requirement/in-app | shipped fully     | Header shows `v{version}` and short commit.                                              |
| Repository and PayPal links are visible              | User requirement/in-app | shipped fully     | Header links to GitHub and PayPal.                                                       |
| Import Markdown/text/CSV/HTML/JSON/email             | App accept list         | shipped partially | Accepted and analyzed, but paste/drag/drop/URL and partial batch failure are incomplete. |
| Export workspace                                     | App label               | shipped fully     | Downloads JSON state.                                                                    |
| Debug surface                                        | App label/ADR 0049      | shipped partially | `?debug=1` and toggle work, but there is no persisted setting.                           |
| GitHub Pages from day one                            | ADR 0010                | shipped fully     | `docs/` contains built site.                                                             |
| PWA/offline friendly                                 | ADRs/docs               | shipped fully     | Manifest and service worker exist in `docs/`.                                            |

## Mismatches To Fix

1. README underspecifies real input/output pathways and limitations.
2. App accept-list implies robust multi-file import, but one bad file currently blocks all files.
3. Debug surface claim is true only for the current session.
4. There is no honest URL/CORS guidance despite users naturally bringing URLs.
5. There is no tested claim for CSV export, copy, share, or print because those outputs do not exist yet.
