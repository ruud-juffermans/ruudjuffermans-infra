# Development

This repo provides the shared infrastructure (one Postgres instance + a Caddy
reverse proxy) that the app stacks join via external Docker networks. The
committed `docker-compose.yml` is the **production** (VPS) setup: Postgres is not
published to the host and Caddy terminates TLS. See [README.md](./README.md) for
the full overview and bring-up order.

## First-time setup

All configuration lives in the root `.env`:

```bash
cp .env.example .env     # set strong values for prod; dev defaults are fine locally
```

| Variable                     | Description                                  | Default |
| ---------------------------- | -------------------------------------------- | ------- |
| `POSTGRES_USER`              | Superuser (admin + backups only)             | `postgres` |
| `POSTGRES_PASSWORD`          | Superuser password                           | `devpassword` |
| `RUUDJUFFERMANS_DB_PASSWORD` | Password for the `ruudjuffermans_app` role   | `devpassword` |
| `HABITMAXXING_DB_PASSWORD`   | Password for the `habitmaxxing_app` role     | `devpassword` |

The per-app passwords are consumed once by `db/init/01-create-databases.sh` on
first boot (empty volume) to create each app's least-privilege role + database.

## Local development

By default Postgres is **not** exposed to the host. To let apps running outside
Docker (`npm run dev`) connect at `localhost:5432`, the gitignored
`docker-compose.override.yml` publishes the port. It is auto-merged by Compose:

```yaml
# docker-compose.override.yml (local only, not used on the VPS)
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"
```

Bring up just the database:

```bash
docker compose up -d db
```

This creates the `ruudjuffermans` and `habitmaxxing` databases automatically (via
`db/init/`) on first boot. Verify both exist:

```bash
docker compose exec db psql -U postgres -c "\l"
```

Bring up the whole stack (db + Caddy proxy):

```bash
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down            # stop (data preserved in the pgdata volume)
docker compose down -v         # stop AND wipe the database volume
```

> Wiping the volume (`down -v`) re-runs `db/init/` on the next `up`, recreating
> the app roles + databases from the current `.env` passwords.

## Bring-up order

Always **infra → ruudjuffermans.nl → habitmaxxing**. The apps depend on the
`backend` / `frontend` networks and the databases created here.

## Backups

`scripts/backup.sh` runs `pg_dumpall` (all databases + roles), gzips it to
`$PG_BACKUP_DIR` (default `/var/backups/postgres`), and prunes dumps older than
`$PG_BACKUP_RETENTION_DAYS` (default 14). On the VPS, schedule it nightly via
crontab. Restore with:

```bash
gzip -dc pg-YYYYMMDD-HHMMSS.sql.gz | docker compose exec -T db psql -U postgres
```
