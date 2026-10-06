create extension if not exists pgcrypto;

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  type text not null default 'quiz' check (type in ('quiz', 'guess_image', 'debug_code', 'fast_code', 'find_dsa')),
  topic text not null default '',
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'active', 'ended')),
  default_time_seconds integer not null default 30 check (default_time_seconds between 0 and 900),
  questions jsonb not null default '[]'::jsonb,
  join_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  nickname text not null check (char_length(trim(nickname)) between 1 and 80),
  score integer not null default 0,
  correct_count integer not null default 0,
  total_questions integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index participants_quiz_score_idx on public.participants (quiz_id, score desc);
create index quizzes_status_updated_idx on public.quizzes (status, updated_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger quizzes_set_updated_at before update on public.quizzes
for each row execute procedure public.set_updated_at();

alter table public.quizzes enable row level security;
alter table public.participants enable row level security;

create policy "Hosts manage their activities" on public.quizzes
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Hosts manage activity participants" on public.participants
  for all to authenticated using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = auth.uid())
  );

-- Public play, score submission, and leaderboard reads go through Edge Functions,
-- which use SUPABASE_SERVICE_ROLE_KEY and return only the safe fields.
insert into storage.buckets (id, name, public) values ('activity-files', 'activity-files', false)
on conflict (id) do nothing;
create policy "Hosts upload imports" on storage.objects for insert to authenticated
  with check (bucket_id = 'activity-files');
