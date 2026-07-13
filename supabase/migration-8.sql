-- Migration 8: per-person timezone (for the dashboard world clock) and
-- per-person dashboard card visibility preferences.
-- Run once in the Supabase SQL Editor (after migration-7).

alter table profiles add column if not exists timezone text not null default 'Asia/Colombo';
alter table profiles add column if not exists hidden_cards jsonb not null default '[]'::jsonb;

update profiles set timezone = 'Asia/Colombo' where id = 'u1' and timezone = 'Asia/Colombo';
update profiles set timezone = 'Asia/Shanghai' where id = 'u2';
