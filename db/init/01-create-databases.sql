-- Runs once, only when the pgdata volume is empty (Postgres entrypoint behavior).
-- Creates one logical database per app on the shared instance.
-- To add a database later (volume already populated), run CREATE DATABASE via psql
-- instead of editing this file — it will NOT re-run on an existing volume.

CREATE DATABASE ruudjuffermans;
CREATE DATABASE habitmaxxing;

-- Optional hardening: give each app a least-privilege role instead of the
-- superuser. Uncomment and set passwords (kept out of Git) to use.
-- CREATE ROLE ruudjuffermans_app LOGIN PASSWORD 'change-me';
-- GRANT ALL PRIVILEGES ON DATABASE ruudjuffermans TO ruudjuffermans_app;
-- CREATE ROLE habitmaxxing_app LOGIN PASSWORD 'change-me';
-- GRANT ALL PRIVILEGES ON DATABASE habitmaxxing TO habitmaxxing_app;
