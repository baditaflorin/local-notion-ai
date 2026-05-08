# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project avoids GitHub Actions, so quality gates must run locally.

## Decision

Use plain `.githooks/` wired by `git config core.hooksPath .githooks` through `make install-hooks`.

Hooks:

- `pre-commit`: format check, lint, TypeScript check, gitleaks when installed.
- `commit-msg`: Conventional Commits validation.
- `pre-push`: `make test`, `make build`, `make smoke`.
- `post-merge` and `post-checkout`: dependency/install reminders and generated metadata refresh.

## Consequences

- Hooks are transparent shell scripts and do not require another hook manager.
- Missing optional tools report clear warnings where safe.

## Alternatives Considered

- Lefthook: capable, but plain hooks are enough for v1.
