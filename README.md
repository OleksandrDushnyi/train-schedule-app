# Train Schedule App

## Stack

- `backend/` — NestJS, Prisma, PostgreSQL, Redis
- `frontend/` — React, Vite

## Demo credentials

- Admin: `admin@demo.train` / `Admin123!`
- User: `user@demo.train` / `User123!`

## Local setup

### 1. Start infrastructure

From the project root:

```bash
docker compose up -d postgres redis
```

### 2. Setup backend

```bash
cd backend
Copy-Item .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Backend:

- API: [http://localhost:3000/api](http://localhost:3000/api)
- Swagger: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### 3. Setup frontend

Open a second terminal:

```bash
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Frontend:

- App: [http://localhost:5173](http://localhost:5173)

`frontend/vite.config.ts` already proxies `/api` to `http://localhost:3000`.

## Run with Docker

From the project root:

```bash
docker compose up -d --build
```

`docker compose exec` only works while containers are running. If you used `docker compose up` without `-d` and stopped the stack with Ctrl+C, start it again with the command above, or seed without a long‑running backend:

```bash
docker compose run --rm backend npx prisma db seed
```

With the stack up in detached mode, you can also run:

```bash
docker compose exec backend npx prisma db seed
```

URLs:

- Frontend: [http://localhost:8080](http://localhost:8080)
- Backend API: [http://localhost:3000/api](http://localhost:3000/api)
- Swagger: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## Useful commands

### Backend

```bash
cd backend
npm run lint
npm run build
npm run test
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```
