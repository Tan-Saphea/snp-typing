---
name: curriculum_import
description: "Instructions for managing and executing Phase 3 of the roadmap: Curriculum Import and Khmer Review. Includes text extraction, rendering, verification, and database upsert."
---

# Curriculum Import and Khmer Review Skill

This skill provides step-by-step guidance on how to process source PDFs, extract texts, handle the Khmer grapheme checking process, transition lessons through review states, and import/seed curriculum items.

## Background Context
The primary source book for the typing curriculum is `សៀវភៅ Microsoft Word សម្រាប់កុមារអាយុ៦-១២ឆ្នាំ.pdf`. Since Phase 3 is underway, processing this document and validating the Khmer Unicode sequences visually is critical to ensure high-quality and correct typing exercises.

## Pipeline & Process

### 1. Document Preparation
* Ensure the target PDF `សៀវភៅ Microsoft Word សម្រាប់កុមារអាយុ៦-១២ឆ្នាំ.pdf` is located at the project root or in a `source/` folder.
* Record the PDF checksum and page count for tracking and logs.

### 2. Render & Extract
* Render all PDF pages to high-resolution PNGs to support visual side-by-side checks.
* Use OCR/PDF extraction to capture the raw text, along with layout metadata.
* Separate segments by language (English, Khmer, or mixed).

### 3. Verification & Grapheme Alignment
* **IMPORTANT**: Khmer text contains complex grapheme clusters. Accuracy checking and CPM (characters per minute) must be calculated on grapheme clusters.
* Use `Intl.Segmenter` with `{ granularity: 'grapheme' }` to parse and align Khmer.
* Look out for common Khmer Unicode composition errors:
  * Incorrect ordering of vowels/subcons (e.g. subcon before vowel or vice versa).
  * Duplicate or redundant subcons.
  * Isolated diacritics.

### 4. Review States
Use the following review states in the curriculum data:
* `pending-source`: Known from curriculum plan but not verified against the source book.
* `extracted`: Raw text captured with page references.
* `needs-review`: Text sequences or Khmer spelling contains ambiguities.
* `verified`: Checked visually and approved against the source page rendering.
* `adapted`: Transformed into a structured typing lesson, pending educational flow approval.
* `approved`: Educational checks pass, lesson ready for school use.
* `rejected`: Unsuitable, duplicated, or corrupted material.

### 5. Lesson Source Record Schema
When saving or updating lesson records:
* Keep a reference to the source page, book filename, and original raw text.
* A sample source record schema:
  ```json
  {
    "book": "Microsoft Word for Children",
    "fileName": "សៀវភៅ Microsoft Word សម្រាប់កុមារអាយុ៦-១២ឆ្នាំ.pdf",
    "page": 13,
    "exercise": "Exercise 1",
    "rawText": "Raw extracted Khmer/English text...",
    "reviewStatus": "needs-review",
    "reviewNotes": "Khmer vowel sequence requires visual confirmation"
  }
  ```
* Seed imported lessons using the server API to maintain audit logs.
