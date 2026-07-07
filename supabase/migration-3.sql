-- Migration 3: monthly budget limit per category
-- Run once in the Supabase SQL Editor (Dashboard -> SQL Editor -> paste -> Run)

create table if not exists category_budgets (
  category text primary key,                 -- category id, e.g. 'groceries'
  amount double precision not null default 0 -- monthly limit
);

alter table category_budgets enable row level security;
drop policy if exists "open access" on category_budgets;
create policy "open access" on category_budgets for all using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table category_budgets;
exception when duplicate_object then null;
end $$;
