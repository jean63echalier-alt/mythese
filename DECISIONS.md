# Architecture Decisions — MyThese

> Append-only. Plus récente en haut.
> Lire les 10 dernières entrées AVANT toute modification structurelle.

---

## 2026-06-14 — Plan de recherche : section globale `/app/plan`, niveau compte (pas par projet)

**Decision** : Le Plan de recherche (6 étapes, progression, soumissions, conseils IA croisés) est un nouvel espace `/app/plan` scopé par `user_id`, indépendant des `projects`. Lien ajouté dans le header (`src/app/app/layout.tsx`).

**Why** :
- Spec produit : "écran principal post-connexion" = plan de mémoire de l'étudiant, pas un sous-écran de projet
- Le modèle de données (étudiant_progression, soumissions, conseils_ia) est défini par étudiant, pas par projet — éviter une double granularité
- `/app` (liste de projets) reste inchangé pour ne pas casser les liens existants (équipe, invitations, état de l'art, problématique)

**Tradeoffs** :
- ✅ Gain : implémentation simple, pas de migration des projets existants
- ❌ Coût : un étudiant avec plusieurs projets a un seul plan de recherche global (pas un plan par mémoire)
- ⚠️ Risque : si besoin futur de multi-mémoires avec plans distincts, ajouter `project_id` nullable à `etudiant_progression`/`soumissions`

**Consequences** :
- Nouvelles tables migration `0004_plan_recherche.sql` : `plan_etapes_template`, `etudiant_progression`, `soumissions`, `conseils_ia`
- Nouvelle dépendance `openai` (conseil croisé GPT) + `pdf-parse`/`mammoth` (extracteurs V1)
- Variable d'env `OPENAI_API_KEY` requise (voir `.env.local.template`)

**Status** : `active`

---

## 2026-05-09 — Adoption du dev-stack Cockpit/OS

**Decision** : Repo passe au standard `_OS/dev-stack` (CLAUDE.md projet, .claudeignore, .claude/hot-files.txt, DECISIONS.md, settings.local.json, scripts/project-start.sh).

**Why** :
- Réduire dérive contexte sur sessions longues (V1 livrée nuit, prochaine phase = Module 3+ longue durée)
- Forcer Sonnet par défaut + Opus seulement archi → 5x throughput tokens
- Documenter décisions historiques visibles uniquement dans le code

**Tradeoffs** :
- ✅ Gain : moins de re-contextualisation par tour, diffs plus propres, archi durable
- ❌ Coût : 6 fichiers de plus à maintenir
- ⚠️ Risque : DECISIONS.md devient un cimetière si pas alimenté → règle = update au commit qui change l'archi

**Consequences** :
- `CLAUDE.md` à la racine = source unique des règles repo
- Toute décision archi désormais loguée ici
- Hot files lus avant modif structurelle

**Status** : `active`

---

## 2026-05-08 — Mutations via Route Handlers (V1), migration progressive Server Actions

**Decision** : V1 utilise Route Handlers (`src/app/api/*`) pour toutes les mutations. Migration vers Server Actions au cas par cas (pas de big bang).

**Why** :
- Sprint nuit V1 : Route Handlers plus rapides à écrire avec patterns familiers
- Server Actions Next 15 + React 19 RC = quelques rough edges encore

**Tradeoffs** :
- ✅ Gain : V1 livrée en 8h, 4 endpoints stables (waitlist, projects, problematiques, invitations)
- ❌ Coût : duplication validation Zod client/serveur, cache `revalidatePath` à plomber manuellement
- ⚠️ Risque : tentation de figer Route Handlers comme standard — non, c'est temporaire

**Consequences** :
- Pour V2+ : nouvelles mutations internes = Server Actions par défaut
- API publiques (waitlist, webhooks futurs) restent en Route Handlers
- Ajouter wrapper `safeAction` (validation Zod + auth check + rate limit) avant la migration

**Status** : `active — review T+30j (2026-06-08)`

---

## 2026-05-07 — Supabase plutôt que Prisma + Postgres direct

**Decision** : Stack data = Supabase (Auth + DB + RLS) plutôt que Prisma + Postgres self-hosted.

**Why** :
- RLS native Postgres > middleware d'authz custom
- Auth Supabase (Google + magic link) couvre 100 % du besoin sans dev
- Realtime gratuit pour features futures (collab live mémoire)
- `pg` direct disponible en backup pour scripts/migrations bruts

**Tradeoffs** :
- ✅ Gain : -3 jours dev auth, RLS-first sécurisé, Storage + Edge Functions dispo
- ❌ Coût : vendor lock partiel, migrations en SQL plain (pas de Prisma migrate)
- ⚠️ Risque : limites de connexions sur free tier — surveiller pooler

**Consequences** :
- 3 clients distincts : `client.ts` (browser), `server.ts` (RLS user), `middleware.ts`
- Service role isolé dans des modules `import 'server-only'`
- Migrations versionnées dans `supabase/migrations/NNN_description.sql`
- Helpers RLS au niveau Postgres (`user_in_project`, `user_can_write_project`) — pas de re-check TS

**Status** : `active`

---

## 2026-05-07 — Anthropic SDK avec prompt caching obligatoire

**Decision** : Tous les appels Anthropic passent par un wrapper `src/lib/anthropic.ts` avec prompt caching activé sur le system prompt.

**Why** :
- Système prompt long (consignes coach + format APA + cadrage académique) = 80 % du coût
- Caching réduit le coût de 90 % sur appels répétés
- Modèle dual : Haiku (reformulation rapide) + Sonnet (enrichissement qualitatif)

**Tradeoffs** :
- ✅ Gain : coût AI ~10× moins cher, latence réduite sur cache hit
- ❌ Coût : toute modification du system prompt invalide la cache → discipline requise
- ⚠️ Risque : silencieux si cache miss → ajouter telemetry hit ratio

**Consequences** :
- Ne JAMAIS modifier le system prompt sans benchmark cache hit avant/après
- Watermark systématique sur output AI (transparence légale)
- Parse JSON loose (markdown wrappers OK) — parser durci = casse production

**Status** : `active`

---

<!-- Append nouvelles décisions ici. Format :
## YYYY-MM-DD — Titre court

**Decision** : 1 phrase impérative.

**Why** :
- Raison 1
- Raison 2

**Tradeoffs** :
- ✅ Gain :
- ❌ Coût :
- ⚠️ Risque :

**Consequences** :
- Conséquence 1
- Conséquence 2

**Status** : `active`
-->
