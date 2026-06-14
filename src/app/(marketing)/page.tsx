import { WaitlistForm } from "./_components/waitlist-form";
import { PlanPreview } from "./_components/plan-preview";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 pt-20 pb-16 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-burgundy)] mb-4">
            Coach méthodologique IA · Pas un rédacteur fantôme
          </p>
          <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] font-semibold text-[var(--color-ink)]">
            Le coach IA qui structure ton<br />
            <span className="text-[var(--color-burgundy)]">mémoire de recherche</span>.
          </h1>
          <p className="mt-6 text-lg text-[var(--color-ink-soft)] max-w-2xl mx-auto">
            Sources peer-reviewed via OpenAlex (250M papers). Méthodologie française stricte.
            <strong className="text-[var(--color-ink)]"> Jamais à ta place.</strong>
          </p>

          <div id="waitlist" className="mt-10 max-w-xl mx-auto">
            <WaitlistForm />
          </div>

          <p className="mt-5 text-xs text-[var(--color-ink-muted)]">
            <a href="#comment" className="underline hover:text-[var(--color-ink)]">Voir comment ça marche →</a>
          </p>
        </div>
      </section>

      {/* BANDEAU CONFIANCE */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-cream)] py-8">
        <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-3 gap-6 text-sm">
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
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-3">
            Trois douleurs que tout étudiant connaît
          </h2>
          <p className="text-center text-[var(--color-ink-soft)] mb-12 max-w-2xl mx-auto">
            Mythese ne les supprime pas. Mythese te donne les outils pour les surmonter — sans tricher.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
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
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-6"
              >
                <div className="text-3xl mb-3">{p.icon}</div>
                <div className="font-serif text-xl font-semibold mb-2">{p.title}</div>
                <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section id="solution" className="py-20 bg-[var(--color-cream)] border-y border-[var(--color-line)]">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-3">
            La méthode et les sources.<br />Le raisonnement, c'est toi.
          </h2>
          <p className="text-center text-[var(--color-ink-soft)] mb-12 max-w-2xl mx-auto">
            Mythese fonctionne en modules. Chaque module produit des suggestions courtes, jamais de prose à coller.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
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
                className="rounded-lg bg-[var(--color-paper)] border border-[var(--color-line)] p-6 relative"
              >
                <div className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-[var(--color-burgundy)] text-white font-serif font-semibold flex items-center justify-center shadow-md">
                  {s.num}
                </div>
                <div className="font-serif text-xl font-semibold mb-2 mt-1">{s.title}</div>
                <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed mb-3">{s.desc}</p>
                <span className="text-xs px-2 py-1 rounded bg-[var(--color-cream)] border border-[var(--color-line)] text-[var(--color-ink-muted)]">
                  {s.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLAN DE RECHERCHE PREVIEW */}
      <section className="py-20 bg-[var(--color-cream)] border-y border-[var(--color-line)]">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-3">
            Ton mémoire, en 6 étapes claires
          </h2>
          <p className="text-center text-[var(--color-ink-soft)] mb-12 max-w-2xl mx-auto">
            Chaque soumission met à jour ton plan de recherche. Tu sais toujours où tu en es —
            et où l'IA pense qu'il faut creuser.
          </p>
          <PlanPreview />
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment" className="py-20">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-12">
            Comment ça marche
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
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
                <div className="font-serif text-5xl text-[var(--color-burgundy)] mb-3 opacity-30">
                  {step.num}
                </div>
                <div className="font-serif text-xl font-semibold mb-2">{step.title}</div>
                <p className="text-sm text-[var(--color-ink-soft)] max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WATERMARK PROMISE */}
      <section className="py-16 bg-[var(--color-burgundy)] text-white">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <p className="font-serif text-2xl md:text-3xl leading-snug">
            "Mythèse, c'est ta thèse, ton mémoire,<br />
            le couronnement de tes études.<br />
            On te donne la méthode et les sources.<br />
            <span className="italic">Le raisonnement, c'est toi.</span>"
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="font-serif text-3xl font-semibold mb-3">
            Rejoins la première promo
          </h2>
          <p className="text-[var(--color-ink-soft)] mb-8">
            On lance le MVP cette semaine. Place limitée pour avoir Jean au bout du fil.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </>
  );
}
