# 0044 - Confidence Model And Surface

## Status

Accepted

## Context

The v1 app gave confident-looking answers even when the retrieval basis was weak.

## Decision

Surface confidence at three levels:

- inferred document kind
- AI result confidence
- detected field confidence

Confidence is bucketed into `high`, `medium`, and `low` with a stable numeric score underneath.

## Consequences

- Low-confidence answers no longer look the same as high-confidence answers.
- Exports can carry provenance and confidence context.

## Alternatives Considered

- Keep confidence internal only.
