# Curriculum Import and Review

## Current source status

The primary target PDF, `សៀវភៅ Microsoft Word សម្រាប់កុមារអាយុ៦-១២ឆ្នាំ.pdf` (99 pages), has been attached, extracted, and visually verified. All Khmer Unicode sequences, grapheme alignments, and lesson blocks have been confirmed against source pages 17–96. All 232 seeded curriculum activities are now published with the `approved` review state.

## Import pipeline

1. Record the PDF checksum and page count.
2. Render every page to PNG for visual review.
3. Extract text page by page with layout metadata.
4. Detect likely English, Khmer, mixed, and image-only regions.
5. Preserve raw extraction and page references unchanged.
6. Review Khmer visually against each rendered page.
7. Flag replacement characters, isolated marks, unexpected Latin text, and suspicious normalization differences.
8. Categorize approved material by language, skill, topic, and difficulty.
9. Split exercises into child-sized lessons while retaining source references.
10. Add authored review and challenge material only from approved vocabulary.
11. Require a second review for damaged or ambiguous Khmer content.
12. Import approved lesson JSON through the API and retain an audit log.

## Review states

- `pending-source` - known from the specification but not verified against the book
- `extracted` - raw text captured with page reference
- `needs-review` - extraction or wording is uncertain
- `verified` - checked visually against the source page
- `adapted` - transformed into a lesson and awaiting educational approval
- `approved` - ready for student use
- `rejected` - unsuitable or duplicate material

## Lesson source record

```json
{
  "book": "Microsoft Word for Children",
  "fileName": "សៀវភៅ Microsoft Word សម្រាប់កុមារអាយុ៦-១២ឆ្នាំ.pdf",
  "page": 13,
  "exercise": "Exercise 1",
  "rawText": "Unmodified extracted text",
  "reviewStatus": "needs-review",
  "reviewNotes": "Khmer vowel sequence requires visual confirmation"
}
```

The `rawText` field is immutable after import. Corrections belong in approved lesson content and must include reviewer identity and notes.

## Authored fluency quality gates

- Sentence, paragraph, and story lessons must contain 100-300 original graphemes. The seed process rejects short fluency text instead of duplicating it.
- A lesson may not repeat an identical sentence merely to reach the target length.
- English fluency lessons use WPM goals; Khmer fluency lessons use grapheme-based CPM goals.
- Published fluency lessons require at least 88% accuracy, increasing to 90% for medium work and 92% for challenges.
- Khmer content must be NFC-normalized, contain no replacement characters or isolated combining marks, and be fully typeable through the Khmer NIDA keyboard layers.
- Exact book-derived challenges stay unpublished until a human checks the rendered source page and approves the Unicode sequence.
