# SNP Typing

SNP Typing is a learner-first English and Khmer typing education application for children, students, and independent practice.

The application includes learner self-registration and recovery questions, structured English and Khmer curricula, step-by-step lesson unlocking, practice, timed tests, four games, Computer Skills, personal progress, printable A4 reports, leaderboards, secure authentication, and a fully offline Electron desktop mode.

## Source curriculum status

The target source PDF, `សៀវភៅ Microsoft Word សម្រាប់កុមារអាយុ៦-១២ឆ្នាំ.pdf`, has been attached, extracted, and visually verified. All Khmer Unicode sequences, lesson lengths, and grapheme alignments have been confirmed. 100% of the 232 curriculum activities are published and approved for learner use. See [Curriculum Import](docs/CURRICULUM_IMPORT.md).

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- MongoDB 7 or newer, locally or on a reachable application server
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
| `npm run seed` | Upsert development learners, lessons, and tests |
| `npm test` | Run workspace tests |
| `npm run build` | Validate shared/server code and build the Next.js application |
| `npm run dist` | Build the Windows NSIS installer |
| `npm run dist:win` | Alias for building the Windows x64 setup wizard |
| `npm run smoke:auth -w @snp/server` | Verify API and authentication against a running server |
| `npm run smoke:learning -w @snp/server` | Verify registration, sequential lesson protection, results, Khmer scoring, and progress |

The Windows artifact is configured as `release/SNP-Typing-Setup.exe`. It uses the SNP logo, an assisted step-by-step setup wizard, per-user installation by default, desktop and Start Menu shortcuts, and a standard Windows uninstaller that removes local application data. The installed EXE uses its embedded lesson and account store—MongoDB, the API server, and internet access are not required. See [Windows setup and uninstall](docs/WINDOWS_INSTALLER.md).

Unsigned local builds may display Microsoft Defender SmartScreen. Code-signing the release on a controlled Windows build agent is recommended before broad distribution.

## Development accounts

Usernames and password environment variables are listed only in [the development account guide](server/README.development.md). Never seed these accounts into production.

## Architecture and roadmap

- [Application architecture](docs/ARCHITECTURE.md)
- [Curriculum import and Khmer review](docs/CURRICULUM_IMPORT.md)
- [Implementation roadmap](docs/ROADMAP.md)

## Curriculum totals

- English: 100 lessons across 7 levels
- Khmer: 94 lessons across 6 levels
- Computer Skills: 20 lessons
- Core curriculum: 214 lessons
- Tests, practice templates, and games: 18 activities
- All seeded records: 232

All 232 seeded records (including all 26 source-dependent lessons from `សៀវភៅ Microsoft Word សម្រាប់កុមារអាយុ៦-១២ឆ្នាំ.pdf`) are fully verified, approved, and published with `contentStatus: "verified"` / `contentStatus: "custom"`.

## Learning flow

1. Create your own learner username, password, and private recovery answer, or sign in with a development account.
2. Open English Typing, Khmer Typing, or Computer Skills. The first lesson is open.
3. The timer starts on the first committed key, not when the page opens.
4. English uses standard five-character WPM; Khmer accuracy and CPM use grapheme clusters.
5. A passing attempt is saved to MongoDB and unlocks the next lesson in that learning path. Practice, tests, and games remain open.
6. The personal A4 report can be printed or saved as PDF from the Progress page or navigation.

## Security notes

- Electron uses `contextIsolation: true`, `nodeIntegration: false`, and sandboxing.
- The preload bridge exposes only application metadata and encrypted refresh-token operations.
- Access JWTs remain in renderer memory; refresh JWTs rotate and are stored hashed in MongoDB.
- Password recovery requires the learner's private recovery answer, stores that answer as a password hash, and revokes existing sessions after a reset.
- Electron persists refresh tokens through operating-system encryption. Browser development uses an HttpOnly cookie.
- The API must be served over HTTPS outside a trusted local network.
