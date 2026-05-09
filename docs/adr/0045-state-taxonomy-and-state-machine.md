# 0045 - State Taxonomy And State Machine

## Status

Accepted

## Context

The app now has import, restore, analysis, debug, and AI-operation states that must stay coherent.

## Decision

Represent long-running work as explicit operation states with visible messages. Multi-file import can be cancelled. Every recoverable error leaves the workspace intact and exposes a next step through toast copy.

## Consequences

- No hidden half-imported state is left behind.
- The user can understand whether the app is idle, importing, restoring, or running analysis.

## Alternatives Considered

- Keep all operation state implicit in button clicks.
