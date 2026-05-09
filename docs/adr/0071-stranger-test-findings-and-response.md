# 0071 - Stranger Test Findings and Response

## Status

Accepted

## Context

The Phase 3 stranger test is the final usability check. If another person is unavailable during the autonomous run, a fresh private browser context with real fixture data is an acceptable substitute and must be documented honestly.

## Decision

The stranger test will exercise:

- Fresh load from GitHub Pages/local preview.
- Import by a real-data pathway that is not the sample loader.
- Run one local AI action.
- Export/copy/share/print at least one output.
- Clear or restore state.

The top three blockers found during the test must be fixed before release.

## Consequences

The postmortem must answer whether a stranger can use the app for their own work and where the answer is still no.

## Alternatives Considered

- Rely only on unit and smoke tests. Rejected because the goal is end-to-end usability, not just correctness.
