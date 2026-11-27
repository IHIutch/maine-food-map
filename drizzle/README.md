# Database schema and migrations

The application uses Drizzle ORM and Drizzle Kit `1.0.0-rc.6` with the `pg` driver. The runtime schema and v1 relations live in `src/db/`. Connections are created inside `withDb` and closed when the operation finishes, rather than shared between Worker requests.

`DIRECT_DATABASE_URL` takes precedence over `DATABASE_URL`. Both the runtime and Drizzle Kit require a direct `postgres://` or `postgresql://` connection. The legacy Accelerate URL remains available to older branches but is not used by this client.

## Existing database baseline

`20261127155059_existing_schema` was created by read-only introspection of the four application tables in the public schema. It preserves the existing columns, defaults, indexes, keys, and the `public_id` column that was absent from the previous Prisma contract. The snapshot is the starting point for future migration generation.

Drizzle Kit intentionally commented out the baseline SQL because those tables already exist. This PR does not execute migrations or create migration metadata in the database. In particular, `pull --init`, `push`, and `migrate` were not run. Builds and installation do not run database migrations or require contract generation.

For an existing database, first verify that its schema matches this baseline. A later, explicit `drizzle-kit migrate` records the commented baseline without recreating its tables, then applies any subsequent migrations. For a new empty database, the baseline's creation SQL must first be reviewed and enabled. Do not use the commented baseline to provision an empty database as-is.

## Commands

- `pnpm test` runs environment and connection-URL regression tests, plus relation, null, and timestamp checks against a disposable in-memory PostgreSQL fixture. It does not connect to the configured database.
- `pnpm db:verify` runs read-only list, detail, nearby, missing-place, and sitemap checks against the configured database.
- `pnpm db:check` checks migration history consistency.
- `pnpm db:generate` generates migration files from changes to `src/db/schema.ts`. Review the generated SQL before applying it.

The configuration scopes introspection and schema management to the four application tables in `public`. Other tables and schemas are outside this migration's scope. For later introspection, use `pnpm exec drizzle-kit pull --config drizzle.config.ts` without `--init`; it writes generated files locally and does not mark migrations as applied.
