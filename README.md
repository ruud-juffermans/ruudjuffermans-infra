# ruudjuffermans-infra

Shared infrastructure for the VPS: one Postgres instance and a Caddy reverse
proxy with automatic HTTPS. Each app (`ruudjuffermans.nl`, `habitmaxxing`) runs
from its own repo and joins the shared Docker networks defined here.

For the local development workflow (exposing Postgres on `localhost:5432`, env
vars, backups), see [DEV.md](./DEV.md).

## What lives here

- **Postgres 16** — one instance, separate logical databases per app
  (`ruudjuffermans`, `habitmaxxing`). Not exposed to the host; reachable only on
  the internal `backend` network at host `db:5432`. Each app connects with its
  own least-privilege role that owns only its own database — a breach in one app
  can't reach another's data (the `postgres` superuser is kept for admin only).
- **Caddy** — terminates TLS and routes subdomains to each app's client
  container (see `Caddyfile`).
- **Shared networks** — `backend` (app server → db) and `frontend`
  (app web face → proxy). The app stacks join these as `external` networks.

## First-time setup (on the VPS)

1. DNS: point `A` records `ruudjuffermans.nl` and `habit.ruudjuffermans.nl`
   (or `*.ruudjuffermans.nl`) at the VPS IP.
2. `cp .env.example .env` and set strong values for `POSTGRES_PASSWORD` and the
   two per-app passwords. Each app's `DATABASE_URL` (in its own repo) then uses
   its app role, e.g.
   `postgresql://ruudjuffermans_app:<password>@db:5432/ruudjuffermans`.
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

- `db/init/01-create-databases.sh` runs only on a fresh (empty) `pgdata`
  volume; it creates each app's role + database. To add one later, run the
  equivalent `CREATE ROLE` / `CREATE DATABASE ... OWNER` via `psql` by hand.
- Secrets (`.env`) are never committed — they live on the VPS only.
- **Backups:** `scripts/backup.sh` runs `pg_dumpall` (all databases + roles),
  gzips it to `$PG_BACKUP_DIR` (default `/var/backups/postgres`), and prunes
  dumps older than `$PG_BACKUP_RETENTION_DAYS` (default 14). Schedule it nightly,
  e.g. in the VPS crontab:
  ```
  0 3 * * * /path/to/ruudjuffermans-infra/scripts/backup.sh >> /var/log/pg-backup.log 2>&1
  ```
  For real safety, also copy the dumps off-box (object storage). Restore with:
  ```
  gzip -dc pg-YYYYMMDD-HHMMSS.sql.gz | docker compose exec -T db psql -U postgres
  ```
