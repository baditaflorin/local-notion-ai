# Phase 2 Substance Real-Data Audit

## Summary

The v1 app used one generic text pipeline for every imported file. HTML, CSV, email threads, transcripts, invoices, legal text, and weird encodings all degraded into plain text. The result was often not a crash, but something worse: apparently valid output with weak understanding and no confidence signal.

The fixture set below spans clean, mildly messy, genuinely messy, broken, adversarial, and edge-case inputs.

## Fixtures

### 1. `clean-readme.md`

- What v1 did:
  Imported as plain text and produced a passable generic summary.
- What it should have done:
  Recognize Markdown structure, strip syntax noise, and prioritize headings plus bullets.
- Failure type:
  Partial and obvious.
- Manual work:
  Minor cleanup of Markdown artifacts.

### 2. `article-page.html`

- What v1 did:
  Imported raw HTML, including navigation, cookies, and non-content tags.
- What it should have done:
  Extract article text and ignore boilerplate.
- Failure type:
  Wrong-but-confident.
- Manual work:
  Remove tags and page chrome before asking questions.

### 3. `revenue-export.csv`

- What v1 did:
  Treated CSV like prose.
- What it should have done:
  Detect table shape, row count, and headers automatically.
- Failure type:
  Wrong-but-confident.
- Manual work:
  Explain the table structure the app should already infer.

### 4. `sprint-transcript.txt`

- What v1 did:
  Flattened the transcript into generic paragraphs.
- What it should have done:
  Detect speaker turns, timestamps, blockers, and actions.
- Failure type:
  Partial.
- Manual work:
  Ask separate speaker and action-item questions.

### 5. `support-thread.eml`

- What v1 did:
  Mixed latest message, headers, and quoted thread history with equal weight.
- What it should have done:
  Prioritize the newest message and down-weight quoted history.
- Failure type:
  Wrong-but-confident.
- Manual work:
  Remove older replies and signatures mentally or by editing.

### 6. `invoice-extracted.txt`

- What v1 did:
  Treated invoice fields as ordinary prose.
- What it should have done:
  Detect invoice shape, total-like amounts, date, and invoice ID.
- Failure type:
  Partial.
- Manual work:
  Spot the financial fields manually.

### 7. `privacy-policy.html`

- What v1 did:
  Treated policy text as generic content and did not emphasize retention or rights.
- What it should have done:
  Surface obligations, retention windows, and user rights.
- Failure type:
  Partial by omission.
- Manual work:
  Ask pointed legal questions to get useful output.

### 8. `broken-export.json`

- What v1 did:
  Failed with a generic invalid-export message.
- What it should have done:
  Tell the user the JSON is invalid or truncated and suggest a next step.
- Failure type:
  Obvious but vague.
- Manual work:
  Guess whether the file was corrupted or unsupported.

### 9. `huge-research-dump.txt`

- What v1 did:
  Summarized repeated paragraphs without treating action lines as especially important.
- What it should have done:
  Keep blockers and action items visible, even in repetitive long notes.
- Failure type:
  Partial.
- Manual work:
  Hunt for action lines in long text.

### 10. `weird-encoding.txt`

- What v1 did:
  Imported literal spacing and punctuation artifacts without telling the user anything changed.
- What it should have done:
  Normalize typography and whitespace, then disclose that normalization happened.
- Failure type:
  Silent or wrong-but-confident.
- Manual work:
  Notice encoding oddities alone.

## Top 5 Logic Gaps

1. No structure inference for imported documents.
2. No normalization policy for HTML, CSV, quoted email, Markdown noise, or encoding artifacts.
3. No confidence model for import, summarization, rewrite, or Q&A output.
4. No domain-aware chunking for tables, transcripts, or threads.
5. No actionable error taxonomy at import boundaries.

## Top 3 Intuition Failures

1. Importing HTML or CSV appeared to work, but the app never admitted it had interpreted them badly.
2. Broken exports were rejected without telling the user whether the file was corrupt, truncated, or simply unsupported.
3. The app answered low-confidence questions with the same tone as high-confidence ones.

## Top 3 Feels-Stupid Moments

1. User has to tell the app a CSV is a table.
2. User has to tell the app a transcript contains speaker turns and action items.
3. User has to mentally strip quoted history from an email thread.

## Smart Means

- Import should auto-detect the document shape before the user asks anything.
- Normalization should happen by default and be visible when it matters.
- Summaries and Q&A should adapt to the document shape instead of pretending every file is generic prose.
- Every inference should surface confidence and reasoning.
- Every exported bundle should carry enough provenance to reproduce the analysis context.

## Before / After Pass Rate

- Before Phase 2 substance:
  2/10 fixtures had a clearly useful first guess without manual cleanup.
- After Phase 2 substance:
  10/10 fixture tests pass, with deterministic analysis and explicit confidence.
