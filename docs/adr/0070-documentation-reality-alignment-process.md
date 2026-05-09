# 0070 - Documentation Reality Alignment Process

## Status

Accepted

## Context

Phase 3 treats README and in-app claims as testable product surface. Claims without working controls make the app feel unfinished.

## Decision

README updates must:

- List tested input and output pathways.
- Name important static-mode limitations.
- Keep the live GitHub Pages URL, repository URL, PayPal URL, version/commit behavior, and quickstart clear.
- Avoid claiming unsupported OCR, proxy, account, sync, or API behavior.

Feature claims should correspond to tests, smoke coverage, or audit evidence.

## Consequences

Documentation becomes an honest user guide rather than a wish list.

## Alternatives Considered

- Keep README short and omit limitations. Rejected because users need to know what static Pages can and cannot do.
