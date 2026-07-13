-- Migration 6: category budgets become per-person (previously a single
-- shared limit per category, visible and editable by both people).
-- Run once in the Supabase SQL Editor (after migration-5).

alter table category_budgets add column if not exists owner text references profiles(id);

-- Existing budgets were all set by Hasini (u2) — keep them as hers.
update category_budgets set owner = 'u2' where owner is null;

alter table category_budgets alter column owner set not null;
alter table category_budgets drop constraint if exists category_budgets_pkey;
alter table category_budgets add primary key (category, owner);
