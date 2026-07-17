# Architecture Decisions — MyThese

> Append-only. Plus récente en haut.
> Lire les 10 dernières entrées AVANT toute modification structurelle.

---

## 2026-07-17 — Éditeur : panneau Sources/bibliographie, persona Directeur de recherche, import BibTeX (pas Zotero API)

**Decision** : trois ajouts à l'éditeur, tous en state client mock (aucune persistance Supabase, cohérent avec la décision « prototype d'abord » déjà active) :
1. Panneau **Sources** (`_sources-panel.tsx`) : ajout manuel, insertion de citation au curseur réel dans le contentEditable, génération d'une section bibliographie triable.
2. Persona **Directeur de recherche** : deuxième onglet IA dans le chat, ton socratique/exigeant (`DIRECTEUR_SYSTEM_PROMPT`), même garde-fou anti-ghostwriting que le coach. `/api/editeur/chat` accepte désormais `persona: "coach" | "directeur"`.
3. **Import BibTeX** (`_bibtex.ts`, parser regex maison) au lieu d'une intégration API Zotero directe.

**Why** :
- Demande de Jean, à partir d'un prototype HTML externe (`CLAUDEmythese.md` / démo statique) déjà dépassé par le vrai code de l'éditeur sur presque tous les autres points (export docx/pdf, chat connecté, édition chirurgicale) — seuls Sources/Directeur/Zotero étaient de vrais gaps.
- Zotero API réelle nécessite un token utilisateur (OAuth ou clé API manuelle) que je ne peux pas obtenir de façon sûre en session non interactive ; Zotero exporte nativement en BibTeX, donc l'import BibTeX couvre le besoin réel (Zotero, Mendeley, EndNote) sans dépendance externe ni secret à gérer. Zotero API directe reste à évaluer si le besoin d'auto-sync (sans export manuel) se confirme.

**Tradeoffs** :
- ✅ Gain : les 3 features s'intègrent sans toucher au modèle de blocs existant (citation = `<span>` inline, bibliographie = `<section id="bibliographie-section">` — parsée comme blocs séparés par `_parse-html.ts` via son fallback `walk()`, donc compatible export docx/pdf sans modif de `_parse-html.ts`)
- ❌ Coût : pas de sync Zotero automatique, l'étudiant doit exporter son .bib manuellement à chaque mise à jour de sa bibliothèque
- ⚠️ Risque : champs de source (auteur/titre/éditeur) échappés (`escapeHtml`) avant insertion dans le HTML de l'éditeur — un import BibTeX est un contenu externe non fiable, sans cet échappement un .bib malveillant aurait pu injecter du HTML/JS dans le document (XSS) au moment de citer/générer la bibliographie

**Consequences** :
- `TextePanel` passe en `forwardRef` (`TextePanelHandle.insertHtml` / `appendOrReplaceBlock`) — premier composant de l'éditeur à exposer une API impérative, pattern à réutiliser si d'autres panneaux doivent écrire dans le document
- `ChatPanel` : le header passe de deux boutons à un `<select>` (4 personas : ia/directeur/prof/sources) — prévoir un vrai composant de tabs si un 5e onglet arrive
- Au câblage Supabase futur : `sources` doit devenir une table scoped par section ou projet (comme `sections`/`annotations`)

**Status** : `active`

---

## 2026-07-17 (nuit, suite) — Chat général de l'éditeur connecté à Anthropic (réflexion méthodologie)

**Decision** : le Chat IA de l'éditeur, hors sélection de texte (onglet conversation libre), appelle désormais un vrai endpoint Anthropic (`POST /api/editeur/chat`) au lieu de `REPONSES_IA_MOCK`. Réutilise `MYTHESE_SYSTEM_PROMPT`/`systemBlocks()` déjà défini dans `src/lib/anthropic.ts` (coach méthodologique, jamais rédacteur) — pas de nouveau prompt, cache Anthropic préservé. Contexte envoyé : historique du chat (max 20 messages), nom + contenu HTML de la section active.

**Why** :
- Explicitement noté « hors scope » dans la décision du soir même (ligne édition chirurgicale ci-dessous) : « Toute future édition « chat général » (hors sélection) reste sur `REPONSES_IA_MOCK` » — demande directe de Jean pour lever ce hors-scope.
- `MYTHESE_SYSTEM_PROMPT` était déjà écrit pour ce cas d'usage précis (conseil/réflexion, pas rédaction) mais jamais branché sur un endpoint réel avant ce commit.

**Tradeoffs** :
- ✅ Gain : le chat général répond désormais avec de vrais conseils méthodologiques ancrés sur la section en cours, cohérent avec le module d'édition chirurgicale déjà réel.
- ⚠️ Risque : aucun gate ni rate-limit sur `/api/editeur/chat` (auth Supabase seulement) — même dette déjà notée pour `/api/editeur/edit-suggestion`, non comblée ici (hors scope).

**Consequences** :
- Historique du chat (`chatIa`) reste en state client uniquement, aucune persistance Supabase ajoutée — décision « prototype d'abord » toujours active.
- Le compteur de crédit (`credit.utilise`) reste incrémenté côté client (mock), pas connecté à un vrai quota serveur.

**Status** : `active`

---

## 2026-07-17 (nuit) — Édition live IA : chirurgicale au niveau bloc, jamais de rédaction

**Decision** : le Chat IA de l'éditeur peut désormais modifier le document en direct — l'étudiant sélectionne un passage, demande une retouche, l'IA (vrai appel Anthropic via `POST /api/editeur/edit-suggestion`) propose un diff avant/après affiché **dans le bloc ciblé** (pas en fin de section), que l'étudiant accepte ou rejette. L'ancien flow « Insérer dans le document » (append aveugle en fin de section, `_editeur.tsx`/`_texte-panel.tsx` avant ce commit) est retiré.

**Why** :
- Demande explicite de Jean : « le chat IA doit interagir directement avec l'éditeur de texte... modification en direct », modèle Claude Code/Cowork appliquant un diff sur un fichier
- ⚠️ Contradiction identifiée et tranchée AVEC Jean avant d'implémenter : `MYTHESE_SYSTEM_PROMPT` (`src/lib/anthropic.ts`) interdit explicitement à l'IA de produire de la prose à coller (« pas un rédacteur fantôme »). Décision : l'édition live reste **chirurgicale** — orthographe/grammaire/temps verbaux/clarté sur ce qui existe déjà, jamais de paragraphe inventé. Nouveau `EDIT_SYSTEM_PROMPT` séparé porte cette règle, avec refus explicite si l'instruction demande de la rédaction.
- Unité d'édition = **bloc entier** (`<p>`, `<li>`, titre — enfant direct du conteneur `contentEditable`), pas une sous-chaîne : une tentative précédente de surlignage par recherche de sous-chaîne HTML a déjà été abandonnée le 2026-07-17 (superseded, plus bas) pour incompatibilité avec le HTML riche. Remplacer un nœud entier (`outerHTML`) est sûr ; découper à l'intérieur ne l'est pas.

**Tradeoffs** :
- ✅ Gain : édition ciblée et réversible (accepter/rejeter), garde-fou anti-ghostwriting explicite et testable
- ❌ Coût : granularité bloc, pas phrase — une retouche sur une longue liste `<ul>` réécrit toute la liste (l'enfant direct de l'éditeur est le `<ul>`, pas le `<li>`)
- ⚠️ Risque : aucun rate-limit dédié sur `/api/editeur/edit-suggestion` (seule l'auth Supabase protège l'endpoint) — dette à combler si abus constaté, CLAUDE.md §7 le demande mais rien d'existant à réutiliser dans le repo

**Consequences** :
- Sections/annotations/chat restent en state client mock (décision « prototype d'abord » du 2026-07-17 matin toujours active) — seul l'appel IA de suggestion est réel, aucune persistance Supabase ajoutée
- `ChatMessage.edit?: EditProposal` relie un message du chat à sa proposition de diff ; le statut (`pending`/`accepted`/`rejected`) s'affiche dans le chat, la review se fait dans le document
- Toute future édition « chat général » (hors sélection) reste sur `REPONSES_IA_MOCK` — hors scope de cette décision

**Status** : `active`

---

## 2026-07-17 (soir) — Plan de recherche gaté au niveau compte (annule partiellement la décision du matin)

**Decision** : Le Plan de recherche (`/api/plan/classifier`, `/api/plan/conseil-ia`) est maintenant gaté, mais au niveau **compte** (`isAccountUnlocked`) et non projet — 0 usage gratuit, débloqué par n'importe quel paiement actif (abo 19€/mois OU un one-shot 39€, même sans projet précis associé).

**Why** :
- Jean a explicitement demandé que le Plan de recherche soit payant après avoir testé la beta
- ⚠️ Cette décision **contredit partiellement** l'entrée du 2026-07-17 (matin) qui laissait le Plan de recherche hors gate — la raison invoquée alors (pas de `project_id`) reste vraie mais n'empêchait pas un gate compte-scoped, qui ne nécessite aucune migration de schéma
- Le one-shot 39€ déclenché depuis le Plan de recherche crée un paiement avec `project_id = null` (colonne déjà nullable) — ne débloque aucun projet Module 1/2 spécifique, mais compte pour `isAccountUnlocked`

**Tradeoffs** :
- ✅ Gain : aucune migration nécessaire (`payments.project_id` déjà nullable), cohérent avec le pricing "1 des 2 forfaits débloque tout"
- ❌ Coût : un one-shot 39€ payé "à vide" (sans projet) ne débloque toujours pas un projet spécifique — UX à clarifier si confusion des testeurs
- ⚠️ Risque : `isAccountUnlocked` et `isProjectUnlocked` sont deux fonctions proches mais non factorisées (dupliquées volontairement pour rester simples) — si la logique de déblocage change, mettre à jour les deux

**Consequences** :
- `src/lib/gate.ts` : nouvelle fonction `isAccountUnlocked()`
- `/api/checkout` : `projectId` redevenu optionnel pour `type: "one_shot"` (avant : requis)
- `PaywallModal` : prop `projectId` optionnelle + `title` personnalisable

**Status** : `active`

---

## 2026-07-17 — Freemium gate + Stripe : scope Module 1/2 uniquement, pas le Plan de recherche

**Decision** : Le gate freemium (1 usage gratuit par projet, puis mur 39€ one-shot / 19€ mois) s'applique à `searches` (Module 1) et `problematiques` (Module 2) — tous deux `project_id`-scoped. Le Plan de recherche (`/app/plan`, `soumissions`/`conseils_ia`) reste hors gate : il est `user_id`-scoped (cf. décision 2026-06-14), pas rattachable à un projet sans restructuration du schéma.

**Why** :
- Cohérent avec le pricing déjà verrouillé au wiki 2026-05-08 ("Découverte : 1 état de l'art 10 sources + 1 problématique")
- Gater le Plan de recherche nécessiterait de lui ajouter un `project_id`, hors scope de cette session
- Les coûts API réels (OpenAlex + Sonnet enrich, Sonnet propositions) sont concentrés sur Module 1/2 — le gate cible la friction là où le coût existe

**Tradeoffs** :
- ✅ Gain : gate implémentable sans toucher au schéma `plan_etapes_template`/`soumissions`, testeurs beta gardent le Plan de recherche en illimité
- ❌ Coût : le Plan de recherche reste gratuit illimité même pour un compte jamais payant — pas de garde-fou usage sur ce module
- ⚠️ Risque : si le Plan de recherche devient coûteux en tokens (conseils croisés Claude+GPT), revisiter le gate à ce moment

**Consequences** :
- Nouvelle table `payments` (migration `0005_payments.sql`) + `profiles.stripe_customer_id`/`subscription_status`, écriture réservée au service role (webhook)
- `src/lib/gate.ts` : `checkGate()` réutilisable pour toute future route project-scoped à gater
- Testeurs beta (5-20 étudiants) passent par le même gate que tout utilisateur — pas de bypass compte

**Status** : `active`

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

## 2026-07-17 — Éditeur de rédaction : prototype UI d'abord, pas de câblage Supabase

**Decision** : livrer l'éditeur 3 colonnes (`/app/editeur/[id]`) en composant client autonome avec données mock, sans migration ni API route, avant tout branchement backend.

**Why** :
- L'archi actuelle est en pages séparées par section (état de l'art, problématique) — l'éditeur unifié est une rupture de layout et de flow qu'il faut valider en UX avant d'engager un schéma DB
- Spec fournie recommandait explicitement un composant autonome (§5 de la spec source)
- Route hors du layout `projects/[id]` (qui contraint à `max-w-5xl` + tabs) pour permettre le plein écran 3 colonnes

**Tradeoffs** :
- ✅ Gain : itération rapide sur l'UX sans toucher au schéma de prod
- ❌ Coût : `Section`, `Annotation`, `ChatMessage`, `CreditUsage` (types.ts) ne persistent pas — tout est perdu au reload
- ⚠️ Risque : si le mock diverge trop du besoin réel, le futur câblage Supabase demandera un rework

**Consequences** :
- Prochaine étape si validé : migration `sections`/`annotations`/`chat_messages`/`credit_usage` + RLS + route handlers, en remplaçant `_mock-data.ts`
- Le contentEditable ne recalcule le surlignage qu'au montage de section (pas à chaque frappe) pour ne pas perdre le curseur — limitation connue, acceptable pour le prototype
- Sélecteur "Vue Étudiant/Professeur" dans la toolbar est un outil de démo, à remplacer par le rôle réel (`project_members.role`) au câblage

**Status** : `superseded` (voir décision du même jour ci-dessous — le surlignage par recherche de texte est abandonné)

---

## 2026-07-17 — Éditeur riche (execCommand) + export DOCX/PDF, HTML devient la source de vérité

**Decision** : le Bloc Texte devient un vrai éditeur formaté (gras/italique/souligné/titres/listes via `document.execCommand`, pas de lib type TipTap), `section.contenu` passe de texte brut à HTML sérialisé, et deux nouvelles dépendances (`docx`, `jspdf`) permettent d'exporter le mémoire complet en `.docx`/`.pdf` depuis le menu Fichier.

**Why** :
- Demande explicite de Jean : "un vrai éditeur de texte... + exporter en docx et pdf"
- `execCommand` reste dépréciée mais universellement supportée ; alternative (Selection/Range fait main) = bien plus de code pour le même résultat, TipTap explicitement écarté par la spec source (§5)
- `docx`/`jspdf` : purs JS, aucun binaire natif, seules libs viables sans Puppeteer/LibreOffice headless (incompatible Vercel serverless)

**Tradeoffs** :
- ✅ Gain : mise en forme réelle + export utilisable immédiatement, sans backend
- ❌ Coût : l'ancien surlignage inline des annotations/fautes (recherche de sous-chaîne dans le texte brut) est **abandonné** — incompatible avec du HTML riche (une phrase annotée peut chevaucher une balise `<b>`). Fautes orthographiques : on s'appuie maintenant sur `spellCheck` natif du navigateur au lieu d'un mock de mots codés en dur — plus réaliste, mais dépend du dictionnaire de l'OS/navigateur de l'utilisateur
- ⚠️ Risque : le PDF ne fait pas de wrap Unicode avancé (jsPDF + police helvetica standard) — accents et ligatures françaises à vérifier sur un vrai mémoire long

**Consequences** :
- `_parse-html.ts` est la seule source de vérité pour convertir le HTML de l'éditeur en blocs portables (heading/paragraph/list-item + runs bold/italic/underline), consommée par `_export-docx.ts` ET `_export-pdf.ts` — ne pas dupliquer cette logique ailleurs
- Le contenu n'est plus synchronisé en state à chaque frappe mais **au blur** de l'éditeur (`onContentChange`) — corrige au passage une perte de données silencieuse : avant ce fix, changer de section sans blur préalable perdait les frappes non capturées
- Au câblage Supabase : `sections.contenu` doit être stocké comme HTML (colonne `text`/`jsonb`), pas comme texte brut

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
