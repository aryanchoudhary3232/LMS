# LMS Project

## Docker setup

1. Create `BACKEND/.env` from `BACKEND/.env.example` and fill in the real secrets.
2. Set `VITE_BACKEND_URL` in `FRONTEND/.env`.
3. Build and start the stack:

```bash
docker compose up --build -d
```

4. Open the app at `http://localhost:8080`.
5. Backend API remains available at `http://localhost:3000`.

## Services

- Frontend: Vite app built into an Nginx container
- Backend: Express API running in a production Node container
- Redis: Cache/session/OTP/rate-limit backend for the API
- Elasticsearch: Full-text search engine used by course search

## Redis Deployment Notes

- Local Docker uses `REDIS_URL=redis://redis:6379` automatically.
- Production must use a managed Redis endpoint (for example `rediss://...`), not localhost.
- Recommended production variables:
  - `REDIS_ENABLED=true`
  - `REDIS_URL=<managed redis url>`
  - `REDIS_TLS_ENABLED=true` (for `rediss://` providers)
  - `REDIS_TLS_REJECT_UNAUTHORIZED=true`
  - `REDIS_CONNECT_TIMEOUT_MS=10000`
  - `REDIS_MAX_RETRIES=5`

## Elasticsearch Search

- Backend uses Elasticsearch for course search when enabled.
- If Elasticsearch is unavailable, backend automatically falls back to MongoDB search.
- Configure these variables in `BACKEND/.env` when needed:
  - `ELASTICSEARCH_ENABLED`
  - `ELASTICSEARCH_NODE`
  - `ELASTICSEARCH_USERNAME` / `ELASTICSEARCH_PASSWORD` (optional)
  - `ELASTICSEARCH_API_KEY` (optional)
  - `ELASTICSEARCH_INDEX_COURSES`

## GitHub Actions

- CI workflow is available at `.github/workflows/ci.yml`
- It runs frontend lint/build, backend syntax validation, backend unit tests with coverage reports, and Docker image build checks on every push and pull request.
- CI test reports are uploaded as workflow artifacts under `backend-test-reports`.
