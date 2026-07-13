-- Migration 7: todos get a 3-state status ('pending' | 'waiting' | 'done'),
-- replacing the plain completed checkbox in the UI. The `completed` column
-- is kept (not dropped) for backward compatibility — it is now derived from
-- status (true only when status = 'done').
-- Run once in the Supabase SQL Editor (after migration-6).

alter table todos add column if not exists status text not null default 'pending';

update todos set status = 'done' where completed = true;
