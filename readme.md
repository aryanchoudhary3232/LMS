# LMS Project

## Docker setup

1. Create `BACKEND/.env` from [BACKEND/.env.example](/c:/Users/Aryan%20Choudhary/Desktop/LMS/BACKEND/.env.example) and fill in the real secrets.
2. Build and start the stack:

```bash
docker compose up --build -d
```

3. Open the app at `http://localhost:8080`.
4. Backend API remains available at `http://localhost:3000`.

## Services

- Frontend: Vite app built into an Nginx container
- Backend: Express API running in a production Node container
