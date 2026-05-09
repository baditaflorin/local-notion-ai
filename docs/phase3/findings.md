# Phase 3 Findings Synthesis

## Top 5 Usability Gaps

1. Users cannot paste copied notes, rendered HTML, or email text directly; they must create a file first.
2. Users cannot drop files/text onto the app, even though desktop users expect this on document tools.
3. A single bad file in a multi-file import can prevent valid files from landing in the workspace.
4. Users cannot take AI output out cleanly except by manually selecting text.
5. Users cannot produce spreadsheet-friendly CSV, print-friendly reports, or small share links.

## Top 5 Half-Baked Features

| Feature               | Decision         | Rationale                                                                                 |
| --------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| Debug surface         | finish           | It already exists; persist the user's preference and keep `?debug=1`.                     |
| Import accept-list    | finish           | The app claims many text-like formats; batch behavior must match that promise.            |
| Export workspace      | finish           | JSON works; add adjacent CSV/share/copy/print outputs rather than making users improvise. |
| URL input expectation | finish honestly  | Static Pages cannot bypass CORS; the app should try safe fetches and give paste guidance. |
| Settings              | finish minimally | Phase 3 requires settings completeness; implement only settings that change behavior.     |

## Top 5 Codebase Pain Points

1. `src/App.tsx` owns too much of the input/output workflow.
2. Download behavior is JSON-specific and would invite copy-pasted Blob code.
3. Search fallback uses an unsafe domain cast.
4. Parsed test fixture expectations are unvalidated.
5. No single persisted settings schema exists.

## Top 5 Documentation / Reality Mismatches

1. README does not say what import pathways work.
2. README does not document URL/CORS limitations.
3. README does not document JSON export as canonical state.
4. README does not name unsupported image/OCR/folder/API paths.
5. README does not tie feature claims to the Phase 2/3 fixture and smoke tests.

## Fully Usable Means

- A stranger can load their own text-like data by file, drop, paste, clipboard, CORS-enabled URL, JSON restore, or share link.
- A stranger can get useful local summary/rewrite/Q&A output and copy, print, export JSON, export CSV, or share a small state URL.
- Bad inputs do not erase good inputs; failures explain what failed, why, and what to do next.
- Settings that appear in the UI persist and visibly change behavior.
- README claims match tested behavior and limitations.

## Phase 3 Success Metrics

- Input audit: every non-gray row green after implementation.
- Output audit: every non-gray row green after implementation.
- Controls audit: no red or yellow rows for production controls.
- Codebase audit: 0 source TODO/FIXME/XXX/HACK, 0 unsafe casts outside boundary code, and extracted helpers for new output/share/settings behavior.
- Test gate: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke` pass locally.
- Stranger test: top 3 fresh-user blockers are fixed before release.

## Out Of Scope

- OCR/image understanding.
- Runtime backend, accounts, collaboration, cross-device sync, or server-side URL proxying.
- New AI engine capabilities beyond Phase 2 substance behavior.
- Visual polish work unrelated to completing real input/output/control paths.

## After Implementation Summary

- Input rows: 11 green, 2 gray, 0 yellow, 0 red.
- Output rows: 8 green, 2 gray, 0 yellow, 0 red.
- Control groups: 9 green, 0 yellow, 0 red.
- Codebase health: 0 TODO/FIXME/XXX/HACK, 0 `any`, 0 `@ts-ignore`, and unsafe casts removed outside the import-error boundary.
- New tests: settings persistence, share state, CSV/report export, partial import, validated real-data expectations, and Playwright paste/CSV smoke.
