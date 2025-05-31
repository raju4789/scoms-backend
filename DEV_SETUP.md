# SCOMS Backend Development Environment Setup

This guide explains how to set up and run the SCOMS backend in development mode with automatic database schema synchronization.

## Prerequisites
- Docker & Docker Compose
- Node.js (v18+ recommended)
- npm

## 1. Environment Variables

Create a `.env` file in the project root with the following content:

```
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=scoms

# Node environment
NODE_ENV=development
```

> **Note:** The `DB_HOST` should match the service name in `docker-compose.yml`.

## 2. Start Database & pgAdmin

Run:

```sh
docker-compose up -d
```

- PostgreSQL will be available at `localhost:5432`.
- pgAdmin will be available at [http://localhost:5050](http://localhost:5050) (login: admin@admin.com / admin).
- The database server will be auto-registered in pgAdmin.

## 3. Install Dependencies

```sh
npm install
```

## 4. Run the Backend in Development

```sh
npm run dev
```

- The backend will auto-create tables in the database (TypeORM `synchronize: true` for non-production).
- API will be available at [http://localhost:3000](http://localhost:3000)

## 5. Running Tests

```sh
npm test
```

## 6. Stopping Services

```sh
docker-compose down
```

---

# Production Deployment

In production, **never use TypeORM's `synchronize: true`**. Instead, use migrations to manage your database schema.

## 1. Set Environment Variables

In your production environment, set:

```
NODE_ENV=production
```

This ensures `synchronize` is disabled and migrations are required.

## 2. Generate Migrations (when your entities change)

Run this locally whenever you change your models/entities:

```sh
npx typeorm migration:generate src/migrations/InitSchema -d src/config/data-source.ts
```

- This creates a migration file in `src/migrations/`.
- Commit this migration file to your repository.

## 3. Run Migrations in Production

On your production server, after deploying new code, run:

```sh
npx typeorm migration:run -d src/config/data-source.ts
```

- This applies all pending migrations to your production database.

## 4. Start the Backend

```sh
npm run start
```

---

# Development vs Production: How the App Runs

| Environment   | How to Run         | NODE_ENV      | synchronize | Migrations Required | Notes                        |
|---------------|--------------------|---------------|-------------|---------------------|------------------------------|
| Development   | npm run dev        | development   | true        | No                  | Auto schema sync             |
| Production    | Docker/Compose     | production    | false       | Yes                 | Use migrations for schema    |

**Development:**
- Run locally with `npm run dev` and `NODE_ENV=development` (or unset).
- TypeORM will use `synchronize: true` to auto-create/update tables.
- Fast feedback, easy schema changes.

**Production (Docker):**
- Run in Docker with `NODE_ENV=production`.
- TypeORM will use `synchronize: false` (no auto schema changes).
- You must run migrations (e.g., with `npx typeorm migration:run`) as part of your deployment/startup process.

**Example Docker Compose service for production:**

```yaml
  backend:
    build: .
    environment:
      - NODE_ENV=production
      # ...other env vars
    command: >
      sh -c "npx typeorm migration:run -d src/config/data-source.ts && npm run start"
    depends_on:
      - postgres
```

This ensures migrations are always run before the app starts in production.

---

**Summary:**
- Use `synchronize: true` only for development/testing.
- Use migrations for all schema changes in production.
- Never set `synchronize: true` in production.
