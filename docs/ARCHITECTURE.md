# SNP Typing - Application Architecture

## 1. Product boundary

SNP Typing is a desktop-first school typing platform with three separately deployable parts:

1. **Electron desktop client** - installs on each Windows lab computer and hosts the React application.
2. **Express API** - runs once on a school LAN server or a secured hosted server.
3. **MongoDB database** - stores users, lessons, assignments, results, and reporting data centrally.

The Express server is intentionally not embedded in every Electron installer. A central API gives teachers one shared view of all computers, prevents credentials and database access from being distributed to students, and supports class leaderboards. A future offline synchronization layer can be added without changing the core domain models.

## 2. Monorepo architecture

The repository uses npm workspaces:

```text
snp-typing/
├── client/                         React renderer
│   ├── src/
│   │   ├── app/                    routing and providers
│   │   ├── components/             reusable UI
│   │   ├── features/               feature-oriented modules
│   │   ├── layouts/                authenticated layouts
│   │   ├── lib/                    browser-safe helpers
│   │   ├── pages/                  route pages
│   │   ├── services/               API and Electron adapters
│   │   ├── stores/                 Zustand stores
│   │   └── styles/                 global styles
│   └── tests/
├── server/
│   ├── src/
│   │   ├── config/                 environment and database
│   │   ├── controllers/            HTTP adapters
│   │   ├── middleware/             auth, validation, errors
│   │   ├── models/                 Mongoose schemas
│   │   ├── routes/                 REST route definitions
│   │   ├── seeds/                  development seed data
│   │   ├── services/               business rules
│   │   ├── utils/                  errors, tokens, async helpers
│   │   └── validators/             request validation schemas
│   └── tests/
├── electron/
│   ├── main.cjs                    application lifecycle
│   ├── preload.cjs                 narrow context bridge
│   └── services/                   window state and secure storage
├── shared/
│   └── src/                        shared constants and pure typing logic
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CURRICULUM_IMPORT.md
│   └── ROADMAP.md
├── electron-builder.yml
├── package.json
└── README.md
```

Feature folders in the final client include `auth`, `dashboard`, `lessons`, `typing`, `progress`, `tests`, `practice`, `games`, `computer-skills`, `leaderboard`, `students`, `classes`, `assignments`, `reports`, and `settings`.

## 3. Application layers

### React renderer

- React Router owns route-level authorization and layout composition.
- Zustand stores only cross-route session and UI preferences; server data uses feature hooks and the API service.
- Axios owns base URL, authorization headers, one-at-a-time token refresh, normalized network errors, and request cancellation.
- Tailwind provides design tokens and accessible responsive layouts for 1366x768 and 1920x1080.
- The renderer never imports Node or Electron modules.

### Express API

- Routes perform URL mapping and middleware composition.
- Validators reject malformed input before controllers execute.
- Controllers translate HTTP requests and service results.
- Services contain authorization-aware business rules and aggregation logic.
- Mongoose models enforce persistence constraints and indexes.
- A centralized error handler produces a stable JSON error envelope.

### Electron shell

- `contextIsolation: true`, `nodeIntegration: false`, and Chromium sandboxing are enabled.
- The preload bridge exposes only application metadata and encrypted refresh-token operations.
- Window state is persisted in Electron's `userData` directory.
- New windows and unexpected navigation are denied; approved HTTP(S) links open in the system browser.

## 4. Authentication design

Access tokens are short-lived JWTs and stay in React memory. Refresh tokens are rotated at every refresh and stored hashed in MongoDB.

In Electron, the raw refresh token is encrypted with Electron `safeStorage` (Windows DPAPI) and written under `userData`. The preload bridge exposes only `get`, `set`, and `clear` operations for this token. During browser-only development, an HttpOnly cookie provides the refresh token instead.

Authentication flow:

```text
Login -> credentials verified with bcrypt -> access JWT + refresh token
      -> access JWT kept in memory
      -> refresh token encrypted by Electron main process

API 401 -> one refresh request -> refresh record rotated -> request retried once
Logout  -> refresh record revoked -> encrypted local token cleared
```

Role checks are enforced by both protected React routes and Express authorization middleware. The API remains the authority.

## 5. MongoDB schema proposal

All mutable schemas use timestamps. User-facing records use status fields or `isActive` rather than destructive deletion. Object IDs below are Mongoose references.

### User

- `username` - unique, lowercase, indexed
- `email` - optional, unique sparse index
- `passwordHash` - excluded from normal queries
- `role` - `admin | teacher | student`
- `firstName`, `lastName`, `khmerName`
- `studentId` - optional, unique sparse index
- `gender`, `dateOfBirth`, `avatar`
- `class` - Class reference for students
- `status` - `active | inactive | suspended`
- `lastLoginAt`, `passwordChangedAt`
- `preferences` - sound, keyboard visibility/layout, font size, theme

### RefreshToken

- `user` - User reference, indexed
- `tokenHash` - SHA-256 hash, unique
- `expiresAt` - TTL indexed
- `createdByIp`, `userAgent`
- `revokedAt`, `replacedByTokenHash`

### Class

- `name`, `level`, `academicYear`
- `teacher` - User reference
- `students` - User references
- `status` - `active | archived`
- unique index on teacher, name, and academic year

### Lesson

- `title`, `slug`
- `language` - `en | km`
- `category`, `level`, `order`, `difficulty`
- `type` - `letter | word | sentence | paragraph | story | test | game | computer-skill`
- `instructions`
- `content` - typed content blocks, prompts, optional images and questions
- `minimumAccuracy`, `minimumSpeed`, `timeLimit`, `starsEnabled`
- `prerequisiteLesson` - Lesson reference
- `source` - book name, page, exercise, raw text, review status, notes
- `isActive`, `createdBy`, `updatedBy`
- unique ordering index on language, category, level, and order

Khmer source text remains immutable in `source.rawText`. A separately approved `content` value is used for teaching, so reviewers can audit every change.

### Result

- `student`, `lesson`, optional `assignment`
- `language`, `mode`
- `startedAt`, `completedAt`, `duration`
- `totalCharacters`, `correctCharacters`, `incorrectCharacters`, `errors`
- `totalGraphemes`, `correctGraphemes`, `incorrectGraphemes`
- `wpm`, `approximateWpm`, `cpm`, `accuracy`, `score`, `stars`
- `passed`, `attemptNumber`, `clientVersion`
- compound indexes for student/date, lesson/date, class reporting, and leaderboard queries

### Assignment

- `title`, `description`, `assignedBy`
- `targetType` - `student | class`
- `students` and/or `class`
- `activityType` - `lesson | test | practice`
- `lesson`, optional custom content
- `startDate`, `dueDate`
- `status` - `draft | scheduled | active | closed`

### StudentProgress

- `student`
- `lessonProgress[]` - lesson, attempts, best result, stars, completion date
- English and Khmer summaries
- total practice time, best/average WPM, best CPM, average accuracy
- total stars, tests completed, current streak, longest streak, lastActivityDate

This is a read-optimized summary updated transactionally after results. `Result` remains the audit source of truth.

### DailyActivity

- `student`, `date`, `practiceSeconds`, `lessonsCompleted`, `testsCompleted`
- `correctCharacters`, `totalCharacters`, `score`, `stars`
- unique index on student and date

### DailyChallenge

- `date`, `language`, `activityType`, `lesson` or generated content
- goal type/value, difficulty, active state

### Setting

- `scope` - `system | class | user`
- optional `class` or `user`
- passing accuracy, live WPM, games, unlocking, leaderboard, audio defaults
- unique index per scope target

### ComputerSkillExercise

- `title`, `level`, source typing content
- allowed formatting tools
- formatting requirements represented as structured operations
- typing, accuracy, formatting, and time score weights

### Supporting schemas

- `PasswordReset` - hashed one-time token, actor, user, expiry, used timestamp
- `AuditLog` - actor, action, entity, entity ID, safe change summary, IP, timestamp
- `ContentAsset` - image metadata, category, labels in English/Khmer, attribution

## 6. Complete page inventory

### Public

- Login
- Unauthorized
- Offline/API unavailable

### Student

- Home dashboard
- English level map and lesson detail
- Khmer level map and lesson detail
- Typing lesson runner and result
- Practice selector, custom practice, and practice result
- Typing test selector, runner, history, and result
- Games hub, Falling Words, Balloon Typing, Picture Typing, Speed Challenge
- Computer Skills catalog, exercise workspace, and result
- Progress overview and lesson history
- Leaderboard
- Profile and student settings

### Teacher and admin

- Teacher dashboard
- Students list, create, detail, edit, password reset
- Classes list, create, detail, edit, roster
- Lessons list, create, edit, duplicate, reorder, archive, source review
- Assignments list, create, detail, edit
- Tests list, create, edit, results
- Reports hub and six report views
- Class leaderboard
- Teacher settings

### Admin only

- User management
- System curriculum settings
- Source import/review queue
- Audit log
- System settings

## 7. Reusable component inventory

### Application UI

`AppShell`, `Sidebar`, `TopBar`, `PageHeader`, `RoleGuard`, `ErrorBoundary`, `RouteLoader`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `ToastRegion`, `Modal`, `Drawer`, `DataTable`, `FilterBar`, `Pagination`, `SearchField`, `StatCard`, `ProgressBar`, `StarRating`, `StatusBadge`, and `Avatar`.

### Forms

`FormField`, `TextInput`, `PasswordInput`, `TextArea`, `Select`, `DatePicker`, `Toggle`, `Checkbox`, `RadioGroup`, `LanguagePicker`, `ContentEditor`, `SourceReferenceEditor`, and `ValidationMessage`.

### Learning

`LevelMap`, `LevelCard`, `LessonCard`, `LessonLock`, `DailyChallengeCard`, `RecentActivity`, `AchievementBanner`, and `CompletionPanel`.

### Typing

`TypingEngine`, `TargetText`, `TypingCapture`, `TypingStats`, `TypingProgress`, `VirtualKeyboard`, `EnglishKeyboard`, `KhmerKeyboard`, `FingerGuide`, `Timer`, `ResultSummary`, `ComprehensionQuestion`, and `PicturePrompt`.

### Teacher tools

`StudentTable`, `ClassRoster`, `AssignmentBuilder`, `LessonBuilder`, `LessonPreview`, `ReorderList`, `ReportFilters`, `ReportTable`, and `ExportMenu`.

## 8. English typing engine

The engine receives a lesson definition and emits snapshots and a final result. It does not know about pages or API calls.

1. Preserve the authored display text.
2. Normalize line endings and use Unicode grapheme segmentation even for English so punctuation and emoji assets remain safe.
3. Capture input through a hidden, accessible text area rather than global key listeners.
4. Compare target and input graphemes for the current visual state: untyped, correct, incorrect, and current.
5. Record edit operations separately so corrected mistakes can still count as errors when the lesson policy requires it.
6. Calculate final correctness with sequence alignment to avoid one omitted character making every following character appear wrong.
7. Calculate WPM as `correctCharacters / 5 / elapsedMinutes`; calculate CPM from correct characters.
8. Apply star, speed, and prerequisite rules in a shared scoring service.

The virtual keyboard is derived from the next target grapheme. Shift state and optional finger guidance are presentation concerns, not scoring concerns.

## 9. Khmer Unicode typing engine

Khmer content is stored and displayed exactly as reviewed. Comparison operates on NFC-normalized copies; normalization never overwrites the source or approved lesson text.

```js
const segmenter = new Intl.Segmenter("km", { granularity: "grapheme" });
const graphemes = [...segmenter.segment(text.normalize("NFC"))].map(
  (part) => part.segment,
);
```

The input capture listens to `compositionstart`, `compositionupdate`, `compositionend`, and `input`:

- While composing, the IME buffer is displayed but is not finalized or scored.
- On `compositionend`, the committed value is segmented and compared.
- Duplicate `input` events following composition completion are ignored by value reconciliation rather than timing assumptions.
- Backspace and cursor movement remain native text-area behavior.
- Final accuracy and edit distance use grapheme arrays, never `string.length`.

Khmer CPM uses correct graphemes per minute. Approximate WPM uses the same five-grapheme convention but is labeled approximate. The source review queue flags replacement characters, isolated combining marks, suspicious invisible characters, and extraction mismatches for human approval; it never guesses corrections.

## 10. Electron and Next.js communication

Development:

```text
Next.js dev server (127.0.0.1:3000) <- loaded by -> Electron BrowserWindow
Next.js client components -> Axios -> Express API (localhost:5000/api)
Next.js client components -> window.snpDesktop -> preload -> validated IPC -> Electron main
```

Production:

```text
Electron -> packaged Next.js standalone server on an ephemeral loopback port
Electron BrowserWindow -> Next.js App Router
Next.js client components -> configured HTTPS/LAN API
Next.js client components -> narrow preload bridge -> safeStorage/window metadata only
```

The Next.js application works in a normal browser for development. It feature-detects `window.snpDesktop`; no Node fallback is bundled into the renderer. The App Router owns all frontend URLs, including dynamic lesson and game routes.

## 11. Windows packaging

`npm run build` builds shared code, the Next.js standalone renderer, and server syntax artifacts. `npm run dist` runs electron-builder with an NSIS target.

The builder configuration:

- sets product name to `SNP Typing`;
- includes the Electron runtime and unpacked Next.js standalone server output;
- creates a per-machine or assisted installer with shortcuts;
- uses the filename `SNP-Typing-Setup.exe`;
- supports future code-signing through environment variables without committing certificates;
- writes packages to `release/`.

The Express API and MongoDB are deployed separately. The installer receives the API address at client build time through `NEXT_PUBLIC_API_URL`. Production signing and a clean Windows 10/11 installation test are Phase 8 release gates.

## 12. API surface

The final API mounts:

```text
/api/health
/api/auth
/api/users
/api/students
/api/classes
/api/lessons
/api/results
/api/assignments
/api/tests
/api/progress
/api/leaderboard
/api/reports
/api/settings
/api/assets
```

Responses use `{ data, meta? }` for success and `{ error: { code, message, details? } }` for failure. Export endpoints stream CSV; Excel export remains an explicitly later capability.
