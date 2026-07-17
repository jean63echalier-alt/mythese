import { WaitlistForm } from "./_components/waitlist-form";
import { PlanPreview } from "./_components/plan-preview";
import { ExperienceHero } from "./_components/experience-hero";

export default function HomePage() {
  return (
    <>
      {/* HERO IMMERSIF — entrée dans l'expérience (clic ou scroll) */}
      <ExperienceHero />

      {/* PORTAIL DE L'EXPÉRIENCE — découvert au scroll */}
      <section id="decouvrir" className="relative border-y border-[var(--color-line)] py-24">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[var(--color-burgundy)]">
            L&apos;expérience
          </p>
          <h2 className="mb-5 font-serif text-3xl text-[var(--color-ink)] md:text-5xl">
            Quatre chapitres pour comprendre
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-[var(--color-ink-soft)]">
            De la page blanche à l&apos;œuvre intègre — une traversée immersive de
            la méthode MyThèse, où la transparence du dialogue IA devient une
            preuve d&apos;intégrité.
          </p>
          <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { n: "01", t: "La Page Blanche" },
              { n: "02", t: "Le Dialogue des Esprits" },
              { n: "03", t: "La Validation" },
              { n: "04", t: "L'Œuvre Intègre" },
            ].map((c) => (
              <div
                key={c.n}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-left"
              >
                <div className="mb-2 font-serif text-2xl text-[var(--color-burgundy)]">
                  {c.n}
                </div>
                <div className="text-sm leading-snug text-[var(--color-ink-soft)]">{c.t}</div>
              </div>
            ))}
          </div>
          <a
            href="/experience.html"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-burgundy)] px-9 py-4 text-sm uppercase tracking-[0.2em] text-white transition-colors hover:bg-[var(--color-burgundy-soft)]"
          >
            Entrer dans l&apos;expérience →
          </a>
        </div>
      </section>

      {/* BANDEAU CONFIANCE */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-cream)] py-8">
        <div className="mx-auto grid max-w-5xl gap-6 px-5 text-sm md:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <div className="font-medium text-[var(--color-ink)]">Sources peer-reviewed</div>
              <div className="text-xs text-[var(--color-ink-muted)]">via OpenAlex (250M papers)</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🇫🇷</span>
            <div>
              <div className="font-medium text-[var(--color-ink)]">Méthodologie française</div>
              <div className="text-xs text-[var(--color-ink-muted)]">problématique, plan binaire/ternaire</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <div className="font-medium text-[var(--color-ink)]">Jamais à ta place</div>
              <div className="text-xs text-[var(--color-ink-muted)]">watermark anti-fraude sur chaque output</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLÈME */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="mb-3 text-center font-serif text-3xl font-medium text-[var(--color-ink)] md:text-4xl">
            Trois douleurs que tout étudiant connaît
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-[var(--color-ink-soft)]">
            Mythese ne les supprime pas. Mythese te donne les outils pour les
            surmonter — sans tricher.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "🔎",
                title: "État de l'art",
                desc: "Tu passes des semaines à chercher. Tu finis avec 200 onglets ouverts et 15 sources potables. Ton directeur en demande 50.",
              },
              {
                icon: "🎯",
                title: "Problématique",
                desc: "Tu sais ce qui t'intéresse. Tu n'arrives pas à le formuler en question de recherche claire et défendable.",
              },
              {
                icon: "🏛️",
                title: "Structure",
                desc: "Plan binaire ou ternaire ? Hypothèses ou propositions ? La méthodo française, personne ne te l'a vraiment apprise.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-cream)] p-6"
              >
                <div className="mb-3 text-3xl">{p.icon}</div>
                <div className="mb-2 font-serif text-xl font-medium text-[var(--color-ink)]">
                  {p.title}
                </div>
                <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section
        id="solution"
        className="border-y border-[var(--color-line)] bg-[var(--color-cream)] py-20"
      >
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="mb-3 text-center font-serif text-3xl font-medium text-[var(--color-ink)] md:text-4xl">
            La méthode et les sources.
            <br />
            Le raisonnement, c&apos;est toi.
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-[var(--color-ink-soft)]">
            Mythese fonctionne en modules. Chaque module produit des suggestions
            courtes, jamais de prose à coller.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                num: "1",
                title: "État de l'art",
                desc: "20 sources peer-reviewed pertinentes en 30 secondes. Résumé 4 lignes + pertinence + citation APA prête à copier.",
                badge: "Disponible V1",
              },
              {
                num: "2",
                title: "Coach problématique",
                desc: "8 questions socratiques. 3 propositions de problématique reformulées avec plan binaire/ternaire détaillé.",
                badge: "Disponible V1",
              },
              {
                num: "3",
                title: "Relecture méthodo",
                desc: "Upload ton brouillon. Mythese commente comme un directeur de mémoire. Jamais de réécriture.",
                badge: "V2 — bientôt",
              },
            ].map((s) => (
              <div
                key={s.num}
                className="relative rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-6"
              >
                <div className="absolute -left-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-burgundy)] font-serif font-semibold text-white shadow-md">
                  {s.num}
                </div>
                <div className="mb-2 mt-1 font-serif text-xl font-medium text-[var(--color-ink)]">
                  {s.title}
                </div>
                <p className="mb-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {s.desc}
                </p>
                <span className="rounded border border-[var(--color-line)] bg-[var(--color-cream)] px-2 py-1 text-xs text-[var(--color-ink-muted)]">
                  {s.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLAN DE RECHERCHE PREVIEW */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="mb-3 text-center font-serif text-3xl font-medium text-[var(--color-ink)] md:text-4xl">
            Ton mémoire, en 6 étapes claires
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-[var(--color-ink-soft)]">
            Chaque soumission met à jour ton plan de recherche. Tu sais toujours
            où tu en es — et où l&apos;IA pense qu&apos;il faut creuser.
          </p>
          <PlanPreview />
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section
        id="comment"
        className="border-y border-[var(--color-line)] bg-[var(--color-cream)] py-20"
      >
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="mb-12 text-center font-serif text-3xl font-medium text-[var(--color-ink)] md:text-4xl">
            Comment ça marche
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                num: "01",
                title: "Crée ton projet",
                desc: "Titre, discipline, niveau, problématique pressentie. C'est ton espace de travail.",
              },
              {
                num: "02",
                title: "Invite ton directeur",
                desc: "Ou un pair, un mentor. Auteur, directeur, lecteur — chacun ses droits. Personne n'écrit à ta place.",
              },
              {
                num: "03",
                title: "Travaille",
                desc: "Module 1 sort des sources. Module 2 te coache sur la problématique. Toi, tu reformules et tu rédiges.",
              },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="mb-3 font-serif text-5xl text-[var(--color-burgundy)] opacity-40">
                  {step.num}
                </div>
                <div className="mb-2 font-serif text-xl font-medium text-[var(--color-ink)]">
                  {step.title}
                </div>
                <p className="mx-auto max-w-xs text-sm text-[var(--color-ink-soft)]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WATERMARK PROMISE */}
      <section className="bg-[var(--color-burgundy)] py-16 text-white">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="font-serif text-2xl leading-snug md:text-3xl">
            &laquo;&nbsp;Mythèse, c&apos;est ta thèse, ton mémoire,
            <br />
            le couronnement de tes études.
            <br />
            On te donne la méthode et les sources.
            <br />
            <span className="italic text-[var(--color-cream)]">Le raisonnement, c&apos;est toi.</span>
            &nbsp;&raquo;
          </p>
        </div>
      </section>

      {/* FINAL CTA + WAITLIST */}
      <section id="waitlist" className="py-20">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2 className="mb-3 font-serif text-3xl font-medium text-[var(--color-ink)]">
            Rejoins la première promo
          </h2>
          <p className="mb-8 text-[var(--color-ink-soft)]">
            On lance le MVP cette semaine. Place limitée pour avoir Jean au bout
            du fil.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </>
  );
}
