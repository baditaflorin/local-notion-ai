# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live GitHub Pages URL is a first-class deliverable from the first commit. There are no GitHub Actions, so local builds must produce the publish directory.

## Decision

Publish from the `main` branch `/docs` folder at:

https://baditaflorin.github.io/local-notion-ai/

Vite builds directly into `docs/` with `base: "/local-notion-ai/"`, hashed asset filenames, `.nojekyll`, `404.html` fallback, and generated `version.json`.

Do not gitignore `docs/`. Do gitignore transient `dist/` and dependency folders.

## Consequences

- Every pushed `main` commit can update Pages without CI.
- The built frontend is committed, which makes diffs noisier but satisfies the no-actions constraint.
- Rollback is a normal git revert of the publishing commit.

## Alternatives Considered

- `gh-pages` branch: rejected because it adds branch choreography without CI.
- Root publishing: rejected because source and built assets would collide.

