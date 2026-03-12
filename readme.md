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

## GitHub Actions

- CI workflow is available at `.github/workflows/ci.yml`
- It runs frontend lint/build, backend syntax validation, and Docker image build checks on every push and pull request
