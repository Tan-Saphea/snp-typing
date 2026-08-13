# SNP Typing

SNP Typing is a desktop-first English and Khmer typing education system for children, students, teachers, and school computer labs.

The application now includes the student learning system, complete structured English and Khmer curriculum records, practice, timed tests, four games, Computer Skills, progress, leaderboards, teacher management, reports, school settings, secure authentication, and Electron packaging configuration.

## Source curriculum status

The requested PDF was not available in the initial workspace, so it has **not** been analyzed or imported. No Khmer extraction was guessed or corrected. See [Curriculum Import](docs/CURRICULUM_IMPORT.md) for the required review process before source-derived lessons are published.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- MongoDB 7 or newer, locally or on a reachable school server
- Windows 10/11 for final installer verification

## Local setup

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run seed
npm run dev
```

Change all JWT and seed password values in `server/.env`. Keep production secrets outside the repository.

`npm run dev` starts the API, Next.js renderer, and Electron desktop shell. The Next.js application runs at `http://127.0.0.1:3000` and can be started separately with `npm run dev:client`; the API can be run with `npm run dev:server`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run API, renderer, and Electron |
| `npm run seed` | Upsert development users, class, lessons, and tests |
| `npm test` | Run workspace tests |
| `npm run build` | Validate shared/server code and build the Next.js application |
| `npm run dist` | Build the Windows NSIS installer |
| `npm run smoke:auth -w @snp/server` | Verify API and authentication against a running server |
| `npm run smoke:learning -w @snp/server` | Verify lessons, results, unlocking, Khmer scoring, and progress |
| `npm run smoke:full -w @snp/server` | Verify all roles, curriculum, activities, management, settings, reports, and persistence |

The Windows artifact is configured as `release/SNP-Typing-Setup.exe`. Building and signing the release on a controlled Windows build agent is the recommended production path.

## Development accounts

Usernames and password environment variables are listed only in [the development account guide](server/README.development.md). Never seed these accounts into production.

## Architecture and roadmap

- [Application architecture](docs/ARCHITECTURE.md)
- [Curriculum import and Khmer review](docs/CURRICULUM_IMPORT.md)
- [Implementation roadmap](docs/ROADMAP.md)

## Curriculum totals

- English: 100 lessons across 7 levels
- Khmer: 74 lessons across 6 levels
- Computer Skills: 20 lessons
- Core curriculum: 194 lessons
- Tests, practice templates, and games: 18 activities
- All seeded records: 212

Twenty-six source-dependent records remain unpublished with `contentStatus: "needs_review"` until the PDF is attached and checked.

## Learning flow

1. Sign in with a seeded student account.
2. Open English Typing or Khmer Typing and select the first unlocked lesson.
3. The timer starts on the first committed key, not when the page opens.
4. English uses standard five-character WPM; Khmer accuracy and CPM use grapheme clusters.
5. A completed attempt is saved to MongoDB, updates dashboard progress, awards stars, and unlocks the next lesson when the passing rules are met.

## Security notes

- Electron uses `contextIsolation: true`, `nodeIntegration: false`, and sandboxing.
- The preload bridge exposes only application metadata and encrypted refresh-token operations.
- Access JWTs remain in renderer memory; refresh JWTs rotate and are stored hashed in MongoDB.
- Electron persists refresh tokens through operating-system encryption. Browser development uses an HttpOnly cookie.
- The API must be served over HTTPS outside a trusted school LAN.
