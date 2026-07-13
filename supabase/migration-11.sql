-- Migration 11: drawing attachment column for notes (stores the public
-- Storage URL of a freehand-drawing PNG, same bucket as photo attachments).
-- Run once in the Supabase SQL Editor (after migration-10).

alter table notes add column if not exists drawing text;
