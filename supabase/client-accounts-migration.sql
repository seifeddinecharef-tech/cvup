-- CVUp client accounts: Supabase Auth + reusable profile + request ownership.
-- Uses only Supabase built-in Auth/Postgres features; no paid third-party dependency is introduced.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name_latin text,
  full_name_arabic text,
  phone text,
  current_country text,
  nationality text,
  professional_field text,
  target_role text,
  tools text[] not null default '{}',
  spoken_languages jsonb not null default '[]'::jsonb,
  certifications_text text,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

alter table public.cv_requests add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists cv_requests_user_id_created_at_idx on public.cv_requests(user_id, created_at desc);

drop policy if exists "users_select_own_cv_requests" on public.cv_requests;
create policy "users_select_own_cv_requests" on public.cv_requests for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
