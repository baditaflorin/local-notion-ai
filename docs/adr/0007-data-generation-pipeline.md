# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode B projects need an offline data generation pipeline. This project selected Mode A.

## Decision

Do not create a static data generation pipeline in v1. All user data is imported in the browser and remains local. The only generated static artifact is public build metadata (`version.json`) emitted during `make build`.

## Consequences

- There is no `make data` target for v1.
- No Parquet, SQLite, or JSON data dumps are committed or uploaded to GitHub Releases.
- Future shared datasets require a new ADR before implementation.

## Alternatives Considered

- Sample-data pipeline: rejected because it would distract from the private local workspace flow.
