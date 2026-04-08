# train-schedule-app

React (Vite) app: [`frontend`](frontend).

## Frontend

```bash
cd frontend
```

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`).

```bash
npm install
npm run dev
```

Use `apiUrl('/api/...')` from [`frontend/src/api/client.ts`](frontend/src/api/client.ts). With an empty `VITE_API_URL`, `/api` is proxied to `http://localhost:3000` (see `frontend/vite.config.ts`).

| Script            | Description      |
| ----------------- | ---------------- |
| `npm run dev`     | Dev server       |
| `npm run build`   | Production build |
| `npm run preview` | Preview build    |
| `npm run lint`    | ESLint           |
