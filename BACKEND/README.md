# Backend LMS API

Node/Express API for the LMS.

## Prerequisites

- Node.js (LTS recommended)
- npm (comes with Node.js)

## Setup

Install dependencies:

```bash
npm install
```

## Run (development)

```bash
npm run dev
```

## Environment Variables

If required, create a `.env` file in this folder and add the necessary values.

Redis-related variables:

- `REDIS_ENABLED=true`
- `REDIS_URL=redis://localhost:6379`
- `CACHE_DEFAULT_TTL=120`
- `ACCESS_TOKEN_EXPIRES_IN=15m`
- `JWT_BLACKLIST_TTL_SECONDS=86400`
- `OTP_TTL_SECONDS=600`
- `OTP_MAX_ATTEMPTS=5`
### Elasticsearch (Course Search)

Optional variables for Elasticsearch-based search:

- `ELASTICSEARCH_ENABLED` (`true` or `false`)
- `ELASTICSEARCH_NODE` (for example: `http://localhost:9200`)
- `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD` (optional)
- `ELASTICSEARCH_API_KEY` (optional alternative to username/password)
- `ELASTICSEARCH_INDEX_COURSES` (default: `lms_courses`)

If Elasticsearch is disabled or unreachable, search endpoints automatically fall back to MongoDB.

### Reindex Existing Courses

```bash
npm run reindex:course-search
```
