# Phase 2 Substance Postmortem

## Real Data Pass Rate

- Before:
  2/10 fixtures produced a useful first guess without manual cleanup.
- After:
  10/10 fixture tests pass.

Per fixture:

- `clean-readme.md`: pass
- `article-page.html`: pass
- `revenue-export.csv`: pass
- `sprint-transcript.txt`: pass
- `support-thread.eml`: pass
- `invoice-extracted.txt`: pass
- `privacy-policy.html`: pass
- `broken-export.json`: pass
- `huge-research-dump.txt`: pass
- `weird-encoding.txt`: pass

## Top 5 Logic Gaps Closed

1. Structure detection:
   fixed with deterministic document-kind inference.
2. Normalization:
   fixed with HTML, CSV, email, JSON, and encoding normalization at import.
3. Confidence:
   fixed with visible confidence on inferred kind and AI outputs.
4. Chunking:
   fixed with shape-aware chunk generation.
5. Error quality:
   fixed with actionable import error messages.

## Smart Behaviors That Now Work

- CSV imports detect table structure automatically.
- HTML imports strip obvious boilerplate before analysis.
- Transcript imports surface speakers and action items.
- Email thread imports de-emphasize quoted history.
- Invoice-like text surfaces IDs, dates, and total-like values.

## Determinism Check

- All 10 fixtures:
  pass

## Performance Numbers

- Fixture analysis benchmark:
  median `0.33 ms`, p95 `4.84 ms`, worst `4.84 ms`.
- Full fixture suite:
  10 fixtures analyzed and asserted in one unit-test pass.
- Built app smoke path:
  passes after the substance changes.

## What Surprised Me

- The transcript and email improvements unlocked much better Q&A quality without changing the visible workflow.
- Encoding normalization mattered more than expected because it affects both readability and stable hashing.

## Open Phase 3 Candidates

1. Real PDF text extraction instead of explicit PDF rejection.
2. Better legal-policy specialization beyond generic HTML handling.
3. Stronger table anomaly detection across wider CSV variants.
4. Larger-input chunk streaming off the main thread.
5. Session learning from user corrections.

## Honest Take

The app no longer feels like a toy on the fixture set. It still is not a local LLM, and it still has clear boundaries, but it now behaves like a serious deterministic document-understanding tool rather than a demo that only shines on curated text.
