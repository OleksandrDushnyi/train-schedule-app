# Backend (NestJS)

## Setup

```bash
cd backend
npm install
npx prisma generate
```

Copy `.env.example` to `.env`, set **`JWT_SECRET`** (long random string). Start PostgreSQL (repo root `docker compose up -d`).

```bash
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

- API base: `http://localhost:3000/api`
- Health: `GET /api/health`
- Swagger: `http://localhost:3000/api/docs`

## Auth (access JWT + refresh in DB)

Register / login / refresh return **`{ accessToken, refreshToken }` only**. The refresh value is opaque; only **SHA-256** is stored. Use **access** as `Authorization: Bearer …`; use **refresh** with `POST /api/auth/refresh` or `POST /api/auth/logout`.

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/refresh` | Body: `{ refreshToken }` |
| POST | `/api/auth/logout` | Body: `{ refreshToken }` (revokes that session) |
| GET | `/api/auth/me` | Bearer access JWT |
| GET | `/api/admin/ping` | Bearer access JWT, role **ADMIN** |

Swagger **Authorize** uses the **access** token only.

### Demo users (after `prisma db seed`)

| Email | Password | Role |
|-------|----------|------|
| `admin@demo.train` | `Admin123!` (or `SEED_ADMIN_PASSWORD`) | ADMIN |
| `user@demo.train` | `User123!` (or `SEED_USER_PASSWORD`) | USER |

## Scripts

| Command | Description |
| -------- | ----------- |
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npx prisma migrate dev` | Create / apply migrations |
| `npx prisma generate` | Regenerate Prisma Client |
| `npx prisma db seed` | Seed demo users |
