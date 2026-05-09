# 0063 - Half-Baked Feature Triage Decisions

## Status

Accepted

## Context

Phase 3 requires finishing, hiding, or deleting incomplete features. The audit found several features that were present but incomplete rather than absent by design.

## Decision

| Feature                  | Decision                   | Rationale                                                                                            |
| ------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| Debug surface            | Finish                     | Keep the existing debug toggle and `?debug=1`, add a persisted setting.                              |
| Broad import accept-list | Finish                     | Make multi-file behavior partial-success and add paste/drop/URL pathways to match user expectations. |
| Workspace export         | Finish                     | Keep JSON state export and add CSV/share/print/copy exits nearby.                                    |
| URL input                | Finish honestly            | Try direct browser fetch only; explain CORS fallback.                                                |
| Settings                 | Finish minimally           | Add only settings that immediately change behavior.                                                  |
| OCR/image import         | Hide/document out of scope | It would require a different engine and much larger payload.                                         |
| Folder import            | Hide/document out of scope | Multi-file covers the useful Mode A path without browser-specific folder APIs.                       |

## Consequences

The production UI will not expose placeholder toggles or controls. Any visible Phase 3 control must work end-to-end.

## Alternatives Considered

- Delete debug. Rejected because it is valuable for support and already implemented.
- Add many preference toggles. Rejected because every setting must do something verifiable.
