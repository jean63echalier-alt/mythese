-- 0004_module3_reviews.sql
-- Module 3 — relecture méthodologique (methodological review)
-- Stores reviews of research methodology

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reviews_project_idx on public.reviews(project_id);
create index if not exists reviews_created_idx on public.reviews(created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_member" on public.reviews;
create policy "reviews_select_member" on public.reviews
  for select using (public.user_in_project(project_id, auth.uid()));

drop policy if exists "reviews_insert_writer" on public.reviews;
create policy "reviews_insert_writer" on public.reviews
  for insert with check (
    public.user_can_write_project(project_id, auth.uid())
    and user_id = auth.uid()
  );

drop policy if exists "reviews_delete_owner" on public.reviews;
create policy "reviews_delete_owner" on public.reviews
  for delete using (user_id = auth.uid());
