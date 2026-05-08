-- Grant explicit permissions to Supabase roles
-- service_role bypasses RLS but still needs table-level grants

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- anon : insert waitlist only (public form)
grant insert on public.waitlist to anon;

-- authenticated : full CRUD on user-owned tables (RLS still applies)
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_members to authenticated;
grant select, insert, update, delete on public.invitations to authenticated;
grant select, insert, update, delete on public.searches to authenticated;
grant select, insert, update, delete on public.problematiques to authenticated;
grant insert on public.waitlist to authenticated;

-- Default privileges for future tables
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
