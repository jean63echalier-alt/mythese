export const metadata = { title: "Mentions légales — Mythese" };

export default function MentionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-6">Mentions légales</h1>
      <div className="space-y-4 text-sm text-[var(--color-ink-soft)]">
        <p>
          <strong>Éditeur :</strong> Mythese — auto-entrepreneur (SIRET en cours de
          réactivation).
        </p>
        <p>
          <strong>Hébergeur :</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA
          91789, USA.
        </p>
        <p>
          <strong>Base de données :</strong> Supabase (Region eu-west-1, Ireland).
        </p>
        <p>
          <strong>Contact :</strong> bonjour@mythese.com
        </p>
        <p className="italic text-xs text-[var(--color-ink-muted)]">
          Mentions complètes (CGU, CGV, politique de confidentialité RGPD) en cours de rédaction —
          pack juridique fourni avant le lancement payant.
        </p>
      </div>
    </div>
  );
}
