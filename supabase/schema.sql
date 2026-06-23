-- Tandem schema. Run this once in Supabase: SQL Editor -> New query -> paste -> Run.

-- 1) The single key/value table everything syncs through.
create table if not exists public.entries (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- 2) Enable Row Level Security, then allow the anon key full access.
--    NOTE: this makes the table readable/writable by anyone holding the anon
--    key (i.e. the two of you using the app). That's fine for a private,
--    two-person app. If you ever want hard per-user privacy for things like
--    progress photos, add Supabase Auth + stricter policies later.
alter table public.entries enable row level security;

drop policy if exists "tandem anon all" on public.entries;
create policy "tandem anon all"
  on public.entries
  for all
  to anon
  using (true)
  with check (true);

-- 3) Realtime: broadcast row changes so each phone updates live.
alter publication supabase_realtime add table public.entries;
