# SNP Typing Roadmap

## Product direction

SNP Typing is a self-directed learner application. Admin dashboards, teacher controls, classes, assignments, school settings, and staff reports are outside the product boundary.

## Completed foundation

- Next.js App Router frontend, Express API, MongoDB persistence, and Electron packaging.
- Secure learner self-registration and login, rotating refresh tokens, session restore, and personal settings.
- Modern responsive neo-brutalist UI with learner-only navigation.
- English, Khmer, and Computer Skills paths with server-enforced sequential unlocking.
- Reusable typing engine, grapheme-aware Khmer input, virtual keyboards, and hand guidance.
- Saved results, stars, dashboard, personal progress, streaks, and universal leaderboard.
- Printable one-page A4 personal progress report.
- Practice, timed tests, four typing games, and Computer Skills exercises.

## Next: curriculum source review

- Attach and checksum the requested PDF.
- Render every page and extract text with page references.
- Visually verify Khmer Unicode against the rendered source.
- Publish only records that pass human review and curriculum quality checks.
- Validate the final Khmer NIDA shifted-key layout on target Windows keyboards.

## Next: learner experience quality

- Add first-run onboarding and clearer next-step recommendations.
- Improve accessibility testing for keyboard-only use, focus order, reduced motion, contrast, and large text.
- Add optional local reminders and learner-owned goals.
- Expand automated coverage for all games, timed sessions, and Electron token restore.

## Release readiness

- Build and sign `SNP-Typing-Setup.exe` on a controlled Windows build agent.
- Test clean install, upgrade, uninstall, offline/error behavior, and Windows IME flows.
- Add production monitoring, database backup/restore drills, and release checklists.

## Quality gates

- Khmer source content cannot leave review state without a source page and human approval.
- English and Khmer metrics must remain covered by unit tests.
- The first lesson in each protected path must be open; later lessons require a passed prerequisite.
- A learner may read and mutate only their own account preferences and results.
- Critical routes must pass production build and responsive visual checks.
