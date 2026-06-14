# CLAUDE.md — MyThese

> Coach IA mémoire de recherche. V1 livrée 7→8 mai 2026.
> Source unique des règles repo. Étend le CLAUDE.md global (Cockpit/OS).

---

## 0. Mode de réponse

- **Français** par défaut, code en anglais.
- **Pas de chain-of-thought visible.** Réponse directe.
- **Format pour tâches code** : `1. Cause · 2. Changement · 3. Diff · 4. Tests`.
- **Diff unifié** uniquement, jamais le fichier entier sauf demande.
- **Modifications minimales.** Pas de cleanup hors scope.
- **Si info manquante** : 3 bullets puis hypothèse la plus sûre.

## 1. Stack

- **Framework** : Next.js 15 (App Router) · React 19 RC · TypeScript strict
- **Style** : Tailwind v4 beta · class-variance-authority · tailwind-merge
- **UI** : composants maison dans `src/components/ui/` (pas shadcn officiel — proches mais wrappers internes)
- **Data** : **Supabase** (ssr + supabase-js) · `pg` pour scripts/migrations bruts
- **Auth** : Supabase Auth (Google OAuth + magic link)
- **AI** : Anthropic SDK (Haiku reformulation, Sonnet enrichissement, prompt caching activé)
- **External APIs** : OpenAlex (recherche académique), Resend (email)
- **Validation** : Zod aux frontières
- **Deploy** : Vercel

## 2. TypeScript — strict

- `strict: true`. **Jamais** `any` — `unknown` + narrow.
- **Jamais** `as Type` à l'aveugle. Préférer Zod ou type guards.
- Inference > annotation sur retours évidents.
- Branded types pour IDs (`ProjectId`, `UserId`).

## 3. Architecture — règles non négociables

- **Server Components par défaut.** `'use client'` seulement si interactivité réelle.
- **Mutations actuelles passent par Route Handlers** (`src/app/api/*`). Migration progressive vers **Server Actions** au cas par cas — voir `DECISIONS.md` avant.
- **Validation Zod** systématique sur tout body API.
- **Supabase queries** dans `src/lib/supabase/` ou `src/app/.../actions.ts` — jamais dans les composants.
- **RLS toujours actif.** Ne jamais bypass avec service role sauf jobs serveur isolés.
- **Anthropic SDK** : prompt caching activé sur le system prompt. Ne pas casser la cache key.
- **Composants UI** dans `src/components/ui/*` : extension par wrapper, pas modification directe.

## 4. Supabase — règles spécifiques

- **Client browser** : `src/lib/supabase/client.ts`
- **Client server (RLS user)** : `src/lib/supabase/server.ts`
- **Client middleware** : `src/lib/supabase/middleware.ts`
- **Service role** : isolé, jamais importé côté `'use client'`. Marque le fichier avec `import 'server-only'`.
- **Migrations** : SQL plain dans `supabase/migrations/`. Format `NNN_description.sql`.
- **Helpers RLS** : `user_in_project`, `user_can_write_project` — utiliser au lieu de re-checker en TS.
- **Toute nouvelle table** = RLS activée + policies explicites + index sur FK.

## 5. Anthropic SDK — règles

- **Prompt caching** : ne jamais modifier le system prompt sans benchmark cache hit avant/après.
- **Modèle par défaut** : Haiku 4.5 pour reformulation/classification, Sonnet 4.6 pour enrichissement.
- **Streaming** sur outputs longs côté UI.
- **Parse JSON loose** (markdown wrappers, trailing commas) — ne pas durcir sans gérer le fallback.
- **Watermark** systématique sur tout contenu généré (pour transparence vs LLM).

## 6. Tests

- **Pas de tests pour l'instant** dans le repo (V1 sprint nuit). Priorité : ajouter Vitest + tests integration sur les Server Actions / Route Handlers critiques avant tout refacto majeur.
- **Pas de mock Supabase** — vraie DB de test (Supabase local ou branch).
- **Run avant ship** : `pnpm typecheck && pnpm lint`.

## 7. Performance & sécurité

- **`select` Supabase explicite** : jamais `.select('*')` sur listes — colonnes nommées.
- **Pagination obligatoire** sur listes (cursor-based).
- **`<Image>` next/image** toujours.
- **Server-only** pour modules à secrets (Anthropic key, service role, Resend).
- **Rate limit** sur API publiques (waitlist) et endpoints AI (coût).

## 8. Comportements interdits

- ❌ Réécrire un fichier entier sans demande.
- ❌ Ajouter une dépendance sans justification.
- ❌ Modifier `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` sans demande.
- ❌ `any`, `// @ts-ignore`, `// eslint-disable` sans justification commentée.
- ❌ Désactiver RLS pour « simplifier ».
- ❌ Bypass middleware auth.
- ❌ Casser le cache Anthropic en touchant le system prompt sans intent explicite.
- ❌ Spammer commentaires « // updated », « // added ».

## 9. Token budget — règles dures

- **Diff unifié uniquement.**
- **Max 200 LOC** par réponse.
- **Pas de répétition** de code inchangé : `// ... (unchanged)`.
- **Pas de récap final** — le diff parle.

## 10. Surgical edits

- **Minimiser les lignes touchées.** Pas de refacto opportuniste.
- **Préserver le formatting** (indent, quotes).
- **Pas de renommage** sauf demande ou nécessité.
- **Pas de réorganisation d'imports** spontanée.
- Problème hors scope vu → noter en 1 ligne en fin de réponse, ne pas agir.

## 11. Hot files & décisions

- Avant **toute modification d'archi** : lire `.claude/hot-files.txt`.
- Avant **toute décision structurelle** : lire les 10 dernières entrées de `DECISIONS.md`.
- Décision passée contredit la proposition → **flag explicitement** avant d'agir.
- Nouvelle décision durable → **append à `DECISIONS.md`** dans le commit.

## 12. Commit & PR

- **Conventional commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- **1 PR = 1 intent.**
- **Titre PR ≤ 70 chars.** Body : Summary (3 bullets) + Test plan + Risks.
- Pas de `--no-verify` sauf demande.

## 13. Gestion contexte

- Travail folder-only quand possible (`src/app/app/`, `src/lib/supabase/`, `src/app/api/`).
- `/compact` toutes les 25 réponses.
- `/clear` entre sujets indépendants.
- `grep`/`glob` ciblés > Read aveugle.
