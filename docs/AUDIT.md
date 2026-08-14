# SNP Typing Current Audit

Audit date: 2026-08-14

## Product scope

SNP Typing is now a learner-only application. Staff navigation, role guards, teacher dashboards, classes, student management, assignments, staff reports, school settings, and lesson-management APIs have been removed. Learners can self-register; authentication saves each learner's progress, preferences, and personal A4 report data.

## Learner experience

| Area | Status | Current behavior |
| --- | --- | --- |
| Dashboard | Complete | Continue learning, challenge, totals, recent results, and weekly practice use saved data. |
| English typing | Complete | Seven levels unlock sequentially after the prerequisite lesson is passed. |
| Khmer typing | Complete | Six levels use grapheme-aware rendering and scoring. |
| Practice | Complete | Word, sentence, paragraph, and custom practice save personal results. |
| Timed tests | Complete | English and Khmer support 30 seconds, 1 minute, 3 minutes, and 5 minutes. |
| Typing games | Complete | Falling Words, Balloon Typing, Picture Typing, and Speed Challenge save results. |
| Computer Skills | Complete | Safe document-formatting simulations unlock sequentially. |
| Progress | Complete | Completion, speed, accuracy, time, stars, streak, recent activity, and weekly activity are personal. |
| A4 report | Complete | The learner can print or save a one-page identity and progress report. |
| Leaderboard | Complete | Today, week, month, and all-time rankings are universal; no class filter exists. |
| Settings | Complete | Sound, volume, virtual keyboard, hand guide, text size, and theme are learner-owned. |

## Typing correctness

| Area | Status | Verification |
| --- | --- | --- |
| Visual states | Complete | Untyped, current, correct, and incorrect graphemes render in the target text. |
| First-key timing | Complete | Time starts on the first committed grapheme. |
| English scoring | Complete | Standard WPM, CPM, accuracy, errors, score, stars, and duration are persisted. |
| Khmer scoring | Complete | NFC normalization and Khmer grapheme segmentation drive accuracy and CPM. |
| IME composition | Complete | Composition text is scored only after `compositionend`. |
| Virtual keyboards | Complete | English and Khmer NIDA layouts support next-key and hand/finger guidance. |
| Lesson access | Complete | Lists expose lock state, and direct reads plus result submissions enforce passed prerequisites. |
| Persistence | Complete | Lessons, tests, practice, games, and Computer Skills update personal progress. |

## API and data boundary

| Area | Status | Verification |
| --- | --- | --- |
| Authentication | Complete | Self-registration, bcrypt, short-lived access JWTs, rotating refresh tokens, browser cookies, and Electron encrypted storage. |
| Learner isolation | Complete | Result listing and progress always scope to the authenticated learner. |
| Curriculum reads | Complete | Authenticated learners can list and read published activities; mutation routes are absent. |
| Personal settings | Complete | `/settings/me` updates only the authenticated account. |
| Leaderboard | Complete | Rankings are derived from learner results without school or class visibility controls. |
| Removed management surface | Complete | No class, assignment, student-management, staff-report, school-setting, or staff lesson routes are mounted. |

## Curriculum inventory

| Curriculum | Count |
| --- | ---: |
| English core | 100 |
| Khmer core | 74 |
| Computer Skills | 20 |
| Core curriculum | 194 |
| Tests, practice templates, and games | 18 |
| All seeded activities | 212 |

Twenty-six source-dependent records remain unpublished with `contentStatus: "needs_review"`. The requested PDF is not present, so exact page text and ambiguous Khmer sequences have not been claimed as verified.

## Release verification

- Workspace unit tests and the Next.js production build are the required automated gate.
- Auth and learner smoke scripts cover token handling, self-registration, sequential access, saved English/Khmer results, and progress.
- Final NSIS build, code signing, installation, upgrade, and Windows Khmer IME validation still require a Windows release machine.
