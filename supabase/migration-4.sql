-- Migration 4: monthly plans become per-person (income and savings target
-- are individual now that expenses and balances are shown per person).
-- Run once in the Supabase SQL Editor.

alter table monthly_plans add column if not exists owner text not null default 'u1';

do $$
begin
  alter table monthly_plans
    add constraint monthly_plans_owner_fkey foreign key (owner) references profiles(id);
exception when duplicate_object then null;
end $$;

alter table monthly_plans drop constraint if exists monthly_plans_pkey;
alter table monthly_plans add primary key (month, owner);
