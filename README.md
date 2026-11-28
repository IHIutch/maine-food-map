# Maine Food Map

A curated directory of places to eat in Maine, with map and list views, place details, and filters for town, cuisine, price, and opening hours.

The app uses TanStack Start, React, Tailwind CSS, and Mapbox. A Cloudflare Worker reads restaurant data from Postgres through Drizzle ORM.

## Local development

Use Node.js 22.12 or later and the pnpm version declared in `package.json`.

```sh
pnpm install
pnpm dev
```

The development server defaults to port 3000. Set `VITE_MAPBOX_API_KEY` for maps and a direct Postgres connection in `DIRECT_DATABASE_URL` or `DATABASE_URL` for data. Local Vite development reads `.env` and `.env.local`; keep credentials out of version control. `VITE_PORT` overrides the default port.

Installation generates Cloudflare Worker types. It does not run database migrations. See [the database guide](drizzle/README.md) for connection rules and schema commands.

## Checks

```sh
pnpm knip
pnpm lint
pnpm test
pnpm build
```

Tests use a disposable in-memory PostgreSQL fixture and do not connect to the configured database.

Knip discovers TanStack entry points and Drizzle configuration through its plugins. `knip.json` also includes route modules and scripts. The Material Symbols dependency is kept explicitly because Iconify resolves it from `icon-[material-symbols--search-rounded]` classes through the Tailwind CSS plugin.

## Deployment

`pnpm deploy` deploys the Worker with the existing Wrangler configuration. Build the app first with `pnpm build`. Configure the map key at build time and the direct Postgres URL in the deployment environment.
