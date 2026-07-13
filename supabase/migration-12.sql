-- Migration 12: image attachment column for todos (reuses the existing
-- `note-images` Storage bucket from migration-9 — same app, same access
-- pattern, no need for a separate bucket).
-- Run once in the Supabase SQL Editor (after migration-11).

alter table todos add column if not exists images jsonb not null default '[]'::jsonb;
