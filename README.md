# AI Expenses

TypeScript monorepo with two Bun workspaces:

- `apps/api`: tRPC API on Bun, Drizzle ORM for PostgreSQL, and Zod validation.
- `apps/web`: React, Vite, Tailwind CSS, and tRPC with TanStack Query.

Both apps share `tsconfig.base.json` and the root `biome.json`. The web app imports the API router as a type through `@ai-expenses/api`; server code stays out of the browser bundle.

## Start development

Install [Bun](https://bun.com/docs/installation) 1.4.4 or newer and Docker with Docker Compose.

Run these commands from the repository root:

```sh
cp .env.example .env
bun install
bun run db:up
bun run dev
```

Open <http://localhost:5173>. The status panel queries the API and checks the database connection. The API listens on <http://localhost:3001>, serves tRPC at `/trpc`, and exposes a process health check at `/health`.

`bun run dev:api` and `bun run dev:web` start the apps separately. Both read settings from the root `.env`. Vite proxies `/trpc` to the API using `API_PORT` and keeps database settings out of browser code.

## Check changes

```sh
bun run check
bun run typecheck
bun run test
bun run build
```

`bun run check` checks formatting, lint rules, and imports with Biome. Use `bun run check:fix` to apply safe fixes, or `bun run format` to apply formatting only.

With the database and both apps running, verify the HTTP connection through Vite to tRPC and PostgreSQL:

```sh
bun run smoke
```

## Run the builds locally

After `bun run build`, start the API and web preview in separate terminals:

```sh
bun run --filter @ai-expenses/api start
bun run --filter @ai-expenses/web preview
```

Open <http://localhost:4173>, or run `WEB_URL=http://localhost:4173 bun run smoke` to check the builds. Vite preview is for local verification. When deploying, serve `apps/web/dist` and route `/trpc` to the running API under the same origin. The API bundle is `apps/api/dist/index.js` and runs with Bun.

## Manage the database

```sh
bun run db:up
bun run db:logs
bun run db:shell
bun run db:down
```

Docker runs PostgreSQL 18 on `127.0.0.1:5432`. Compose stores data in a named volume, which `db:down` preserves. The default credentials in `.env.example` are for local development.

If port 5432 is occupied, change `POSTGRES_PORT` and the port in `DATABASE_URL` in `.env`. Keep the database name and credentials in `DATABASE_URL` consistent with `POSTGRES_*`. PostgreSQL applies initialization credentials only when the volume is empty; changing `.env` does not update an existing database user.

## Change the database schema

Define tables in `apps/api/src/db/schema.ts` using `drizzle-orm/pg-core`. Then generate and apply migrations:

```sh
bun run db:generate
bun run db:migrate
```

Commit generated migrations under `apps/api/drizzle` alongside schema changes. The migration runner uses Drizzle's Bun SQL adapter, matching the API's database connection.

The starter checks the database through Drizzle with `SELECT 1`. The schema starts empty, so add your first table before generating a migration. Zod validates `DATABASE_URL` and `API_PORT` when the API starts.
