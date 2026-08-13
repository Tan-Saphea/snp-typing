# SNP Typing Final Requirement Audit

Audit date: 2026-08-09

Status legend: ✅ complete, 🟡 complete with a documented limitation, ❌ blocked or still missing.

## Core system

| Requirement | Status | Verification |
| --- | --- | --- |
| Existing MERN workspace preserved | ✅ | Next.js/React, Express/Mongoose, shared utilities, and Electron remain separated. |
| Authentication and roles | ✅ | Admin, teacher, and student login; protected routes; bcrypt; JWT access tokens; rotating refresh tokens; browser cookies; Electron token bridge. |
| MongoDB and rerunnable seed | ✅ | Slug upserts are idempotent; two consecutive seeds produced 212 active records without curriculum duplicates. |
| REST API and validation | ✅ | Auth, students, classes, lessons, results, assignments, leaderboard, reports, progress, and settings APIs use centralized errors and Zod validation. |
| Role data isolation | ✅ | Teachers are restricted to their classes for students, results, reports, assignments, password resets, and class leaderboards. |
| Electron security | ✅ | `contextIsolation`, sandboxing, disabled Node integration, narrow preload IPC, denied permissions, and window-state persistence are active. |
| Windows installer | 🟡 | NSIS is configured for `SNP-Typing-Setup.exe`; final build/sign/install verification must run on Windows. |
| Primary PDF review | ❌ | `សៀវភៅ Microsoft Word សម្រាប់កុមារអាយុ៦-១២ឆ្នាំ.pdf` is not present in the workspace, so exact pages and source challenge wording cannot be verified. |

## Student application

| Requirement | Status | Verification |
| --- | --- | --- |
| Dashboard | ✅ | Real progress, continue learning, daily challenge, recent results, weekly chart, WPM, CPM, accuracy, time, and stars. |
| English Typing | ✅ | Seven curriculum levels with progressive lessons, reviews, and challenges. |
| Khmer Typing | ✅ | Six curriculum levels with grapheme-aware lessons and reviewed/unreviewed publication states. |
| Practice | ✅ | Word, sentence, paragraph, and custom English/Khmer practice save real results. |
| Typing Test | ✅ | English/Khmer tests support 30 seconds, 1 minute, 3 minutes, and 5 minutes. |
| Typing Games | ✅ | Falling Words, Balloon Typing, Picture Typing, and Speed Challenge work in English and Khmer and save results. |
| Computer Skills | ✅ | Copy, Paste, Cut, Undo, Redo, Font, Font Size, Bold, Italic, Underline, Color, Highlight, Alignment, Bullets, Numbering, Pictures, and Shapes are simulated and scored. |
| Progress | ✅ | Curriculum completion, current levels, stars, practice time, best/average speed, best/average accuracy, tests, streak, recent activity, and weekly activity. |
| Leaderboard | ✅ | Today/week/month/all-time; English WPM, Khmer CPM, accuracy, total score, stars; school/class visibility controls. |
| Profile | ✅ | Authenticated account information and role are displayed. |
| Settings | ✅ | Account preferences persist; teacher controls enforce accuracy, live speed, games, unlocking, and leaderboard visibility. |
| Daily challenge rotation | 🟡 | A real next-lesson accuracy challenge is shown; a separately persisted seven-day challenge calendar is not implemented. |
| Audio feedback | ✅ | Synthesized key sounds work without external assets; students can enable sounds and choose style/volume. |

## Typing engine and results

| Requirement | Status | Verification |
| --- | --- | --- |
| Visual typing states | ✅ | Untyped, current, correct, and incorrect graphemes render in the target card. |
| First-key timer | ✅ | Timing begins on the first committed grapheme, not page load. |
| English metrics | ✅ | Standard WPM, CPM, accuracy, errors, score, stars, and time are calculated and persisted. |
| Khmer Unicode metrics | ✅ | NFC normalization and `Intl.Segmenter("km", { granularity: "grapheme" })` are used. |
| Khmer IME composition | ✅ | Composition text is not scored until `compositionend`. |
| Backspace and editing controls | ✅ | Completed characters cannot be mouse-edited; navigation, delete, paste, cut, and undo are constrained. |
| Virtual keyboards | ✅ | Full desktop English/Khmer layout is clickable, highlights next/pressed keys, and includes an optional hand/finger guide. |
| Khmer hardware layout validation | 🟡 | The virtual layout is functional; final Windows NiDA shifted-key validation requires the target lab keyboards. |
| Stars and passing | ✅ | 3 stars at 95%, 2 at 85%, 1 at 70%; the school minimum can raise the pass floor. |
| Unlocking and Free Practice | ✅ | Prerequisites are enforced on load and save; class free practice and school unlocking controls bypass them safely. |
| Result and progress persistence | ✅ | English, Khmer, tests, practice, games, and Computer Skills persist across logout/login. |
| Story comprehension | ✅ | Story lessons follow Type → Result → Comprehension before continuing. |

## Curriculum counts

| Curriculum | Level counts | Total | Status |
| --- | --- | --- | --- |
| English | L1 14, L2 13, L3 8, L4 15, L5 12, L6 32, L7 6 | 100 | ✅ |
| Khmer | L1 11, L2 14, L3 9, L4 7, L5 23, L6 10 | 74 | ✅ |
| Computer Skills | 20 lessons | 20 | ✅ |
| Core curriculum |  | 194 | ✅ |
| Tests, practice, and games | 2 tests, 8 practice templates, 8 games | 18 | ✅ |
| All seeded records |  | 212 | ✅ |

All required English Level 1 keys and punctuation, the complete specified easy-word list, syllable words, Shapes/School Things/Colors activity types, sentence topics, paragraph variants, and story flows are present. All specified Khmer consonant groups, progressive consonant-vowel groups, word topics, sentence topics, paragraph variants, reviews, and advanced reading records are present.

## Teacher and administration

| Requirement | Status | Verification |
| --- | --- | --- |
| Teacher Dashboard | ✅ | Uses scoped database statistics and recent results. |
| Students | ✅ | List, add, class placement, update API, and password reset are functional. |
| Classes | ✅ | List, create, update API, roster synchronization, and Free Practice Mode are functional. |
| Assignments | ✅ | Lesson, level, test, and custom practice can be assigned to a student or class. |
| Results and Reports | ✅ | Date/student/class/language/level filters, print, and CSV export use real results. |
| Lesson Manager | ✅ | Add, edit, deactivate, duplicate, reorder, move level/category, preview, publish/unpublish, source metadata, and review filters. |
| Needs-review workflow | ✅ | Review count and filters are visible; `needs_review` content cannot be published from the editor. |
| Teacher-created tests | ✅ | Test lessons can be created and published without source-code changes. |

## Test evidence

| Test | Status | Result |
| --- | --- | --- |
| Production build | ✅ | Shared, Next.js App Router, and server syntax builds pass. |
| Unit tests | ✅ | 11 shared/server tests pass; the existing client integration test is environment-skipped. |
| Lint/syntax | ✅ | Server syntax and client production compilation pass. |
| Full API smoke | ✅ | Admin/teacher/student, curriculum counts, English/Khmer metrics, tests, practice, games, CRUD, assignments, settings, reports, leaderboard, logout/login, and persistence pass. |
| Auth/CORS smoke | ✅ | Token rotation, revoked-token rejection, HttpOnly browser cookies, CORS, malformed JSON, unknown routes, logout, and health pass. |
| Live browser endpoint | ✅ | `http://127.0.0.1:3000/`, API `5011`, CSP connect source, and favicon return correctly. |
| In-app visual automation | 🟡 | The browser-control backend was unavailable; HTTP, API, build, and persistence checks were used instead. |

## Manual source review queue

Twenty-six source-dependent records are stored as `needs_review` and unpublished: English source paragraph challenges plus The Rainbow Fish, Khmer source paragraph challenges, and Khmer advanced readings. Attach the PDF to verify `sourcePage`, exact wording, Unicode integrity, and publication approval. No uncertain Khmer text was silently corrected.
