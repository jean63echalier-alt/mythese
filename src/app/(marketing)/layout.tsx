import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-semibold text-[var(--color-burgundy)] tracking-tight">
            Mythèse
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/#solution" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              Le produit
            </Link>
            <Link href="/#comment" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              Comment ça marche
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-md border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-cream)] transition-colors"
            >
              Se connecter
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--color-line)] bg-[var(--color-cream)] mt-20">
        <div className="max-w-6xl mx-auto px-5 py-10 text-sm text-[var(--color-ink-soft)] grid md:grid-cols-3 gap-8">
          <div>
            <div className="font-serif text-xl text-[var(--color-burgundy)] mb-2">Mythèse</div>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Le coach IA qui structure ton mémoire de recherche.<br />
              Sources peer-reviewed. Méthodo française. Jamais à ta place.
            </p>
          </div>
          <div>
            <div className="font-medium text-[var(--color-ink)] mb-2">Produit</div>
            <ul className="space-y-1 text-xs">
              <li><Link href="/#solution">Modules</Link></li>
              <li><Link href="/#comment">Comment ça marche</Link></li>
              <li><Link href="/login">Se connecter</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-[var(--color-ink)] mb-2">Légal</div>
            <ul className="space-y-1 text-xs">
              <li><Link href="/legal/mentions">Mentions légales</Link></li>
              <li><Link href="/legal/cgu">CGU</Link></li>
              <li><Link href="/legal/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--color-line)] py-4 text-center text-xs text-[var(--color-ink-muted)]">
          © 2026 Mythese — Mention nécessaire avant lancement payant
        </div>
      </footer>
    </div>
  );
}
