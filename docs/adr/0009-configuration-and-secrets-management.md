# 0009 - Configuration And Secrets Management

## Status

Accepted

## Context

The frontend must never contain secrets. Mode A needs only public build metadata.

## Decision

Use Vite public environment variables for non-secret metadata:

- `VITE_APP_VERSION`
- `VITE_GIT_COMMIT`
- `VITE_REPOSITORY_URL`
- `VITE_PAYPAL_URL`

Commit `.env.example` with placeholders. Ignore `.env*` except `.env.example`. Run gitleaks from local hooks when installed.

## Consequences

- No secrets are required to run or deploy v1.
- Build metadata can be shown in the UI and published in `version.json`.
- Contributors have a clear place to see supported configuration.

## Alternatives Considered

- Runtime config endpoint: rejected because Mode A has no backend.
- Hardcoded commit/version: rejected because release metadata should be generated during build.
