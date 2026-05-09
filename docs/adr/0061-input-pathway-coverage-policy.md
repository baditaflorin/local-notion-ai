# 0061 - Input Pathway Coverage Policy

## Status

Accepted

## Context

The app already imports files and restores JSON exports, but users naturally bring data by paste, clipboard, drag/drop, and URLs. GitHub Pages cannot provide a secret-backed proxy or server-side extraction.

## Decision

Supported input pathways in Phase 3:

- File upload for text-like files.
- Multi-file upload with partial success.
- Native mobile file picker through the browser file input.
- Drag/drop for files and dropped text.
- Paste box for copied plain text or rendered HTML.
- Clipboard-read import with fallback instructions when permission is denied.
- URL import only when the remote page is CORS-accessible from the browser.
- Hash share-state import for small workspaces.
- JSON export restore.
- Autosaved IndexedDB workspace restore.

Out of scope:

- Image/OCR import.
- Browser folder import.
- Server-side URL proxying.
- Authenticated fetches or secret-backed APIs.

## Consequences

Every supported pathway runs through the same local analyzer after content is obtained. CORS failures are explained in product language: paste the rendered page text/HTML instead of expecting the static app to bypass the browser.

## Alternatives Considered

- Add a Docker proxy backend. Rejected because Phase 3 cannot escalate from Mode A.
- Hide URL input entirely. Rejected because users will try URLs anyway; honest failure is better than silence.
