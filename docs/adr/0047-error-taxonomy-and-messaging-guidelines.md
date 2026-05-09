# 0047 - Error Taxonomy And Messaging Guidelines

## Status

Accepted

## Context

The old import path collapsed distinct failures into generic messages.

## Decision

Every import error must include:

- what failed
- why it failed in domain terms
- what the user should do next

Covered cases include empty files, unsupported PDFs, invalid JSON exports, and unsupported export schemas.

## Consequences

- Recoverable errors become actionable.

## Alternatives Considered

- Generic toast failures with no reason.
