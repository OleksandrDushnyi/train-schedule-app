# Backend (NestJS)

## Setup

```bash
cd backend
npm install
npx prisma generate
```

Copy `.env.example` to `.env` and ensure PostgreSQL is running (see repo root `docker compose`).

```bash
npx prisma migrate dev
npm run start:dev
```

- API base: `http://localhost:3000/api`
- Health: `GET /api/health`
- Swagger: `http://localhost:3000/api/docs`

## Scripts

| Command | Description |
| -------- | ----------- |
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npx prisma migrate dev` | Create / apply migrations |
| `npx prisma generate` | Regenerate Prisma Client |
