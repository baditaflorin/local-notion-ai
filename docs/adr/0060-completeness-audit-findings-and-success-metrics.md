# 0060 - Completeness Audit Findings and Phase 3 Success Metrics

## Status

Accepted

## Context

Phase 2 made the local analysis engine substantially smarter, but Phase 3 asks whether a stranger can use the public URL for their own work without help. The audits in `docs/phase3/` found that the engine is usable only after data reaches it. Several ordinary entry and exit paths are missing: paste, drag/drop, URL guidance, CSV, copy, print, settings, and share links.

## Decision

Phase 3 will treat input/output/control completeness as release blockers. Every non-gray row in the input, output, and controls audits must end green, or the row must get a documented out-of-scope decision.

Success metrics:

- Input audit: all non-gray rows green.
- Output audit: all non-gray rows green.
- Controls audit: no red/yellow production controls.
- No production stubs or source TODO/FIXME/XXX/HACK comments.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run smoke` pass locally.
- Version bumps to the next minor and the release is tagged.

## Consequences

The work prioritizes completing existing promises over visual polish or new AI engine behavior. Some apparently attractive paths, such as OCR and server-side URL proxying, stay out of scope because they would change the Mode A architecture.

## Alternatives Considered

- Add new AI features first. Rejected because users still need reliable ways to load and export their own work.
- Polish the UI first. Rejected because it would not fix missing handlers and output paths.
