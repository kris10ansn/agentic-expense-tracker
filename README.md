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

Open <http://localhost:5173> for the mobile expense workspace. It uses the selected Floating panel dock in the Inset workspace, with a single Recent expenses heading and bottom navigation. Manual entry stays inside the dock. Desktop keeps a sidebar. The original AI screen is preserved at `/playground`.

Pending expenses appear only on Home, above saved entries. They use the selected Input receipt design while waiting for AI and stay separate from saved data. The Expenses page lists saved expenses only, grouped by day with a daily total. Dates without expenses have no header. The history study compares day dividers, collapsible months, and month tabs.

Three visual studies remain. Use their arrows or the left and right arrow keys to compare variations:

| Study                                                                                      | Variants                                   |
| ------------------------------------------------------------------------------------------ | ------------------------------------------ |
| [Pending image receipts](http://localhost:5173/prototypes/pending-expense?variant=receipt) | `receipt`, `preview`, `attachments`        |
| [Recording animations](http://localhost:5173/prototypes/recording?variant=pulse-wave)      | `pulse-wave`, `glass-lens`, `glass-ripple` |

The receipt study compares one photo, two photos, and a photo with a note using local sample receipt images. No files are uploaded. The recording study combines a breathing pulse with a waveform, and compares two new glass treatments. Hold with a pointer, Space, or Enter to preview the animation. Reduced motion is supported.

Capture controls remain visual prototypes. Text grows from a single line, and you can choose a collection, but recording, camera, gallery, and text submission do not access devices or create expenses. Manual entry opens the existing mock expense form. Pending entries do not change automatically. Settings is empty.

Comparison controls appear only in development, on study routes. Use their mobile Studies menu or desktop links to navigate. Draft text and mock edits survive variant switches. Navigating between studies or refreshing resets the demo. Previous dock, manual-entry, and pending-row alternatives remain in branch history.

The demo uses mock data and supports creating, viewing, editing, and deleting expenses and collections. Each expense belongs to a collection. Deleting a collection also deletes its expenses after confirmation. Changes reset when you refresh.

The demo runs with `bun run dev:web` alone. The original AI input and connection-status screen is at <http://localhost:5173/playground> and requires the API. The API listens on <http://localhost:3001>, serves tRPC at `/trpc`, and exposes a process health check at `/health`.

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
