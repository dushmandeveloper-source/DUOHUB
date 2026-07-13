-- Migration 16: reply-to-message support in chat.
-- Run once in the Supabase SQL Editor (after migration-15).

alter table messages add column if not exists reply_to bigint;
