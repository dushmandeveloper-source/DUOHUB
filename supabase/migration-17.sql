-- Migration 17: Web Push subscriptions — chat notifications arrive even when
-- the app is fully closed. Run once in the Supabase SQL Editor (after migration-16).

create table if not exists push_subscriptions (
  id bigint generated always as identity primary key,
  user_id text not null references profiles(id),
  endpoint text not null unique,   -- push-service URL; one row per browser/device
  p256dh text not null,            -- encryption keys from PushSubscription.toJSON()
  auth text not null,
  user_agent text,                 -- which of a person's devices this row belongs to
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
drop policy if exists "open access" on push_subscriptions;
create policy "open access" on push_subscriptions for all using (true) with check (true);
-- Deliberately NOT added to the supabase_realtime publication: no client ever
-- subscribes to this table; only the send-message-push Edge Function reads it.
