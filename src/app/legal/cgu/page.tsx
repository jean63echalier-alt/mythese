export const metadata = { title: "CGU — Mythese" };

export default function CguPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-6">Conditions générales d'utilisation</h1>
      <p className="text-sm text-[var(--color-ink-soft)] italic">
        Document en cours de rédaction. Pack CGU/CGV/RGPD fourni avant le lancement payant.
      </p>
      <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
        Engagement provisoire : Mythese est un coach méthodologique. L'utilisateur reste
        seul auteur et seul responsable du contenu de son mémoire de recherche. Aucun
        output Mythese n'est destiné à être copié-collé dans un travail académique sans
        reformulation et appropriation par l'utilisateur.
      </p>
    </div>
  );
}
