-- Reconcile CVUp client-account grants and RLS after earlier public-lockdown migrations.
-- Safe to run more than once.

alter table public.profiles enable row level security;
alter table public.cv_requests enable row level security;

revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.cv_requests from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.cv_requests to authenticated;

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.cv_requests to service_role;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "users_select_own_cv_requests" on public.cv_requests;
create policy "users_select_own_cv_requests"
on public.cv_requests for select
using ((select auth.uid()) = user_id);

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
