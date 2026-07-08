-- Migration 5: extra income entries (multiple income sources per month).
-- Run once in the Supabase SQL Editor (after migration-4).

create table if not exists incomes (
  id bigint primary key,        -- client-generated (Date.now())
  owner text not null references profiles(id),
  amount double precision not null,
  source text not null,         -- e.g. 'Freelance project', 'Bonus'
  date date not null,
  created_at timestamptz not null default now()
);

alter table incomes enable row level security;
drop policy if exists "open access" on incomes;
create policy "open access" on incomes for all using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table incomes;
exception when duplicate_object then null;
end $$;
