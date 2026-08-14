# Development Learner Accounts

Development credentials are controlled by `server/.env` and must never be used in production.

| Account | Username | Password variable |
| --- | --- | --- |
| Learner | `dara` | `SEED_STUDENT_PASSWORD` |
| Learner | `sophea` | `SEED_STUDENT_PASSWORD` |
| Learner | `vanna` | `SEED_STUDENT_PASSWORD` |

The sample password in `.env.example` is for local development only. Change it on any shared development server. Running `npm run seed` is non-destructive: it upserts the named learner records and does not remove unrelated data.
