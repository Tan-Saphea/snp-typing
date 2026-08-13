# Development Accounts

Development credentials are controlled by `server/.env` and must never be used in production.

| Role | Username | Password variable |
| --- | --- | --- |
| Admin | `admin` | `SEED_ADMIN_PASSWORD` |
| Teacher | `teacher` | `SEED_TEACHER_PASSWORD` |
| Student | `dara` | `SEED_STUDENT_PASSWORD` |
| Student | `sophea` | `SEED_STUDENT_PASSWORD` |
| Student | `vanna` | `SEED_STUDENT_PASSWORD` |

The sample values in `.env.example` are for local development only. Change them on any shared development server. Running `npm run seed` is non-destructive: it upserts the named development records and does not remove unrelated data.
