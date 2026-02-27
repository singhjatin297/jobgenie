# Zapier

Resume-to-job-matching app built with Next.js App Router, Prisma, Postgres, RapidAPI JSearch, and Groq.

## What It Does

- Uploads a PDF resume and parses it into structured JSON.
- Lets users edit resume data in a guided form.
- Fetches jobs from JSearch and ranks them against the resume.
- Shows job details and generates a grounded tailored draft.
- Saves applied jobs to Postgres.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4 + shadcn/ui style components
- Prisma + PostgreSQL
- Groq API (`resume-upload`, `tailor-resume`)
- RapidAPI JSearch (`job-search`, `job-details`)
- Optional Ollama embeddings (`rank-jobs`)

## Prerequisites

- Node.js 20+
- `pnpm` (recommended, repo includes `pnpm-lock.yaml`)
- PostgreSQL (or Docker Compose service)

## Environment Variables

Create `.env` in the project root:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
GROQ_API_KEY="your_groq_api_key"
RAPID_API_KEY="your_rapidapi_key"
# Optional (used by /api/rank-jobs for hybrid scoring)
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"
```

## Local Development

```bash
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm dev
```

Open `http://localhost:3000`.

## Docker

Development:

```bash
docker compose up --build
```

Production-style compose:

```bash
docker compose -f docker-compose.prod.yml up --build
```

## Scripts

- `pnpm dev` - start dev server
- `pnpm build` - build app
- `pnpm start` - start production server

## API Routes

- `POST /api/resume-upload` - parse uploaded resume PDF into structured data.
- `GET /api/job-search` - fetch and aggregate job pages from JSearch.
- `GET /api/job-details` - fetch detailed job data from JSearch.
- `POST /api/rank-jobs` - score jobs against candidate profile (lexical or hybrid with Ollama).
- `POST /api/tailor-resume` - generate grounded tailored draft for a selected role.
- `POST /api/apply` - persist selected application/job to Postgres.
- `GET /api/health` - lightweight health response.
- `GET /api/test-db` - test Prisma DB write/read path.
- `POST /api/scrapeJobs` - inserts a dummy job row (dev utility).

## Main User Flow

1. Upload resume on `/`.
2. Review/edit extracted resume on `/editResume`.
3. Browse ranked jobs on `/jobs`.
4. Open role details on `/jobDetails`.
5. Generate tailored draft from saved resume evidence.

## Notes

- Prisma client is generated into `app/generated/prisma`.
- `rank-jobs` falls back to lexical scoring when Ollama is unavailable.
- Keep API keys out of source control.
