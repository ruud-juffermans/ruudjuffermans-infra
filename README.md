# ruudjuffermans-infra

Shared infrastructure for the VPS: one Postgres instance. Each app
(`ruudjuffermans.nl`, `habitmaxxing`) runs from its own repo and joins the
shared `backend` network defined here. HTTPS and public routing are handled by
Dokploy's built-in Traefik proxy, not this stack.

## What lives here

- **Postgres 16** — one instance, separate logical databases per app
  (`ruudjuffermans`, `habitmaxxing`). Not exposed to the host; reachable only on
  the internal `backend` network at host `db:5432`. Each app connects with its
  own least-privilege role that owns only its own database — a breach in one app
  can't reach another's data (the `postgres` superuser is kept for admin only).
- **Shared network** — `backend` (app server → db). The app stacks join this as
  an `external` network. Public traffic reaches the apps over Dokploy's
  `dokploy-network` instead (set on the app services, terminated by Traefik).
- **Central admin** (`admin/`) — a single operator console (`admin-server` +
  `admin-client`) that manages both apps. It has no database of its own: one
  password (`ADMIN_PASSWORD`) gates a signed-cookie session, and it performs all
  actions by calling each app's admin API over `dokploy-network`, authenticating
  with a shared `ADMIN_SERVICE_TOKEN`. Safe to stop when you're not using it.

## Central admin

The admin app reads/writes both sites through their admin APIs — it never touches
the databases directly, so the least-privilege DB roles are untouched.

- **habitmaxxing**: wraps its existing `/api/admin/users*` (suspend, verify,
  reset password, revoke sessions, delete).
- **ruudjuffermans.nl**: a new `/api/v1/admin/*` API (contact submissions,
  newsletter, page-view analytics).

Both apps gate those routes behind `X-Service-Token` == `ADMIN_SERVICE_TOKEN` and
**fail closed** when it's unset.

### Setup

1. Set in this repo's `.env`: `ADMIN_PASSWORD`, `ADMIN_COOKIE_SECRET`, and
   `ADMIN_SERVICE_TOKEN` (`openssl rand -hex 32` for the latter two).
2. Put the **same** `ADMIN_SERVICE_TOKEN` in `ruudjuffermans.nl/.env` and
   `habitmaxxing/.env`, then redeploy those two apps so they pick it up.
3. Confirm `HABITMAXXING_API_URL` / `RUUDJUFFERMANS_API_URL` match each app's
   server container name on `dokploy-network` (defaults assume
   `habitmaxxing-server` / `ruudjuffermans-server`; override if Dokploy names
   them differently).
4. In Dokploy, route a domain (e.g. `panel.ruudjuffermans.nl`) to `admin-client`
   `/` :3000 and `admin-server` `/api` :4000.

### Local dev

```
docker compose -f docker-compose.yml -f docker-compose.admin-dev.yml up admin-server admin-client
```
Opens the client on http://localhost:3000 (API proxied to the admin server).
Set the upstream URLs in `.env` to wherever the two apps run locally.

## First-time setup (on the VPS)

1. DNS: point `A` records `ruudjuffermans.nl` and `habit.ruudjuffermans.nl`
   (or `*.ruudjuffermans.nl`) at the VPS IP.
2. `cp .env.example .env` and set strong values for `POSTGRES_PASSWORD` and the
   two per-app passwords. Each app's `DATABASE_URL` (in its own repo) then uses
   its app role, e.g.
   `postgresql://ruudjuffermans_app:<password>@db:5432/ruudjuffermans`.
3. Bring this stack up **first** (creates the `backend` network + databases):
   ```
   docker compose up -d
   ```
4. Verify: `docker compose exec db psql -U "$POSTGRES_USER" -l` shows both
   `ruudjuffermans` and `habitmaxxing`.
5. Then deploy the apps from their own repos. In Dokploy, add a domain per
   public service (terminated by Traefik over `dokploy-network`):
   - `ruudjuffermans.nl` (+ `www`) → client `/` :3000, server `/api` :4000
   - `habit.ruudjuffermans.nl` → client `/` :80, server `/api` :3001

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
