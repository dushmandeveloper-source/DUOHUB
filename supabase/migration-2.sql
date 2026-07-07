-- Migration 2: per-user savings goals + per-user currency
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> paste -> Run)

-- 1. Each person has their own display currency
alter table profiles add column if not exists currency text not null default 'USD';

update profiles set currency = 'LKR' where id = 'u1' and currency = 'USD';
update profiles set currency = 'CNY' where id = 'u2' and currency = 'USD';

-- 2. Separate savings goal per person (replaces the single shared goal)
create table if not exists savings_goals (
  owner text primary key references profiles(id),
  name text not null,
  target double precision not null default 0,
  current double precision not null default 0
);

alter table savings_goals enable row level security;
drop policy if exists "open access" on savings_goals;
create policy "open access" on savings_goals for all using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table savings_goals;
exception when duplicate_object then null;
end $$;

-- Carry the old shared goal over to person 1, start person 2 fresh
insert into savings_goals (owner, name, target, current)
select 'u1', name, target, current from savings_goal where id = 1
on conflict (owner) do nothing;

insert into savings_goals (owner, name, target, current) values
  ('u2', 'Set your savings goal', 0, 0)
on conflict (owner) do nothing;

drop table if exists savings_goal;
