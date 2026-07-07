-- DuoHub database schema + seed data
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id text primary key,          -- 'u1' | 'u2'
  name text not null
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

create table if not exists savings_goal (
  id int primary key,           -- single row, id = 1
  name text not null,
  target double precision not null,
  current double precision not null
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
alter table savings_goal enable row level security;

drop policy if exists "open access" on profiles;
drop policy if exists "open access" on expenses;
drop policy if exists "open access" on todos;
drop policy if exists "open access" on monthly_plans;
drop policy if exists "open access" on savings_goal;

create policy "open access" on profiles for all using (true) with check (true);
create policy "open access" on expenses for all using (true) with check (true);
create policy "open access" on todos for all using (true) with check (true);
create policy "open access" on monthly_plans for all using (true) with check (true);
create policy "open access" on savings_goal for all using (true) with check (true);

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
  alter publication supabase_realtime add table savings_goal;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Seed data (current app records)
-- ---------------------------------------------------------------------------

insert into profiles (id, name) values
  ('u1', 'Dushman'),
  ('u2', 'Hasini')
on conflict (id) do nothing;

insert into expenses (id, amount, description, category, paid_by, date) values
  (1, 1500, 'July Rent',         'rent',          'u1', '2026-07-01'),
  (2,   65, 'Dinner at Mario''s','dining',        'u2', '2026-07-02'),
  (3,  120, 'Weekly Groceries',  'groceries',     'u1', '2026-07-03'),
  (4,   45, 'Movie Tickets',     'entertainment', 'u2', '2026-07-03'),
  (5, 1500, 'June Rent',         'rent',          'u1', '2026-06-01'),
  (6,   85, 'Date Night',        'dining',        'u2', '2026-06-15')
on conflict (id) do nothing;

insert into todos (id, text, assignee, completed, due_date) values
  (1, 'Call landlord about AC',       'u1',     false, '2026-07-03'),
  (2, 'Plan weekend trip itinerary',  'shared', false, '2026-07-10'),
  (3, 'Pay electric bill',            'u2',     true,  '2026-06-28')
on conflict (id) do nothing;

insert into monthly_plans (month, income, target_savings) values
  ('July 2026', 6000, 1500),
  ('June 2026', 6000, 1000)
on conflict (month) do nothing;

insert into savings_goal (id, name, target, current) values
  (1, 'Paris Trip 2027', 3000, 850)
on conflict (id) do nothing;
