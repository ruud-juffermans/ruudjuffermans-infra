# ruudjuffermans-infra

Shared infrastructure for the VPS: one Postgres instance and a Caddy reverse
proxy with automatic HTTPS. Each app (`ruudjuffermans.nl`, `habitmaxxing`) runs
from its own repo and joins the shared Docker networks defined here.

## What lives here

- **Postgres 16** — one instance, separate logical databases per app
  (`ruudjuffermans`, `habitmaxxing`). Not exposed to the host; reachable only on
  the internal `backend` network at host `db:5432`.
- **Caddy** — terminates TLS and routes subdomains to each app's client
  container (see `Caddyfile`).
- **Shared networks** — `backend` (app server → db) and `frontend`
  (app web face → proxy). The app stacks join these as `external` networks.

## First-time setup (on the VPS)

1. DNS: point `A` records `ruudjuffermans.nl` and `habit.ruudjuffermans.nl`
   (or `*.ruudjuffermans.nl`) at the VPS IP.
2. `cp .env.example .env` and set a strong `POSTGRES_PASSWORD`.
3. Bring this stack up **first** (creates the networks + databases):
   ```
   docker compose up -d
   ```
4. Verify: `docker compose exec db psql -U "$POSTGRES_USER" -l` shows both
   `ruudjuffermans` and `habitmaxxing`.
5. Then deploy the apps from their own repos (`docker compose up -d --build`).

## Bring-up order

Always: **infra → ruudjuffermans.nl → habitmaxxing**. The apps depend on the
networks and databases created by this stack.

## Notes

- `db/init/01-create-databases.sql` runs only on a fresh (empty) `pgdata`
  volume. To add a database later, use `psql`, not the init script.
- Secrets (`.env`) are never committed — they live on the VPS only.
- Backups: schedule a `pg_dump` cron against the `db` container.
