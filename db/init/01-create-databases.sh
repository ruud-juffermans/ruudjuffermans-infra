#!/bin/sh
# Runs once, only when the pgdata volume is empty (Postgres entrypoint behavior).
# Creates one least-privilege LOGIN role + database per app on the shared
# instance. Each app connects as its OWN role, which OWNS only its own database
# — so a breach in one app (leaked DSN, SQL injection) cannot read or drop
# another app's data. The superuser ($POSTGRES_USER) stays for admin/backups.
#
# To add a database later (volume already populated) this file will NOT re-run —
# create the role + database by hand with psql instead.
#
# App passwords come from the container environment (see docker-compose.yml),
# populated from .env, which is never committed. The heredoc is quoted so the
# shell does not interpolate; psql substitutes :'var' with correct quoting.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" \
	--set=ruud_pw="$RUUDJUFFERMANS_DB_PASSWORD" \
	--set=habit_pw="$HABITMAXXING_DB_PASSWORD" <<-'EOSQL'
	CREATE ROLE ruudjuffermans_app LOGIN PASSWORD :'ruud_pw';
	CREATE DATABASE ruudjuffermans OWNER ruudjuffermans_app;
	-- Postgres grants CONNECT to PUBLIC by default; revoke it so ONLY the owning
	-- role (and the superuser) can even open a connection to this database.
	REVOKE CONNECT ON DATABASE ruudjuffermans FROM PUBLIC;
	GRANT CONNECT ON DATABASE ruudjuffermans TO ruudjuffermans_app;

	CREATE ROLE habitmaxxing_app LOGIN PASSWORD :'habit_pw';
	CREATE DATABASE habitmaxxing OWNER habitmaxxing_app;
	REVOKE CONNECT ON DATABASE habitmaxxing FROM PUBLIC;
	GRANT CONNECT ON DATABASE habitmaxxing TO habitmaxxing_app;
EOSQL
