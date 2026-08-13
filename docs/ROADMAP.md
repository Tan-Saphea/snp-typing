# SNP Typing Implementation Roadmap

## Phase 1 - Foundation and authentication

**Status: complete**

- Establish npm workspaces, shared configuration, React, Tailwind, Express, MongoDB, and Electron.
- Add secure Electron defaults, persistent window state, and encrypted refresh-token storage.
- Implement login, rotating refresh tokens, logout, session restore, protected routes, and role guards.
- Add centralized API errors, request validation, health checks, environment validation, and development seeds.
- Exit criteria: seeded users can authenticate by role in browser and Electron development modes; no Node API is exposed to React.

## Phase 2 - Dashboard, lessons, and English typing

**Status: complete**

- Build student shell, dashboard, curriculum maps, lesson API, unlocking, reusable typing engine, results, and stars.
- Add English keyboard highlighting, composition-safe Khmer foundations, saved progress, and completion UX.
- Exit criteria: Level 1 and reviewed beginner word lessons persist accurate results and unlock correctly.

## Phase 3 - Khmer typing and source import

**Status: next**

- Render and review the supplied PDF, build the import queue, and approve Khmer source records.
- Expand the working grapheme-aware Khmer engine with reviewed source vocabulary, Windows IME matrix testing, advanced key highlighting, and additional Khmer lesson levels.
- Exit criteria: normalization and composition test suites pass on representative Windows Khmer keyboards; reviewed beginner lessons are usable.

## Phase 4 - Teacher operations

- Build teacher dashboard, student and class management, lesson CRUD/duplication/reordering, assignments, and password reset auditing.
- Exit criteria: a teacher can manage only assigned classes and publish an assignment without source-code changes.

## Phase 5 - Tests, progress, and leaderboards

- Add timed English/Khmer tests, teacher-created tests, progress summaries, streaks, result history, and filtered leaderboards.
- Exit criteria: reports reconcile with immutable result records and class filters enforce authorization.

## Phase 6 - Typing games

- Add shared game scoring and implement Falling Words, Balloon Typing, Picture Typing, and Speed Challenge.
- Exit criteria: all games support English/Khmer where specified, save results, honor settings, and remain keyboard accessible.

## Phase 7 - Computer Skills

- Build a safe document simulation for formatting, clipboard concepts, pictures, and shapes.
- Add structured requirement checking and weighted scoring.
- Exit criteria: no arbitrary HTML executes and every visible toolbar action is scored or intentionally disabled by the exercise.

## Phase 8 - Reports and release

- Add report filters, print layouts, CSV exports, production monitoring, backups, and administrator settings.
- Package and sign the NSIS installer, then test upgrades and clean installs on supported Windows 10/11 lab machines.
- Exit criteria: installer output is `SNP-Typing-Setup.exe`; production API, database, accessibility, recovery, and release checklists pass.

## Cross-phase quality gates

- Unit tests cover scoring, grapheme segmentation, authorization, and state transitions.
- Integration tests cover authentication, lesson completion, assignment access, and report aggregation.
- Playwright tests cover critical student and teacher journeys.
- Accessibility checks include keyboard-only operation, focus visibility, contrast, and enlarged text.
- Khmer content cannot leave review state without a source page and human approval.
