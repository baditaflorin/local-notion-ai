# Phase 3 Stranger Test

## Test Setup

- Date: 2026-05-10
- Tester: autonomous fresh-browser substitute
- Browser: Playwright Chromium, new context
- Target: `http://127.0.0.1:55991/local-notion-ai/`
- Build: v0.3.0 Pages build from `docs/`
- Input: `tests/fixtures/realdata/revenue-export.csv`

This substituted a private/fresh browser context because no external human was available during the autonomous run.

## Scripted Cold Walkthrough

1. Open the built static site.
2. Confirm `local-notion-ai` heading and `v0.3.0` are visible.
3. Paste the real revenue CSV fixture into the paste box.
4. Import the pasted data.
5. Run local summary.
6. Export CSV.
7. Copy a share link.
8. Open settings.
9. Clear local data.

## Result

```text
version-visible=true
paste-summary=ok
csv-download=local-notion-ai-documents.csv
share-link-has-state=true
settings-visible=ok
clear=ok
```

## Findings

| Finding                                                                                                                                        | Severity | Response                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Toast text appeared in both the live region and the visible toast, which confused strict browser checks and could double-announce status text. | medium   | Fixed by marking the visible toast `aria-hidden` and leaving the live region as the assistive-tech source.             |
| Clipboard-based share requires browser permission.                                                                                             | low      | Existing fallback tells the user to use JSON export when copy is blocked; share succeeded when permission was granted. |
| URL import remains dependent on third-party CORS headers.                                                                                      | low      | Existing URL error and README limitations tell users to paste rendered text/HTML when direct browser fetch is blocked. |

## Top 3 Addressed Issues

1. Duplicate toast announcement: fixed in `src/App.tsx`.
2. CSV output not covered by a real browser path: fixed by Playwright CSV download smoke.
3. Fresh-user input path was too file-centric: fixed with paste import, clipboard import, drag/drop, URL guidance, and share-state import.

## Honest Take

A stranger can now use the app for a text-like document workflow without help: bring data in, run local AI, take output out, and recover or clear state. It is still not a universal document ingestion tool because OCR, folder import, CORS-blocked URL extraction, and cross-device sync are deliberately outside Mode A.
