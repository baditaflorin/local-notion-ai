# 0062 - Output Pathway Coverage Policy

## Status

Accepted

## Context

The app can export JSON state, but users also need lightweight outputs for spreadsheets, documents, support notes, and sharing small workspaces.

## Decision

Supported output pathways in Phase 3:

- Canonical JSON workspace export.
- JSON restore round-trip.
- Deterministic CSV export for document-level analysis.
- Copy current AI output to clipboard.
- Share small workspace state through a hash URL.
- Print-friendly current AI report.

Out of scope:

- Screenshot/image export.
- Embed code.
- API/curl output, because Mode A has no runtime API.

## Consequences

JSON remains the canonical state format. CSV is intentionally a lossy analysis export, not a second state format. Share links are size-limited and fail with clear guidance when the workspace is too large.

## Alternatives Considered

- Make CSV a complete state format. Rejected because it cannot preserve document content and provenance safely.
- Add a short-link backend. Rejected because it violates Mode A.
