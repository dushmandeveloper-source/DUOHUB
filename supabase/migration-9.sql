-- Migration 9: Notes feature (rich text + image attachments).
-- Run once in the Supabase SQL Editor (after migration-8).

create table if not exists notes (
  id bigint primary key,          -- client-generated (Date.now())
  title text not null default '',
  content text not null default '', -- HTML from the Tiptap editor
  owner text not null,            -- 'u1' | 'u2' | 'shared'
  images jsonb not null default '[]'::jsonb, -- array of Supabase Storage public URLs
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notes enable row level security;
drop policy if exists "open access" on notes;
create policy "open access" on notes for all using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table notes;
exception when duplicate_object then null;
end $$;

-- Storage bucket for note images. Public bucket keeps reads simple (no signed
-- URLs needed) — fine for a private couple app with no public sign-up.
insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', true)
on conflict (id) do nothing;

drop policy if exists "public read note-images" on storage.objects;
create policy "public read note-images" on storage.objects
  for select using (bucket_id = 'note-images');

drop policy if exists "public upload note-images" on storage.objects;
create policy "public upload note-images" on storage.objects
  for insert with check (bucket_id = 'note-images');

drop policy if exists "public delete note-images" on storage.objects;
create policy "public delete note-images" on storage.objects
  for delete using (bucket_id = 'note-images');
