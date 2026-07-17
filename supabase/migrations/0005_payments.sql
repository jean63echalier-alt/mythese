-- Freemium gate + Stripe payments — 1 recherche + 1 problématique gratuites par projet,
-- déblocage 39€ one-shot (ce projet, 90j) ou 19€/mois (compte entier, illimité)

do $$ begin
  create type payment_type as enum ('one_shot', 'subscription');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'active', 'canceled', 'expired');
exception when duplicate_object then null; end $$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  type payment_type not null,
  status payment_status not null default 'pending',
  stripe_session_id text unique,
  stripe_subscription_id text,
  unlocked_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments(user_id);
create index if not exists payments_project_idx on public.payments(project_id);

alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select using (user_id = auth.uid());

-- Écriture réservée au service role (webhook Stripe) — pas de policy insert/update pour authenticated.

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status payment_status;

grant select on public.payments to authenticated;
