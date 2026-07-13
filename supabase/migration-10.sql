-- Migration 10: color tag for notes (used for the note-card grid) and
-- drawing attachments (freehand sketches saved as images, same storage flow
-- as photo attachments).
-- Run once in the Supabase SQL Editor (after migration-9).

alter table notes add column if not exists color text not null default 'yellow';
