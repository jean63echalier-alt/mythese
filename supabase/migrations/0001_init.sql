-- Mythese — Schema initial V1
-- Tables : profiles, projects, project_members, invitations, searches, problematiques, waitlist
-- RLS : strict, un user ne voit que ses projets ou ceux où il est membre

-- ============================================================
-- ENUMS
-- ============================================================

do $$ begin
  create type project_role as enum ('author', 'director', 'reader');
exception when duplicate_object then null; end $$;

do $$ begin
  create type academic_level as enum ('m1', 'm2', 'doctorat', 'autre');
exception when duplicate_object then null; end $$;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  level academic_level default 'autre',
  discipline text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PROJECTS
-- ============================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  discipline text,
  level academic_level default 'autre',
  problematique text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_idx on public.projects(owner_id);

alter table public.projects enable row level security;

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role project_role not null default 'reader',
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_members_user_idx on public.project_members(user_id);
create index if not exists project_members_project_idx on public.project_members(project_id);

alter table public.project_members enable row level security;

-- Helper : user has access to project (owner OR member)
create or replace function public.user_in_project(p_project_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and owner_id = p_user_id
  ) or exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = p_user_id
  );
$$;

create or replace function public.user_can_write_project(p_project_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and owner_id = p_user_id
  ) or exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = p_user_id and role in ('author','director')
  );
$$;

-- Projects RLS
drop policy if exists "projects_select_member" on public.projects;
create policy "projects_select_member" on public.projects
  for select using (
    auth.uid() = owner_id
    or public.user_in_project(id, auth.uid())
  );

drop policy if exists "projects_insert_self" on public.projects;
create policy "projects_insert_self" on public.projects
  for insert with check (auth.uid() = owner_id);

drop policy if exists "projects_update_owner" on public.projects;
create policy "projects_update_owner" on public.projects
  for update using (auth.uid() = owner_id);

drop policy if exists "projects_delete_owner" on public.projects;
create policy "projects_delete_owner" on public.projects
  for delete using (auth.uid() = owner_id);

-- Project members RLS
drop policy if exists "members_select_member" on public.project_members;
create policy "members_select_member" on public.project_members
  for select using (
    user_id = auth.uid()
    or public.user_in_project(project_id, auth.uid())
  );

drop policy if exists "members_insert_owner" on public.project_members;
create policy "members_insert_owner" on public.project_members
  for insert with check (
    exists (
      select 1 from public.projects
      where id = project_id and owner_id = auth.uid()
    )
    or user_id = auth.uid()  -- self-accept invite
  );

drop policy if exists "members_delete_owner" on public.project_members;
create policy "members_delete_owner" on public.project_members
  for delete using (
    exists (
      select 1 from public.projects
      where id = project_id and owner_id = auth.uid()
    )
  );

-- ============================================================
-- INVITATIONS
-- ============================================================

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  role project_role not null default 'reader',
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted boolean not null default false,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists invitations_project_idx on public.invitations(project_id);
create index if not exists invitations_token_idx on public.invitations(token);

alter table public.invitations enable row level security;

drop policy if exists "invitations_select_owner" on public.invitations;
create policy "invitations_select_owner" on public.invitations
  for select using (
    public.user_in_project(project_id, auth.uid())
  );

drop policy if exists "invitations_insert_owner" on public.invitations;
create policy "invitations_insert_owner" on public.invitations
  for insert with check (
    exists (
      select 1 from public.projects
      where id = project_id and owner_id = auth.uid()
    )
  );

drop policy if exists "invitations_update_owner" on public.invitations;
create policy "invitations_update_owner" on public.invitations
  for update using (
    public.user_in_project(project_id, auth.uid())
  );

-- ============================================================
-- SEARCHES (Module 1 — état de l'art)
-- ============================================================

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  keywords jsonb not null default '[]'::jsonb,
  problematique text,
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists searches_project_idx on public.searches(project_id);
create index if not exists searches_created_idx on public.searches(created_at desc);

alter table public.searches enable row level security;

drop policy if exists "searches_select_member" on public.searches;
create policy "searches_select_member" on public.searches
  for select using (public.user_in_project(project_id, auth.uid()));

drop policy if exists "searches_insert_writer" on public.searches;
create policy "searches_insert_writer" on public.searches
  for insert with check (
    public.user_can_write_project(project_id, auth.uid())
    and user_id = auth.uid()
  );

drop policy if exists "searches_delete_owner" on public.searches;
create policy "searches_delete_owner" on public.searches
  for delete using (user_id = auth.uid());

-- ============================================================
-- PROBLEMATIQUES (Module 2 — coach problématique)
-- ============================================================

create table if not exists public.problematiques (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  proposals jsonb not null default '[]'::jsonb,
  chosen text,
  created_at timestamptz not null default now()
);

create index if not exists problematiques_project_idx on public.problematiques(project_id);

alter table public.problematiques enable row level security;

drop policy if exists "problematiques_select_member" on public.problematiques;
create policy "problematiques_select_member" on public.problematiques
  for select using (public.user_in_project(project_id, auth.uid()));

drop policy if exists "problematiques_insert_writer" on public.problematiques;
create policy "problematiques_insert_writer" on public.problematiques
  for insert with check (
    public.user_can_write_project(project_id, auth.uid())
    and user_id = auth.uid()
  );

drop policy if exists "problematiques_update_owner" on public.problematiques;
create policy "problematiques_update_owner" on public.problematiques
  for update using (user_id = auth.uid());

-- ============================================================
-- WAITLIST (landing page, public insert)
-- ============================================================

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  level text,
  topic text,
  source text default 'landing',
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_created_idx on public.waitlist(created_at desc);

alter table public.waitlist enable row level security;

-- Public insert allowed (form on landing), no select for anon
drop policy if exists "waitlist_insert_public" on public.waitlist;
create policy "waitlist_insert_public" on public.waitlist
  for insert with check (true);

drop policy if exists "waitlist_select_authenticated" on public.waitlist;
create policy "waitlist_select_authenticated" on public.waitlist
  for select using (false); -- only service role can select
