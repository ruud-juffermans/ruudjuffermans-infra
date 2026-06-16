#!/usr/bin/env bash
# Logical backup of the shared Postgres instance: every database + global roles,
# captured with pg_dumpall, gzipped and timestamped. Designed to run from cron
# on the VPS (see README "Backups"). Run it from anywhere — it resolves the repo
# root itself so the compose context is correct.
#
# Restore (full instance) with:
#   gzip -dc pg-YYYYMMDD-HHMMSS.sql.gz | docker compose exec -T db psql -U postgres
set -euo pipefail

# scripts/ lives one level below the repo root; cd there so `docker compose`
# picks up this stack's compose file regardless of cron's working directory.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

# Need POSTGRES_USER (the superuser) to dump globals + every database.
set -a; . ./.env; set +a

BACKUP_DIR="${PG_BACKUP_DIR:-/var/backups/postgres}"
RETENTION_DAYS="${PG_BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/pg-${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# -T disables TTY allocation, required under cron. pipefail (set above) makes the
# script exit non-zero if pg_dumpall fails even though gzip succeeds.
docker compose exec -T db pg_dumpall -U "$POSTGRES_USER" | gzip > "$OUT"

# Guard against a "successful" but empty dump silently masking a broken backup.
if [ ! -s "$OUT" ] || [ "$(gzip -dc "$OUT" | head -c1 | wc -c)" -eq 0 ]; then
	echo "ERROR: backup $OUT is empty — dump failed" >&2
	rm -f "$OUT"
	exit 1
fi

# Prune dumps older than the retention window.
find "$BACKUP_DIR" -name 'pg-*.sql.gz' -type f -mtime +"$RETENTION_DAYS" -delete

echo "Backup written: $OUT ($(du -h "$OUT" | cut -f1))"
