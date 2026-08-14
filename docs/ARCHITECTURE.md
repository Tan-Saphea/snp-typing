# SNP Typing - Current Architecture

## Product boundary

SNP Typing is a learner-first English and Khmer typing application. It intentionally has no admin, teacher, classroom, assignment, or staff reporting workspace. Learners create their own accounts, progress through curriculum lessons in prerequisite order, and own only their personal results, progress, printable report, settings, and leaderboard identity.

The system has three parts:

1. **Next.js client** - App Router pages rendered in the browser and hosted inside Electron for desktop releases.
2. **Express API** - authentication, lessons, results, progress, preferences, and leaderboard endpoints.
3. **MongoDB** - learner accounts, refresh tokens, curriculum lessons, and immutable attempt results.

## Monorepo

```text
snp-typing/
├── client/
│   └── src/
│       ├── app/              Next.js App Router pages and protected layout
│       ├── components/       reusable UI and navigation adapters
│       ├── features/typing/  typing engine UI, keyboard, sound, and results
│       ├── layouts/          learner application shell
│       ├── screens/          feature screens
│       ├── services/         API adapters
│       ├── stores/           in-memory session state
│       └── styles/           Tailwind and neo-brutalist design system
├── server/
│   ├── src/
│   │   ├── controllers/      HTTP adapters
│   │   ├── middleware/       authentication, validation, and errors
│   │   ├── models/           User, RefreshToken, Lesson, and Result
│   │   ├── routes/           learner REST endpoints
│   │   ├── seeds/            learner accounts and curriculum
│   │   └── services/         progress, scoring, and lesson projections
│   └── test/
├── electron/                 secure desktop shell and encrypted token storage
└── shared/                   Unicode segmentation and typing calculations
```

## Client routes

- `/login` and `/register`
- `/` learner dashboard
- `/english` and `/english/level/[level]`
- `/khmer` and `/khmer/level/[level]`
- `/lessons/[lessonId]`
- `/practice`
- `/typing-test`
- `/games` and `/games/[game]/[lessonId]`
- `/computer-skills` and `/computer-skills/[lessonId]`
- `/progress`
- `/report` personal printable A4 report
- `/leaderboard`
- `/settings`

The protected layout restores the current session, then renders one learner navigation model. No role guard or staff route group exists.

## API surface

All feature routes except registration, login, and token refresh require an access token.

- `/api/auth` - registration, login, refresh, current account, and logout
- `/api/lessons` - list published activities with lock state, or fetch an unlocked activity
- `/api/results` - save or list the signed-in learner's attempts
- `/api/progress/me` - personal learning summaries
- `/api/leaderboard` - universal learner rankings
- `/api/settings/me` - personal accessibility and typing preferences

There are no student-management, class, assignment, staff-report, school-setting, or lesson-management APIs. The A4 report is a client-side rendering of the authenticated learner's `/api/progress/me` data.

## Authentication

Access JWTs are short lived and stay in renderer memory. Refresh tokens rotate and are stored hashed in MongoDB. Electron encrypts the raw refresh token through `safeStorage`; browser development uses an HttpOnly cookie.

```text
Register or login -> bcrypt hashing/verification -> access JWT + rotating refresh token
API 401 -> one refresh attempt -> retry the original request once
Logout -> revoke refresh record -> clear encrypted local token
```

Authentication answers only whether an active learner account may use the app. The current product has no authorization roles.

## Persistence models

### User

- username, optional email, password hash
- first name, last name, Khmer name, optional learner ID
- gender, avatar, active status
- sound, keyboard, font-size, and theme preferences

### Lesson

- language, category, level, order, difficulty, and activity type
- instructions and typed content blocks
- accuracy, speed, timing, and star targets
- curriculum source and human-review metadata
- active and publication state

Prerequisite metadata defines the enforced curriculum sequence. Lesson lists include `isLocked` and `unlockRequirement`; direct lesson reads and result submissions reject locked lessons with `LESSON_LOCKED`. A passing result opens the next lesson. Practice, tests, and games use independent tracks and remain open.

### Result

- learner and lesson references
- lesson, practice, test, or game mode
- start/completion times and duration
- character and grapheme counts
- WPM, CPM, accuracy, errors, score, stars, and pass state

Results are the source of truth for dashboard, progress, streak, and leaderboard calculations.

### RefreshToken

- learner reference and token hash
- expiry, revocation, replacement token hash, IP, and user agent

## Typing and Khmer correctness

- Timing starts with the first committed grapheme.
- English uses standard five-character WPM.
- Khmer uses NFC normalization and `Intl.Segmenter` grapheme clusters for accuracy and CPM.
- IME composition is committed only on `compositionend`.
- The virtual keyboard supports English and Khmer NIDA guidance.
- Published attempts save to MongoDB and update personal progress immediately.

## Security boundary

- Electron uses `contextIsolation: true`, `nodeIntegration: false`, and sandboxing.
- The preload bridge exposes only app metadata and encrypted refresh-token operations.
- Rendered content cannot import Node or Electron modules.
- Express applies Helmet, CORS, rate limiting, request validation, and a stable error envelope.
- Production API traffic must use HTTPS outside a trusted local network.
