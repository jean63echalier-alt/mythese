# Mythese

> Le coach IA qui structure ton mémoire de recherche.
> Sources peer-reviewed. Méthodo française. Jamais à ta place.

V1 livrée nuit 2026-05-07 → 08. Stack : Next.js 15 + Tailwind v4 + Supabase + Anthropic SDK + OpenAlex + Resend.

## Démarrage local

```bash
npm install
npm run dev
# → http://localhost:3000
```

Variables d'environnement : `.env.local` (déjà rempli avec les clés de prod).

## Build / typecheck

```bash
npm run typecheck   # tsc --noEmit, doit être clean
npm run build       # build Next.js, doit passer (14 routes)
npm run start       # serveur production
```

## Tests smoke (pas de framework, scripts directs)

```bash
node --env-file=.env.local scripts/smoke-openalex.mjs   # OpenAlex query test
node --env-file=.env.local scripts/smoke-anthropic.mjs  # Claude Haiku + Sonnet, JSON parsing
```

## Migrations DB

```bash
DB_PASSWORD='<supabase-db-password>' node scripts/migrate.mjs
```

Idempotentes (DROP IF EXISTS / CREATE IF NOT EXISTS partout). Si tu modifies le schéma, ajoute un `0003_*.sql` dans `supabase/migrations/` puis relance.

## Déploiement Vercel

1. Connecter le repo `jean63echalier-alt/mythese` à Vercel
2. Variables d'environnement à pousser depuis `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY` (conseil IA croisé, Plan de recherche)
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `OPENALEX_EMAIL`
   - `NEXT_PUBLIC_SITE_URL=https://mythese.com`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ONE_SHOT`
   - `STRIPE_PRICE_SUBSCRIPTION`
3. Domaines à attacher dans Vercel : `mythese.com` (apex) + `www.mythese.com`
4. DNS Hostinger :
   - `mythese.com` A → `76.76.21.21`
   - `www.mythese.com` CNAME → `cname.vercel-dns.com`
   - `mythese.fr` redirect 301 → `mythese.com`
5. Dans Supabase > Authentication > URL Configuration : ajouter `https://mythese.com/auth/callback` aux Redirect URLs

## Activer Google OAuth (étape manuelle Jean)

Pas activé par défaut. Pour activer :

1. Google Cloud Console > Créer un OAuth Client ID type "Web application"
2. Authorized redirect URIs : `https://zheqsaeieqrpxxxuzpcf.supabase.co/auth/v1/callback`
3. Copier Client ID + Secret
4. Supabase > Authentication > Providers > Google : coller les deux

Sans cette étape, le bouton "Continuer avec Google" affichera une erreur. Le magic link email fonctionne dès le déploiement (Supabase l'a activé par défaut).

## Activer Stripe (freemium gate — étape manuelle Jean)

Gate : 1 recherche Module 1 (10 sources) + 1 génération Module 2 gratuites par projet. Au-delà, mur de paiement.

1. Dashboard Stripe > Produits > créer 2 produits :
   - **Mémoire complet** — prix unique 39 € → copier le `price_id` dans `STRIPE_PRICE_ONE_SHOT`
   - **Doctorant** — prix récurrent 19 €/mois → copier le `price_id` dans `STRIPE_PRICE_SUBSCRIPTION`
2. Dashboard Stripe > Développeurs > Clés API > copier la clé secrète dans `STRIPE_SECRET_KEY`
3. Dashboard Stripe > Développeurs > Webhooks > ajouter un endpoint `https://mythese.com/api/webhooks/stripe`, événements à écouter : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → copier le secret de signature dans `STRIPE_WEBHOOK_SECRET`
4. Appliquer la migration `supabase/migrations/0005_payments.sql` (table `payments` + colonnes `profiles.stripe_customer_id` / `subscription_status`)

Sans cette étape, `/api/checkout` renverra une erreur 500 (clés Stripe manquantes) — les modules restent utilisables en gratuit (1 usage par projet) tant que le gate n'est pas testé.

## Stack technique

- Next.js 15 App Router + TypeScript strict
- Tailwind v4 (config dans `globals.css` via `@theme`)
- Supabase (Postgres + RLS + Auth)
- Anthropic SDK officiel (Sonnet 4.6 + Haiku 4.5, prompt caching activé)
- OpenAlex API (250M papers, gratuit, mailto en user-agent)
- Resend (emails transactionnels, domaine mythese.com vérifié)
- Vercel (deploy)

## Architecture

```
src/
  app/
    (marketing)/         # landing publique
      page.tsx           # hero + 3 sections + waitlist x2
      _components/
    (auth)/login/        # magic link + Google OAuth
    auth/
      callback/          # OAuth + magic link callback
      signout/
    app/                 # dashboard authentifié
      layout.tsx         # protégé via middleware, nav "Plan de recherche" / "Mes projets"
      page.tsx           # liste projets owned + memberships
      plan/              # Plan de recherche (6 étapes, par compte)
        page.tsx         # progression globale + timeline + soumission libre
        [etapeId]/       # détail étape : soumission, historique, conseil IA croisé
      projects/
        new/             # création projet
        [id]/
          layout.tsx     # header + 4 onglets
          page.tsx       # vue d'ensemble
          etat-de-lart/  # Module 1 (OpenAlex + Claude)
          problematique/ # Module 2 (8 questions + Claude)
          equipe/        # invitations
    invite/[token]/      # acceptation invitation
    api/
      plan/classifier/                           # POST contenu (texte/PDF/DOCX) -> classification étape(s)
      plan/conseil-ia/                           # POST {etape_id, texte_soumis, question} -> Claude+GPT+synthèse
      waitlist/                                  # POST waitlist
      projects/                                  # POST nouveau projet
      projects/[id]/invitations/                 # POST invite
      projects/[id]/searches/                    # POST recherche état art
      projects/[id]/problematiques/              # POST génération propositions
      problematiques/[id]/choose/                # POST choisir proposition
      invitations/[token]/accept/                # POST accepter invitation
    legal/               # mentions / cgu / contact (squelettes)
  components/ui/         # Button, Input, Textarea, Label, Card, Select, Watermark
  lib/
    anthropic.ts         # client + system prompt + cache
    openai.ts            # client GPT (conseil croisé)
    openalex.ts          # search + normalize + APA citation
    resend.ts            # client + templates emails (waitlist, invitation)
    plan.ts              # étapes, statuts, prompts classification/conseil/synthèse
    extractors/          # fichier -> texte brut (interface commune)
      index.ts           # registre + extractText()
      text.ts            # V1 — texte collé
      pdf.ts             # V1 — pdf-parse
      docx.ts            # V1 — mammoth
                          # V2 (à brancher sans réécriture) : image (OCR), audio (Whisper)
    supabase/
      client.ts          # browser
      server.ts          # server components, RLS-aware
      middleware.ts      # session refresh
    utils.ts             # cn, formatDate, formatDateRelative
  middleware.ts          # protège /app/*
supabase/
  migrations/
    0001_init.sql        # 7 tables + RLS + fonctions helpers + trigger
    0002_grants.sql      # GRANTs explicites (anon, authenticated, service_role)
    0003_owner_as_author.sql
    0004_plan_recherche.sql  # plan_etapes_template (seed 6), etudiant_progression,
                              # soumissions, conseils_ia + RLS + grants
scripts/
  migrate.mjs            # applique les migrations via pg pooler
  smoke-openalex.mjs     # test query OpenAlex
  smoke-anthropic.mjs    # test Haiku + Sonnet + JSON parsing
```

## Garde-fou produit (NON NÉGOCIABLE)

System prompt Claude (dans `src/lib/anthropic.ts`) :

1. Jamais de prose continue
2. Toujours bullets / plans / résumés télégraphiques
3. Refuser si l'user demande de la prose à coller
4. Jamais hallucination de sources (uniquement OpenAlex contexte)
5. Français académique télégraphique
6. Watermark final : "— Suggestion Mythese à reformuler dans ton style"

Watermark visible UI sur chaque card de résultat (Module 1) et chaque proposition (Module 2) via `<Watermark />`.

## Plan de recherche

Espace `/app/plan`, scopé par compte (`user_id`), 6 étapes fixes (`plan_etapes_template`) :

1. Sujet & problématique
2. Revue de littérature
3. Méthodologie
4. Collecte de données / terrain
5. Analyse & résultats
6. Rédaction finale & soutenance

- **Soumission** (texte collé ou fichier) → `/api/plan/classifier` → extraction texte brut
  → Claude Haiku classe par étape(s) + statut + justification → upsert `etudiant_progression`
  + insert `soumissions`.
- **Conseil IA croisé** (par étape) → `/api/plan/conseil-ia` → Claude (méthodologie) + GPT
  (sources/lacunes) en parallèle, puis synthèse Claude. Si une IA échoue, l'avis disponible
  est retourné avec un message explicite à la place de l'avis manquant.

### Extracteurs de contenu (`src/lib/extractors/`)

Interface commune `{ buffer, mimeType } -> { text, type }` :

| Type | Statut | Lib |
|---|---|---|
| Texte collé | ✅ V1 | direct |
| PDF | ✅ V1 | `pdf-parse` |
| Word (.docx) | ✅ V1 | `mammoth` |
| Image / scan (OCR) | 🔜 V2 | à brancher dans `src/lib/extractors/index.ts` |
| Audio (notes vocales) | 🔜 V2 | Whisper, idem |

## Roadmap nuits suivantes

- **2026-05-08** : Module 3 — relecture méthodo
- **2026-05-09** : Module 4 — biblio + exports
- **2026-05-10** : Stripe + pricing + tests

## Page wiki canonique

`/Users/macbook/Documents/WikiBrain/wiki/mythese-projet.md`
