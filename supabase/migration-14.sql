-- Migration 14: profile avatars, "thinking of you" pings, and the shared bucket list.
-- Run once in the Supabase SQL Editor (after migration-13).

alter table profiles add column if not exists avatar_url text;

create table if not exists pings (
  id bigint primary key,        -- client-generated (Date.now())
  from_user text references profiles(id),
  to_user text references profiles(id),
  emoji text not null,
  message text,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);

alter table pings enable row level security;
drop policy if exists "open access" on pings;
create policy "open access" on pings for all using (true) with check (true);
do $$
begin
  alter publication supabase_realtime add table pings;
exception when duplicate_object then null;
end $$;

create table if not exists bucket_list (
  id bigint primary key,        -- client-generated (Date.now())
  title text not null,
  emoji text,
  note text,
  done boolean not null default false,
  done_at timestamptz,
  created_by text references profiles(id),
  created_at timestamptz not null default now()
);

alter table bucket_list enable row level security;
drop policy if exists "open access" on bucket_list;
create policy "open access" on bucket_list for all using (true) with check (true);
do $$
begin
  alter publication supabase_realtime add table bucket_list;
exception when duplicate_object then null;
end $$;
