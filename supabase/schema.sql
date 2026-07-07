-- DuoHub database schema + seed data
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id text primary key,          -- 'u1' | 'u2'
  name text not null,
  currency text not null default 'USD'
);

create table if not exists expenses (
  id bigint primary key,        -- client-generated (Date.now())
  amount double precision not null,
  description text not null,
  category text not null,
  paid_by text references profiles(id),
  date date not null,
  created_at timestamptz not null default now()
);

create table if not exists todos (
  id bigint primary key,        -- client-generated (Date.now())
  text text not null,
  assignee text not null,       -- 'u1' | 'u2' | 'shared'
  completed boolean not null default false,
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists monthly_plans (
  month text primary key,       -- e.g. 'July 2026'
  income double precision not null default 0,
  target_savings double precision not null default 0
);

create table if not exists savings_goals (
  owner text primary key references profiles(id),  -- one goal per person
  name text not null,
  target double precision not null default 0,
  current double precision not null default 0
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Open to the anon key for now (private couple app). When auth is added,
-- replace these with per-user policies.
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table expenses enable row level security;
alter table todos enable row level security;
alter table monthly_plans enable row level security;
alter table savings_goals enable row level security;

drop policy if exists "open access" on profiles;
drop policy if exists "open access" on expenses;
drop policy if exists "open access" on todos;
drop policy if exists "open access" on monthly_plans;
drop policy if exists "open access" on savings_goals;

create policy "open access" on profiles for all using (true) with check (true);
create policy "open access" on expenses for all using (true) with check (true);
create policy "open access" on todos for all using (true) with check (true);
create policy "open access" on monthly_plans for all using (true) with check (true);
create policy "open access" on savings_goals for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Realtime (instant sync between devices)
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table profiles;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table expenses;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table todos;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table monthly_plans;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table savings_goals;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Required base rows (no dummy data — all records are created from the app)
-- ---------------------------------------------------------------------------

insert into profiles (id, name, currency) values
  ('u1', 'Dushman', 'LKR'),
  ('u2', 'Hasini', 'CNY')
on conflict (id) do nothing;

insert into savings_goals (owner, name, target, current) values
  ('u1', 'Set your savings goal', 0, 0),
  ('u2', 'Set your savings goal', 0, 0)
on conflict (owner) do nothing;
