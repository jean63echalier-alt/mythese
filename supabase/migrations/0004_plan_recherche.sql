-- Plan de recherche — 6 étapes, progression étudiant, soumissions, conseils IA croisés

-- ============================================================
-- ENUMS
-- ============================================================

do $$ begin
  create type plan_statut as enum ('a_demarrer', 'en_cours', 'a_approfondir', 'valide');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contenu_type as enum ('texte', 'pdf', 'docx', 'image', 'audio');
exception when duplicate_object then null; end $$;

-- ============================================================
-- PLAN_ETAPES_TEMPLATE (seed fixe, lecture publique authentifiée)
-- ============================================================

create table if not exists public.plan_etapes_template (
  id integer primary key,
  ordre integer not null,
  titre text not null,
  description text not null
);

alter table public.plan_etapes_template enable row level security;

drop policy if exists "plan_etapes_template_select_all" on public.plan_etapes_template;
create policy "plan_etapes_template_select_all" on public.plan_etapes_template
  for select using (true);

insert into public.plan_etapes_template (id, ordre, titre, description) values
  (1, 1, 'Sujet & problématique', 'Définir le sujet, le périmètre et la question de recherche.'),
  (2, 2, 'Revue de littérature', 'Identifier et synthétiser les travaux existants sur le sujet.'),
  (3, 3, 'Méthodologie', 'Choisir et justifier l''approche méthodologique de la recherche.'),
  (4, 4, 'Collecte de données / terrain', 'Mener les entretiens, enquêtes ou observations prévues.'),
  (5, 5, 'Analyse & résultats', 'Analyser les données collectées et formuler les résultats.'),
  (6, 6, 'Rédaction finale & soutenance', 'Rédiger le mémoire final et préparer la soutenance.')
on conflict (id) do update set ordre = excluded.ordre, titre = excluded.titre, description = excluded.description;

-- ============================================================
-- ETUDIANT_PROGRESSION
-- ============================================================

create table if not exists public.etudiant_progression (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  etape_id integer not null references public.plan_etapes_template(id),
  statut plan_statut not null default 'a_demarrer',
  derniere_maj timestamptz not null default now(),
  resume_ia text,
  unique (user_id, etape_id)
);

create index if not exists etudiant_progression_user_idx on public.etudiant_progression(user_id);

alter table public.etudiant_progression enable row level security;

drop policy if exists "etudiant_progression_select_own" on public.etudiant_progression;
create policy "etudiant_progression_select_own" on public.etudiant_progression
  for select using (user_id = auth.uid());

drop policy if exists "etudiant_progression_insert_own" on public.etudiant_progression;
create policy "etudiant_progression_insert_own" on public.etudiant_progression
  for insert with check (user_id = auth.uid());

drop policy if exists "etudiant_progression_update_own" on public.etudiant_progression;
create policy "etudiant_progression_update_own" on public.etudiant_progression
  for update using (user_id = auth.uid());

-- ============================================================
-- SOUMISSIONS
-- ============================================================

create table if not exists public.soumissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  etape_id integer references public.plan_etapes_template(id),
  type_contenu contenu_type not null default 'texte',
  contenu_extrait text not null,
  date timestamptz not null default now()
);

create index if not exists soumissions_user_idx on public.soumissions(user_id);
create index if not exists soumissions_etape_idx on public.soumissions(etape_id);
create index if not exists soumissions_date_idx on public.soumissions(date desc);

alter table public.soumissions enable row level security;

drop policy if exists "soumissions_select_own" on public.soumissions;
create policy "soumissions_select_own" on public.soumissions
  for select using (user_id = auth.uid());

drop policy if exists "soumissions_insert_own" on public.soumissions;
create policy "soumissions_insert_own" on public.soumissions
  for insert with check (user_id = auth.uid());

drop policy if exists "soumissions_update_own" on public.soumissions;
create policy "soumissions_update_own" on public.soumissions
  for update using (user_id = auth.uid());

-- ============================================================
-- CONSEILS_IA
-- ============================================================

create table if not exists public.conseils_ia (
  id uuid primary key default gen_random_uuid(),
  soumission_id uuid not null references public.soumissions(id) on delete cascade,
  avis_claude text,
  avis_gpt text,
  synthese text,
  date timestamptz not null default now()
);

create index if not exists conseils_ia_soumission_idx on public.conseils_ia(soumission_id);

alter table public.conseils_ia enable row level security;

drop policy if exists "conseils_ia_select_own" on public.conseils_ia;
create policy "conseils_ia_select_own" on public.conseils_ia
  for select using (
    exists (
      select 1 from public.soumissions s
      where s.id = soumission_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "conseils_ia_insert_own" on public.conseils_ia;
create policy "conseils_ia_insert_own" on public.conseils_ia
  for insert with check (
    exists (
      select 1 from public.soumissions s
      where s.id = soumission_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- GRANTS (authenticated)
-- ============================================================

grant select on public.plan_etapes_template to authenticated;
grant select, insert, update on public.etudiant_progression to authenticated;
grant select, insert, update on public.soumissions to authenticated;
grant select, insert on public.conseils_ia to authenticated;
