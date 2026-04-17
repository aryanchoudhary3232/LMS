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
- `REDIS_URL=redis://localhost:6379` (local) or `rediss://<user>:<password>@<host>:<port>` (production)
- `REDIS_TLS_ENABLED=false` for local Redis, `true` for managed Redis providers that require TLS
- `REDIS_TLS_REJECT_UNAUTHORIZED=true` (set to `false` only if your provider explicitly requires it)
- `REDIS_CONNECT_TIMEOUT_MS=10000`
- `REDIS_MAX_RETRIES=5` to cap reconnect attempts before falling back to in-memory behavior
- `REDIS_ERROR_LOG_THROTTLE_MS=30000` to avoid noisy repeated Redis error logs
- `CACHE_DEFAULT_TTL=120`
- `ACCESS_TOKEN_EXPIRES_IN=15m`
- `JWT_BLACKLIST_TTL_SECONDS=86400`
- `OTP_TTL_SECONDS=600`
- `OTP_MAX_ATTEMPTS=5`
- `REQUEST_LOG_STDOUT=false` (set to `true` on Render to mirror request logs, including full URLs, to platform logs)

### Redis Production Notes

- Do not use `redis://localhost:6379` on Render or any cloud host.
- Use your managed Redis connection string in `REDIS_URL`.
- Keep `REDIS_ENABLED=true` only when a valid cloud Redis endpoint is configured.

### Metrics and Deployed URL Tracking

- The backend exposes Prometheus metrics at `/metrics`.
- Route metrics are normalized in Prometheus labels (safe for dashboards).
- Full raw URLs should be tracked through logs, not Prometheus labels.
- For Render deployments, set `REQUEST_LOG_STDOUT=true` so request logs are visible in Render logs.

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
