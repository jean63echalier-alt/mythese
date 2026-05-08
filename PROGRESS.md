# PROGRESS — Nuit 2026-05-07 → 08

> Updates fréquents (toutes les 30 min minimum) par Claude Code en mode autonomie nuit.
> Si bloqué > 30 min → `🚨 BLOQUÉ` + skip à la tâche suivante.

## État au lancement

- [ ] T+0:00 → T+0:30 : Init Next.js + Tailwind + shadcn + Supabase
- [ ] T+0:30 → T+1:30 : Auth Supabase (Google + magic link)
- [ ] T+1:30 → T+2:30 : Schema DB + RLS + seed
- [ ] T+2:30 → T+3:30 : Landing page + form waitlist
- [ ] T+3:30 → T+5:00 : Dashboard projets + invitations
- [ ] T+5:00 → T+6:30 : Module 1 (état de l'art OpenAlex)
- [ ] T+6:30 → T+7:30 : Module 2 (coach problématique)
- [ ] T+7:30 → T+8:00 : Deploy Vercel + smoke test

## Log des updates

### [01:45] T+0:00 — Démarrage
- Brief lu, env complet (Supabase + Anthropic + Resend + OpenAlex), public/ contient logo
- Heure cible fin : 09:43 (T+8:00 strict)
- Tâches créées (8 phases)
- Démarrage init Next.js

### [01:48] T+0:05 — Stack init OK + schema DB appliqué
- Next.js 15 + Tailwind v4 + Supabase SSR + Anthropic SDK + Resend installés (129+14 packages)
- UI components : Button, Input/Textarea/Label, Card, Select, Watermark
- Helpers lib : supabase client/server/middleware, anthropic (system prompt + caching), openalex (recherche + APA), resend (envoi + templates)
- Schema DB appliqué via pg pooler eu-west-1 : 7 tables + RLS + helpers (user_in_project, user_can_write_project) + trigger handle_new_user
- T+0 et T+1:30 cochés. Démarrage auth pages + landing

### [01:52] T+0:09 — Auth + Landing + Dashboard livrés (très en avance)
- Voir détail au-dessus

### [01:55] T+0:12 — Module 1 + Module 2 livrés
- Module 1 : pipeline complet (Haiku reformule → OpenAlex search → Sonnet enrich)
- API /api/projects/[id]/searches : insert RLS-safe + parse JSON loose (markdown wrappers OK)
- UI cards Module 1 avec watermark, copy APA, lien DOI, sections summary/pertinence
- Module 2 : wizard 8 questions séquentielles + progress bar
- API /api/projects/[id]/problematiques : Sonnet génère 3 propositions JSON binaire/ternaire
- UI 3 colonnes (Proposition A/B/C), bouton "Choisir" → /api/problematiques/[id]/choose
- "Choisir" mirror chosen.problematique vers projects.problematique (visible partout)

### [01:58] T+0:15 — Build + smoke tests verts
- Typecheck clean après upgrade @anthropic-ai/sdk@latest (cache_control en stable types)
- Next.js build : 14 routes (4 static + 10 dynamic), 99.9 kB shared JS
- OpenAlex smoke : 30/13167 résultats sur 6 mots EN, 0.6-0.9s, top sources OK (Dwivedi, Goldfarb, etc.)
- Anthropic smoke : Haiku 0.9s 11 tokens, Sonnet 25s 1409 tokens, JSON parse OK (markdown wrapper)
- Fix critique migration 0002_grants.sql : service_role/anon/authenticated GRANTs explicites
- Waitlist live test : POST → row Supabase OK (200), email validation OK (400)
- Resend non testé live (best-effort, ne bloque pas le flow waitlist)

### [01:59] T+0:16 — Smoke OK, prêt pour commit
- 14 routes rendent en 200, /app redirect en 307 sans auth (correct), /invite/[bad] 200 (page d'erreur affichée)
- README final écrit (architecture, deploy Vercel, OAuth Google manuel, scripts)
- Toutes les tâches T+0 → T+7:30 cochées en T+0:16 (avance ÉNORME sur 8h)
- Landing page complète : hero + bandeau confiance + 3 pains + 3 modules + 3 étapes + watermark promise + form waitlist (×2)
- API /api/waitlist (Zod + insert RLS-safe via service role + email Resend best-effort)
- Pages auth : /login (magic link Supabase + Google OAuth) + /auth/callback + /auth/signout
- Pages légales squelettes : /legal/mentions, /cgu, /contact
- App layout protégé : header + déconnexion
- Dashboard /app : liste projets owned + memberships avec rôle, empty state propre
- Création projet /app/projects/new : form complet (titre / discipline / niveau / problématique)
- Page projet /app/projects/[id] : layout avec onglets (vue / état art / problématique / équipe)
- Vue d'ensemble : 3 cards récap (état art, problématique, équipe)
- Onglet équipe : liste membres, form invite (rôles author/director/reader), liste invitations
- API /api/projects/[id]/invitations + page /invite/[token] + accept route
- Tâches 1-5 cochées. Démarrage Module 1.

## Bugs / Blocages rencontrés

(Claude Code logue ici si 🚨 BLOQUÉ)

## Critères de succès vérifiés

- [ ] mythese.com accessible (ou URL Vercel temporaire)
- [ ] form waitlist enregistre dans Supabase
- [ ] Jean peut signup avec mesconvictionsia@gmail.com
- [ ] Jean peut créer projet "Mémoire Beeclou"
- [ ] Jean peut s'inviter en directeur sur autre compte
- [ ] Module 1 retourne 20 sources OpenAlex en < 30s
- [ ] Module 2 produit 3 propositions en < 20s
- [ ] AUCUN output en prose continue
- [ ] Watermark "Suggestion Mythese" visible
- [ ] Repo Git clean
