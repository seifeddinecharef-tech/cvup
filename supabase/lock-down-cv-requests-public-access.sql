drop policy if exists "Allow public insert on cv_requests" on public.cv_requests;

revoke all privileges on table public.cv_requests from anon;
revoke all privileges on table public.cv_requests from authenticated;

grant select, insert, update on table public.cv_requests to service_role;
