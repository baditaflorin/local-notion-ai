# Phase 2 Substance Plan

Ranked by user impact on the real-data fixtures.

1. Auto-detect document shape at import.
2. Normalize HTML into readable article text.
3. Normalize CSV into deterministic row-oriented text.
4. Detect transcripts, speakers, timestamps, blockers, and action lines.
5. Down-weight quoted email history and preserve the latest request.
6. Detect invoice-like fields such as totals, dates, and IDs.
7. Normalize encoding artifacts and disclose that normalization happened.
8. Add a confidence model for inferred kind and AI outputs.
9. Make summaries shape-aware instead of one-size-fits-all.
10. Make Q&A use deterministic chunks rather than raw paragraphs only.
11. Add field inference for dates, prices, URLs, emails, IDs, speakers, and timestamps.
12. Add domain-aware summary hints and explanations.
13. Add actionable import errors with what, why, and next step.
14. Add stable document IDs derived from content.
15. Add export provenance with app version, commit, and digest.
16. Add a debug surface for internal signals and chunk counts.
17. Add a real-data fixture suite covering 10 messy inputs.
18. Add deterministic analysis checks for each fixture.
19. Enumerate intentional states and exits.
20. Add cancel support for multi-file import.
21. Reanalyze legacy bundles on import and load.
22. Preserve search quality by indexing normalized text.

Implemented in Phase 2:

- All 22 items above.
