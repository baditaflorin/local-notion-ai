# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

The project instructions require a Go backend layout for Modes B/C, but this project selected Mode A.

## Decision

Skip the Go backend entirely in v1. No `cmd/`, `internal/`, `pkg/`, `api/`, or Docker server layout is created.

## Consequences

- There is no runtime backend to build, deploy, secure, or monitor.
- Make targets for Go, Docker, and Compose are omitted.
- If a future Mode B/C transition happens, a new ADR must define the Go project layout before code is added.

## Alternatives Considered

- Empty Go folders: rejected because they imply a backend that does not exist.

