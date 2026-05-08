-- 0003_owner_as_author.sql
-- Bug fix : à la création d'un projet, ajouter automatiquement le owner comme membre role='author'.
-- Sans ce trigger, le créateur du projet n'apparaît pas dans project_members,
-- ce qui casse les RLS qui dépendent de la fonction user_in_project().

-- 1. Function : insère le owner comme author
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role, accepted_at)
  values (new.id, new.owner_id, 'author', now())
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;

-- 2. Trigger : after insert on projects
drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- 3. Backfill : ajouter les owners existants comme members 'author' s'ils ne sont pas déjà là
insert into public.project_members (project_id, user_id, role, accepted_at)
select p.id, p.owner_id, 'author', now()
from public.projects p
where not exists (
  select 1 from public.project_members pm
  where pm.project_id = p.id
    and pm.user_id = p.owner_id
)
on conflict (project_id, user_id) do nothing;
