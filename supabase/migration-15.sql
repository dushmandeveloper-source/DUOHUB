-- Migration 15: WhatsApp-style chat between the two of you.
-- Run once in the Supabase SQL Editor (after migration-14).

create table if not exists messages (
  id bigint primary key,        -- client-generated (Date.now())
  sender text references profiles(id),
  kind text not null default 'text',   -- 'text' | 'image' | 'video' | 'sticker'
  body text,                    -- message text, or sticker emoji for kind='sticker'
  media_url text,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;
drop policy if exists "open access" on messages;
create policy "open access" on messages for all using (true) with check (true);
do $$
begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null;
end $$;
